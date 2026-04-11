import type { BodyMetrics, VoiceMetrics } from "./types";

/**
 * Compute confidence score (0-100) from body + voice metrics.
 * Tuned for face-only mode on a laptop.
 * Score should respond visibly to behavior changes.
 */
export function computeConfidence(
  body: BodyMetrics,
  voice: VoiceMetrics
): number {
  const eyeContact = clamp(body.eyeContactPercent / 100, 0, 1);
  const fidgetNorm = clamp(body.fidgetRate / 6, 0, 1);
  const posture = clamp(body.postureScore, 0, 1);

  // Filler words
  const fillerNorm = clamp(voice.fillerWordCount / 4, 0, 1);

  // Energy: treat 0 as neutral (mic might not be available)
  // Only penalize if energy is clearly detected as very low while speaking
  const energyNorm = voice.energyLevel > 0
    ? clamp(voice.energyLevel / 0.05, 0, 1)
    : 0.7; // Neutral if mic not working

  // Speech pace — wider range for natural conversation with thinking pauses
  let paceScore: number;
  if (voice.speechRate === 0) {
    paceScore = 0.7; // Neutral when silent
  } else if (voice.speechRate >= 70 && voice.speechRate <= 180) {
    paceScore = 1.0;
  } else {
    paceScore = 0.5;
  }

  // Weighted score — focus on what we can reliably measure:
  // Eye contact (face mesh = reliable), fidget, posture, fillers, pace
  // Drop gesture openness — unreliable in face-only mode
  const score =
    eyeContact * 0.30 +
    (1 - fidgetNorm) * 0.20 +
    posture * 0.15 +
    (1 - fillerNorm) * 0.15 +
    energyNorm * 0.10 +
    paceScore * 0.10;

  return Math.round(clamp(score * 100, 0, 100));
}

/**
 * Determine metric status for color coding.
 */
export function getMetricStatus(
  value: number,
  thresholds: { good: number; warning: number },
  inverted = false
): "good" | "warning" | "bad" {
  if (inverted) {
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.warning) return "warning";
    return "bad";
  }
  if (value >= thresholds.good) return "good";
  if (value >= thresholds.warning) return "warning";
  return "bad";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Filler word detection from transcript text.
 */
const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "literally",
  "right",
  "I mean",
];

export function countFillerWords(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) {
      count += matches.length;
    }
  }
  return count;
}
