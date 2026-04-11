"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Annotation, ConflictAlert } from "@/lib/types";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Pose landmark connections for drawing the skeleton
const POSE_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso
  [23, 24], // hips
];

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  faceLandmarks: NormalizedLandmark[] | null;
  poseLandmarks: NormalizedLandmark[] | null;
  annotations: Annotation[];
  coachingAnnotations?: Annotation[];
  conflictAlerts?: ConflictAlert[];
}

export default function VideoFeed({
  videoRef,
  canvasRef,
  faceLandmarks,
  poseLandmarks,
  annotations,
  coachingAnnotations = [],
  conflictAlerts = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Draw skeleton overlay on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas to video dimensions
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // Draw pose skeleton
    if (poseLandmarks) {
      // Draw connections (lines)
      ctx.strokeStyle = "#00e676";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;

      for (const [start, end] of POSE_CONNECTIONS) {
        const a = poseLandmarks[start];
        const b = poseLandmarks[end];
        if (!a || !b) continue;

        ctx.beginPath();
        // Mirror X for selfie view
        ctx.moveTo((1 - a.x) * w, a.y * h);
        ctx.lineTo((1 - b.x) * w, b.y * h);
        ctx.stroke();
      }

      // Draw landmark dots
      ctx.fillStyle = "#00e676";
      ctx.globalAlpha = 0.9;
      for (const idx of [11, 12, 13, 14, 15, 16, 23, 24]) {
        const lm = poseLandmarks[idx];
        if (!lm) continue;
        ctx.beginPath();
        ctx.arc((1 - lm.x) * w, lm.y * h, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw subtle face tracking indicator (small dots at key points, not full outline)
    if (faceLandmarks) {
      ctx.fillStyle = "#7c4dff";
      ctx.globalAlpha = 0.5;

      // Just draw small dots at key face points (nose tip, chin, forehead, ears)
      const keyPoints = [1, 152, 10, 234, 454]; // nose tip, chin, forehead, left ear, right ear
      for (const idx of keyPoints) {
        const lm = faceLandmarks[idx];
        if (!lm) continue;
        const x = (1 - lm.x) * w;
        const y = lm.y * h;
        ctx.beginPath();
        ctx.arc((1 - lm.x) * w, lm.y * h, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  }, [faceLandmarks, poseLandmarks, canvasRef, videoRef]);

  // Annotation colors
  const annotationColors = {
    good: { bg: "bg-good/20", text: "text-good", border: "border-good/40" },
    warning: { bg: "bg-warning/20", text: "text-warning", border: "border-warning/40" },
    bad: { bg: "bg-bad/20", text: "text-bad", border: "border-bad/40" },
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-bg-surface rounded-lg overflow-hidden">
      {/* Webcam video (mirrored for selfie view) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
      />

      {/* Canvas overlay for skeleton drawing */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Floating annotations */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        {annotations.map((annotation) => {
          const colors = annotationColors[annotation.type];
          return (
            <div
              key={annotation.id}
              className={`annotation px-3 py-1 rounded-md text-xs font-semibold
                         ${colors.bg} ${colors.text} border ${colors.border} backdrop-blur-sm`}
            >
              {annotation.text}
            </div>
          );
        })}
      </div>

      {/* Conflict detection alerts (legal scenario) */}
      {conflictAlerts.length > 0 && (
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end max-w-[55%]">
          {conflictAlerts.slice(-4).map((alert) => (
            <div
              key={alert.id}
              className={`annotation px-2.5 py-1 rounded-md text-[11px] font-semibold backdrop-blur-md border shadow-lg flex items-center gap-1.5
                ${alert.risk === "high" ? "bg-bad/20 text-bad border-bad/40" :
                  alert.risk === "medium" ? "bg-warning/20 text-warning border-warning/40" :
                  "bg-good/20 text-good border-good/40"}`}
            >
              <span className="shrink-0">{alert.risk === "high" ? "!!" : "!"}</span>
              <span className="truncate">{alert.entityName}</span>
              <span className="text-[9px] opacity-70 uppercase shrink-0">{alert.risk}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gemini real-time coaching annotations */}
      {coachingAnnotations.length > 0 && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-2 items-end max-w-[60%]">
          {coachingAnnotations.map((annotation) => {
            const colors = annotationColors[annotation.type];
            return (
              <div
                key={annotation.id}
                className={`annotation px-3 py-1.5 rounded-lg text-xs font-medium
                  backdrop-blur-md ${colors.bg} ${colors.text} border ${colors.border}
                  flex items-center gap-2 shadow-lg`}
              >
                <span className="text-accent text-[10px] shrink-0">✦</span>
                {annotation.text}
              </div>
            );
          })}
        </div>
      )}

      {/* No camera fallback — shown when no landmarks detected yet */}
      {!faceLandmarks && !poseLandmarks && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-text-secondary text-sm">Starting camera...</p>
        </div>
      )}
    </div>
  );
}
