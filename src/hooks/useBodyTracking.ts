"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import type { BodyMetrics, Annotation } from "@/lib/types";
import {
  FaceLandmarker,
  PoseLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// MediaPipe landmark indices
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const LEFT_EYE_INNER = 133;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const NOSE = 0;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

// Sliding window config
const WINDOW_SIZE_MS = 5000;
const STEP_MS = 500;

interface FrameSnapshot {
  timestamp: number;
  eyeContact: boolean;
  wristLeftX: number;
  wristLeftY: number;
  wristRightX: number;
  wristRightY: number;
  shoulderDeltaY: number;
  spineAngle: number;
  wristsInsideTorso: boolean;
}

export function useBodyTracking() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const snapshotsRef = useRef<FrameSnapshot[]>([]);
  const lastWindowRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsCheckTimeRef = useRef<number>(0);
  const droppedPoseRef = useRef<boolean>(false);

  const [metrics, setMetrics] = useState<BodyMetrics>({
    eyeContactPercent: 0,
    fidgetRate: 0,
    postureScore: 1,
    gestureOpenness: 0.5,
  });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFaceOnly, setIsFaceOnly] = useState(false);
  const [faceLandmarks, setFaceLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [poseLandmarks, setPoseLandmarks] = useState<NormalizedLandmark[] | null>(null);

  // Initialize MediaPipe models — load independently so face works even if pose fails
  const initialize = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      // Load face landmarker first (critical)
      try {
        const face = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
        faceLandmarkerRef.current = face;
        setIsReady(true);
        console.log("Face landmarker loaded");
      } catch (faceErr) {
        console.error("Face landmarker failed:", faceErr);
        setCameraError("Face tracking unavailable. Voice metrics still work.");
        return;
      }

      // Skip Pose model — face landmarks provide sufficient proxies for
      // fidget (head movement) and posture (head tilt) at much better FPS.
      // Pose model drops FPS below 5 on most laptops when combined with Face Mesh.
      setIsFaceOnly(true);
      console.log("Using face-only mode — head movement tracks fidget, head tilt tracks posture");
    } catch (err) {
      console.error("MediaPipe WASM init failed:", err);
      setCameraError("Body tracking unavailable. Conversation + voice metrics still work.");
    }
  }, []);

  // Start webcam — retries if video element isn't mounted yet
  const startCamera = useCallback(async () => {
    // Retry up to 10 times waiting for video element to mount
    let attempts = 0;
    while (!videoRef.current && attempts < 10) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }

    if (!videoRef.current) {
      console.error("Video element never mounted");
      setCameraError("Camera element not found. Try refreshing.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      console.log("Camera started");
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraError("Camera access denied. Grant permission or use voice-only mode.");
    }
  }, []);

  // Detect eye contact from face landmarks
  const detectEyeContact = useCallback(
    (landmarks: NormalizedLandmark[]): boolean => {
      // Get iris center positions
      const leftIrisCenter = averagePoint(LEFT_IRIS.map((i) => landmarks[i]));
      const rightIrisCenter = averagePoint(RIGHT_IRIS.map((i) => landmarks[i]));

      // Get eye corner positions
      const leftEyeCenter = midpoint(
        landmarks[LEFT_EYE_INNER],
        landmarks[LEFT_EYE_OUTER]
      );
      const rightEyeCenter = midpoint(
        landmarks[RIGHT_EYE_INNER],
        landmarks[RIGHT_EYE_OUTER]
      );

      // Eye width for normalization
      const leftEyeWidth = Math.abs(
        landmarks[LEFT_EYE_OUTER].x - landmarks[LEFT_EYE_INNER].x
      );
      const rightEyeWidth = Math.abs(
        landmarks[RIGHT_EYE_OUTER].x - landmarks[RIGHT_EYE_INNER].x
      );

      // Iris deviation from eye center (normalized by eye width)
      const leftDeviation =
        Math.abs(leftIrisCenter.x - leftEyeCenter.x) / (leftEyeWidth || 1);
      const rightDeviation =
        Math.abs(rightIrisCenter.x - rightEyeCenter.x) / (rightEyeWidth || 1);

      // Threshold: 15% — accounts for looking at screen content (not directly at webcam lens)
      // On a laptop, eyes focus on screen center which is below the webcam
      return leftDeviation < 0.15 && rightDeviation < 0.15;
    },
    []
  );

  // Compute body metrics from a window of snapshots (pure function)
  // Tuned for seated laptop user at desk distance (~60-80cm from camera)
  function computeMetrics(snapshots: FrameSnapshot[]): BodyMetrics {
    const eyeContactFrames = snapshots.filter((s) => s.eyeContact).length;
    const eyeContactPercent = (eyeContactFrames / snapshots.length) * 100;

    // Fidget: track nose position variance AND jaw width stability.
    // Nose variance = head movement (shaking, turning rapidly).
    // Jaw width variance = face touching (hand occludes jaw landmarks).
    const positions = snapshots.map((s) => ({
      x: s.wristLeftX, y: s.wristLeftY,
    }));
    const xVar = variance(positions.map((p) => p.x));
    const yVar = variance(positions.map((p) => p.y));
    const movementVar = xVar + yVar;

    // Jaw width variance — detects face touching
    const jawWidths = snapshots.map((s) => s.wristRightX); // jaw width stored here
    const jawVar = variance(jawWidths);

    // Combine both signals
    // Dead zone: 0.0015 for movement (normal nodding/talking OK), 0.001 for jaw
    const MOVE_DEAD = 0.0015;
    const JAW_DEAD = 0.001;

    let fidgetRate = 0;
    const moveExcess = Math.max(0, movementVar - MOVE_DEAD);
    const jawExcess = Math.max(0, jawVar - JAW_DEAD);

    // Movement fidget: head shaking, rapid repositioning (reduced multiplier)
    fidgetRate += Math.min(moveExcess * 400, 8);
    // Jaw fidget: face touching, scratching (reduced multiplier)
    fidgetRate += Math.min(jawExcess * 1000, 6);

    fidgetRate = Math.min(fidgetRate, 15);

    // Posture: for seated person, shoulder delta is usually small (0.01-0.04)
    // and spine angle is moderate (0.7-0.95). Adjust thresholds accordingly.
    const avgShoulderDelta = snapshots.reduce((s, v) => s + v.shoulderDeltaY, 0) / snapshots.length;
    const avgSpineAngle = snapshots.reduce((s, v) => s + v.spineAngle, 0) / snapshots.length;
    // Shoulders: 0.02 delta is normal seated. 0.05+ means tilting significantly.
    const shoulderScore = Math.max(0, 1 - avgShoulderDelta / 0.05);
    // Spine: seated angle is typically 0.7-0.85 (not fully upright). Normalize to that range.
    const spineScore = clampScore((avgSpineAngle - 0.5) / 0.4); // 0.5=slouched(0), 0.9=upright(1)
    const postureScore = shoulderScore * 0.3 + spineScore * 0.7;

    // Openness: at desk, wrists are typically near center (0.3-0.5 from center)
    const avgOpenness = snapshots.reduce((s, v) => {
      return s + (Math.abs(v.wristLeftX - 0.5) + Math.abs(v.wristRightX - 0.5)) / 2;
    }, 0) / snapshots.length;
    // At desk, 0.05 = hands very close, 0.25 = open gestures
    const gestureOpenness = Math.min(1, avgOpenness / 0.25);

    return { eyeContactPercent, fidgetRate, postureScore, gestureOpenness };
  }

  function clampScore(v: number): number {
    return Math.max(0, Math.min(1, v));
  }

  // Generate annotations from metrics
  function buildAnnotations(m: BodyMetrics): Annotation[] {
    const annotations: Annotation[] = [];
    const now = Date.now();
    if (m.eyeContactPercent < 40) annotations.push({ id: `eye-${now}`, text: "EYE CONTACT LOW", type: "bad", timestamp: now });
    else if (m.eyeContactPercent > 70) annotations.push({ id: `eye-${now}`, text: "GOOD EYE CONTACT", type: "good", timestamp: now });
    if (m.fidgetRate > 4) annotations.push({ id: `fidget-${now}`, text: "FIDGETING", type: "bad", timestamp: now });
    if (m.postureScore < 0.4) annotations.push({ id: `posture-${now}`, text: "POSTURE DROPPING", type: "warning", timestamp: now });
    return annotations;
  }

  // Process each frame — use ref for self-reference in requestAnimationFrame
  const processFrameRef = useRef<() => void>(() => {});

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(() => processFrameRef.current());
      return;
    }

    const now = performance.now();
    const timestamp = Math.round(now);

    // FM-2: FPS monitoring — check every 30 frames
    frameCountRef.current++;
    if (frameCountRef.current % 30 === 0) {
      const elapsed = now - fpsCheckTimeRef.current;
      const fps = (30 / elapsed) * 1000;
      fpsCheckTimeRef.current = now;

      // Only drop pose if FPS is critically low (below 5)
      if (fps < 5 && poseLandmarkerRef.current && !droppedPoseRef.current) {
        console.warn(`FPS dropped to ${fps.toFixed(1)} — switching to face-only mode`);
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
        droppedPoseRef.current = true;
        setIsFaceOnly(true);
      }
    }

    // Face landmarks
    let currentFaceLandmarks: NormalizedLandmark[] | null = null;
    if (faceLandmarkerRef.current) {
      const faceResult = faceLandmarkerRef.current.detectForVideo(video, timestamp);
      if (faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
        currentFaceLandmarks = faceResult.faceLandmarks[0];
        setFaceLandmarks(currentFaceLandmarks);
      }
    }

    // Pose landmarks (skipped if dropped due to FPS)
    let currentPoseLandmarks: NormalizedLandmark[] | null = null;
    if (poseLandmarkerRef.current && !droppedPoseRef.current) {
      const poseResult = poseLandmarkerRef.current.detectForVideo(video, timestamp);
      if (poseResult.landmarks && poseResult.landmarks.length > 0) {
        currentPoseLandmarks = poseResult.landmarks[0];
        setPoseLandmarks(currentPoseLandmarks);
      }
    }

    // Build frame snapshot
    // When in face-only mode, use face landmarks as proxies for body metrics:
    // - Nose tip position variance → fidget proxy (head movement)
    // - Head tilt (ear-to-ear Y delta) → posture proxy
    const noseTip = currentFaceLandmarks?.[1]; // landmark 1 = nose tip
    const leftEar = currentFaceLandmarks?.[234];
    const rightEar = currentFaceLandmarks?.[454];
    const chin = currentFaceLandmarks?.[152];
    const forehead = currentFaceLandmarks?.[10];

    let faceFidgetX = 0.5;
    let faceFidgetY = 0.5;
    let facePostureDelta = 0.01;
    let faceSpineProxy = 0.8;

    // ---- FIDGET DETECTION (face-only mode) ----
    // Only detect OBVIOUS fidgeting: rapid head shaking, NOT normal conversation movement.
    // Use a simple approach: store nose position, compute variance over window.
    // The computeMetrics function applies a HIGH threshold so normal movement = 0 fidget.

    let jawWidth = 0.3; // default

    if (noseTip) {
      faceFidgetX = noseTip.x;
      faceFidgetY = noseTip.y;
    }

    if (leftEar && rightEar) {
      facePostureDelta = Math.abs(leftEar.y - rightEar.y);
    }
    if (chin && forehead) {
      faceSpineProxy = Math.abs(chin.y - forehead.y) * 3;
      faceSpineProxy = Math.min(1, Math.max(0, faceSpineProxy));
    }

    // Jaw width — stable when face is untouched, jitters when hand is near face
    const jawLeft = currentFaceLandmarks?.[172];
    const jawRight = currentFaceLandmarks?.[397];
    if (jawLeft && jawRight) {
      jawWidth = Math.abs(jawLeft.x - jawRight.x);
    }

    const snapshot: FrameSnapshot = {
      timestamp: now,
      eyeContact: currentFaceLandmarks
        ? detectEyeContact(currentFaceLandmarks)
        : false,
      // wristLeft = nose position (head movement), wristRight = jaw width (face touching)
      wristLeftX: faceFidgetX,
      wristLeftY: faceFidgetY,
      wristRightX: jawWidth,
      wristRightY: faceFidgetY,
      shoulderDeltaY: facePostureDelta,
      spineAngle: faceSpineProxy,
      wristsInsideTorso: false,
    };

    snapshotsRef.current.push(snapshot);

    // Trim old snapshots (keep last 10 seconds)
    const cutoff = now - 10000;
    snapshotsRef.current = snapshotsRef.current.filter(
      (s) => s.timestamp > cutoff
    );

    // Compute metrics every STEP_MS
    if (now - lastWindowRef.current >= STEP_MS) {
      lastWindowRef.current = now;
      const windowStart = now - WINDOW_SIZE_MS;
      const windowSnapshots = snapshotsRef.current.filter(
        (s) => s.timestamp >= windowStart
      );

      if (windowSnapshots.length > 0) {
        const newMetrics = computeMetrics(windowSnapshots);
        setMetrics(newMetrics);
        setAnnotations(buildAnnotations(newMetrics));
      }
    }

    animFrameRef.current = requestAnimationFrame(() => processFrameRef.current());
  }, [detectEyeContact]);

  // Keep ref in sync with latest processFrame
  useEffect(() => {
    processFrameRef.current = processFrame;
  }, [processFrame]);

  // computeMetrics and buildAnnotations declared above processFrame

  // Start processing loop
  const start = useCallback(async () => {
    await initialize();
    await startCamera();
    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [initialize, startCamera, processFrame]);

  // Stop processing
  const stop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    metrics,
    annotations,
    faceLandmarks,
    poseLandmarks,
    isReady,
    cameraError,
    isFaceOnly,
    start,
    stop,
  };
}

