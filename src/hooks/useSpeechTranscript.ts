"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { countFillerWords } from "@/lib/scoring";

interface TranscriptSegment {
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export function useSpeechTranscript() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const segmentsRef = useRef<TranscriptSegment[]>([]);
  const lastSpeechRef = useRef<number>(0);
  const windowStartRef = useRef<number>(0);
  const turnStartIndexRef = useRef<number>(0);
  // Gate: when true, ignore all incoming results (AI is speaking)
  const mutedRef = useRef<boolean>(false);

  const [transcript, setTranscript] = useState("");
  const [currentTurnText, setCurrentTurnText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [speechRate, setSpeechRate] = useState(0);
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const WINDOW_SIZE_MS = 15000; // 15-second window for smooth WPM average
  const PAUSE_THRESHOLD_MS = 1500;

  const computeWindowMetrics = useCallback(() => {
    const now = Date.now();
    const windowStart = now - WINDOW_SIZE_MS;
    const windowSegments = segmentsRef.current.filter(
      (s) => s.timestamp >= windowStart
    );
    if (windowSegments.length === 0) {
      setSpeechRate(0);
      setFillerWordCount(0);
      return;
    }

    const windowText = windowSegments.map((s) => s.text).join(" ");
    const words = windowText.split(/\s+/).filter((w) => w.length > 0);

    // Calculate WPM from 15-second window: words / 0.25 minutes
    // Gives a smooth average. Normal speech = 120-160 wpm.
    const wpm = Math.min(Math.round(words.length * 4), 200);

    setSpeechRate(Math.round(wpm));
    const fillers = countFillerWords(windowText);
    setFillerWordCount(fillers);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition requires Chrome. Please switch browsers to use REPLAI.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // If muted (AI speaking), discard everything
      if (mutedRef.current) return;

      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalText) {
        const now = Date.now();
        segmentsRef.current.push({
          text: finalText,
          timestamp: now,
          isFinal: true,
        });

        const gap = now - lastSpeechRef.current;
        if (gap > PAUSE_THRESHOLD_MS && lastSpeechRef.current > 0) {
          setPauseCount((prev) => prev + 1);
        }
        lastSpeechRef.current = now;

        // Append to full transcript
        setTranscript((prev) => (prev + " " + finalText).trim());

        // Track current turn text (since last markTurnEnd)
        setCurrentTurnText((prev) => (prev + " " + finalText).trim());

        computeWindowMetrics();
      }

      setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "no-speech" || event.error === "aborted") {
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    };

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      lastSpeechRef.current = Date.now();
      windowStartRef.current = Date.now();
    } catch {
      console.error("Failed to start speech recognition");
    }
  }, [isListening, computeWindowMetrics]);

  const stop = useCallback(() => {
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  const pause = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const resume = useCallback(() => {
    try {
      recognitionRef.current?.start();
    } catch {
      // Already running
    }
  }, []);

  // Mute: keep recognition running but discard all results (prevents echo)
  const mute = useCallback(() => {
    mutedRef.current = true;
  }, []);

  // Unmute: start accepting results again
  const unmute = useCallback(() => {
    mutedRef.current = false;
  }, []);

  // Mark the end of a user turn — resets currentTurnText so next turn starts fresh
  const markTurnEnd = useCallback(() => {
    turnStartIndexRef.current = segmentsRef.current.length;
    setCurrentTurnText("");
    setInterimText("");
  }, []);

  const reset = useCallback(() => {
    segmentsRef.current = [];
    turnStartIndexRef.current = 0;
    setTranscript("");
    setCurrentTurnText("");
    setInterimText("");
    setSpeechRate(0);
    setFillerWordCount(0);
    setPauseCount(0);
    windowStartRef.current = Date.now();
    lastSpeechRef.current = Date.now();
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    transcript,
    currentTurnText,
    interimText,
    speechRate,
    fillerWordCount,
    pauseCount,
    isListening,
    speechError,
    start,
    stop,
    pause,
    resume,
    mute,
    unmute,
    markTurnEnd,
    reset,
  };
}

// Types in src/types/speech.d.ts
