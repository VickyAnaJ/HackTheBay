"use client";

import { useRef, useCallback, useState, useEffect } from "react";

export function useVoiceAnalysis() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const dataArrayRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const [energyLevel, setEnergyLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const SPEAKING_THRESHOLD = 0.015;
  const SILENCE_THRESHOLD = 0.008;

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      dataArrayRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;

      // Start monitoring loop
      const monitor = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);

        // Compute RMS energy
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i] ** 2;
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length);

        setEnergyLevel(rms);

        // Hysteresis for speaking detection (prevents flickering)
        setIsSpeaking((prev) => {
          if (prev) return rms > SILENCE_THRESHOLD;
          return rms > SPEAKING_THRESHOLD;
        });

        animFrameRef.current = requestAnimationFrame(monitor);
      };

      animFrameRef.current = requestAnimationFrame(monitor);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  return { energyLevel, isSpeaking, start, stop };
}
