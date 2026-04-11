"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Room, RoomEvent, Track, LocalTrack, createLocalAudioTrack } from "livekit-client";
import { countFillerWords } from "@/lib/scoring";

interface TranscriptSegment {
  text: string;
  timestamp: number;
}

/**
 * LiveKit-based voice hook. Replaces useSpeechTranscript + useVoiceAnalysis.
 * Uses WebRTC (echo cancellation built-in) for mic capture.
 * Uses Web Speech API for STT but with LiveKit's echo-cancelled audio context.
 * Uses LiveKit room for audio playback (TTS output goes through LiveKit).
 */
export function useLiveKitVoice() {
  const roomRef = useRef<Room | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const segmentsRef = useRef<TranscriptSegment[]>([]);
  const mutedRef = useRef(false);
  const stoppedRef = useRef(false); // Hard stop — prevents restart after "I'm Done"
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [transcript, setTranscript] = useState("");
  const [currentTurnText, setCurrentTurnText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [speechRate, setSpeechRate] = useState(0);
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const cooldownUntilRef = useRef(0); // Ignore results until this timestamp

  const WINDOW_SIZE_MS = 15000;
  const lastSpeechRef = useRef(0);

  // Connect to LiveKit room + start mic with echo cancellation
  const start = useCallback(async () => {
    try {
      // Get token from our API
      const res = await fetch("/api/livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: `replai-${Date.now()}`,
          participantName: "user",
        }),
      });
      const { token } = await res.json();

      const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (!livekitUrl || !token) {
        console.warn("LiveKit not available, falling back to direct mic");
        await startDirectMic();
        return;
      }

      // Create and connect room
      const room = new Room({
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      await room.connect(livekitUrl, token);
      roomRef.current = room;
      setIsConnected(true);
      console.log("LiveKit room connected — echo cancellation active");

      // Publish mic with echo cancellation
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      await room.localParticipant.publishTrack(audioTrack);

      // Set up audio analysis from the local track
      setupAudioAnalysis(audioTrack);

      // Start Web Speech API for STT (mic is now echo-cancelled via WebRTC)
      startSpeechRecognition();

    } catch (err) {
      console.warn("LiveKit connection failed, falling back to direct mic:", err);
      await startDirectMic();
    }
  }, []);

  // Fallback: direct mic without LiveKit (same as old useVoiceAnalysis)
  const startDirectMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      startEnergyMonitor();
      startSpeechRecognition();
      console.log("Direct mic started with browser echo cancellation");
    } catch (err) {
      console.error("Mic access failed:", err);
    }
  }, []);

  // Set up audio energy analysis from a LiveKit audio track
  const setupAudioAnalysis = useCallback((track: LocalTrack) => {
    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(mediaStream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);

    audioContextRef.current = ctx;
    analyserRef.current = analyser;

    startEnergyMonitor();
  }, []);

  // Monitor audio energy levels
  const startEnergyMonitor = useCallback(() => {
    const dataArray = new Float32Array(2048);

    const monitor = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getFloatTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] ** 2;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      setEnergyLevel(rms);
      setIsSpeaking((prev) => prev ? rms > 0.008 : rms > 0.015);

      requestAnimationFrame(monitor);
    };
    requestAnimationFrame(monitor);
  }, []);

  // Start Web Speech API
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition requires Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (mutedRef.current || stoppedRef.current) return; // Hard discard during AI speech
      // Cooldown: ignore results for 500ms after unmute (residual echo)
      if (Date.now() < cooldownUntilRef.current) return;

      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (finalText) {
        const now = Date.now();
        segmentsRef.current.push({ text: finalText, timestamp: now });

        if (now - lastSpeechRef.current > 1500 && lastSpeechRef.current > 0) {
          setPauseCount((p) => p + 1);
        }
        lastSpeechRef.current = now;

        setTranscript((p) => (p + " " + finalText).trim());
        setCurrentTurnText((p) => (p + " " + finalText).trim());
        computeMetrics();
      }

      setInterimText(interim);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (stoppedRef.current) return; // Don't restart after hard stop
      if (e.error === "no-speech" || e.error === "aborted") {
        try { recognition.start(); } catch { /* already running */ }
      }
    };

    recognition.onend = () => {
      if (stoppedRef.current) return; // Don't restart after hard stop
      try { recognition.start(); } catch { /* already running */ }
    };

    stoppedRef.current = false; // Allow recognition to run
    recognitionRef.current = recognition;
    recognition.start();
    console.log("Speech recognition started");
  }, []);

  const computeMetrics = useCallback(() => {
    const now = Date.now();
    const windowSegments = segmentsRef.current.filter(
      (s) => s.timestamp >= now - WINDOW_SIZE_MS
    );
    if (windowSegments.length === 0) {
      setSpeechRate(0);
      setFillerWordCount(0);
      return;
    }
    const text = windowSegments.map((s) => s.text).join(" ");
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    setSpeechRate(Math.min(Math.round(words.length * 4), 200));
    setFillerWordCount(countFillerWords(text));
  }, []);

  const stop = useCallback(() => {
    stoppedRef.current = true; // Prevent restart + discard buffered results
    mutedRef.current = true;   // Belt-and-suspenders: also mute
    recognitionRef.current?.stop();
    roomRef.current?.disconnect();
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close().catch(() => {});
    }
    setIsConnected(false);
  }, []);

  const mute = useCallback(() => { mutedRef.current = true; }, []);
  const unmute = useCallback(() => {
    mutedRef.current = false;
    cooldownUntilRef.current = Date.now() + 600; // Ignore first 600ms after unmute (echo dissipation)
  }, []);

  const markTurnEnd = useCallback(() => {
    setCurrentTurnText("");
    setInterimText("");
  }, []);

  const reset = useCallback(() => {
    stoppedRef.current = false;
    mutedRef.current = false;
    cooldownUntilRef.current = 0;
    segmentsRef.current = [];
    setTranscript("");
    setCurrentTurnText("");
    setInterimText("");
    setSpeechRate(0);
    setFillerWordCount(0);
    setPauseCount(0);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      roomRef.current?.disconnect();
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close().catch(() => {});
      }
    };
  }, []);

  return {
    // Voice metrics
    energyLevel,
    isSpeaking,
    // Speech transcript
    transcript,
    currentTurnText,
    interimText,
    speechRate,
    fillerWordCount,
    pauseCount,
    speechError,
    isConnected,
    // Controls
    start,
    stop,
    mute,
    unmute,
    markTurnEnd,
    reset,
  };
}