// ---- Helper Functions ----

function averagePoint(
  points: NormalizedLandmark[]
): { x: number; y: number } {
  const x = points.reduce((s, p) => s + p.x, 0) / points.length;
  const y = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { x, y };
}

function midpoint(
  a: NormalizedLandmark,
  b: NormalizedLandmark
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return (
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
  );
}

function computeSpineAngle(landmarks: NormalizedLandmark[]): number {
  // Angle between nose and midpoint of hips relative to vertical
  const nose = landmarks[NOSE];
  const hipMid = midpoint(landmarks[LEFT_HIP], landmarks[RIGHT_HIP]);

  const dx = nose.x - hipMid.x;
  const dy = hipMid.y - nose.y; // y is inverted in screen coords

  // Upright = dy >> dx, angle close to 1
  if (dy <= 0) return 0;
  const angle = dy / Math.sqrt(dx * dx + dy * dy);
  return angle; // 1 = perfectly upright, 0 = horizontal
}

function areWristsCrossed(landmarks: NormalizedLandmark[]): boolean {
  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const nose = landmarks[NOSE];

  // Wrists are crossed if both are inside shoulder width and below chin
  const shoulderLeft = Math.min(leftShoulder.x, rightShoulder.x);
  const shoulderRight = Math.max(leftShoulder.x, rightShoulder.x);

  const leftInside =
    leftWrist.x > shoulderLeft && leftWrist.x < shoulderRight;
  const rightInside =
    rightWrist.x > shoulderLeft && rightWrist.x < shoulderRight;
  const belowChin =
    leftWrist.y > nose.y && rightWrist.y > nose.y;

  return leftInside && rightInside && belowChin;
}
