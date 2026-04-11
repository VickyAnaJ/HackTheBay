// ---- Metric Types ----

export interface BodyMetrics {
  eyeContactPercent: number; // 0-100
  fidgetRate: number; // movements per minute
  postureScore: number; // 0-1 (1 = good posture)
  gestureOpenness: number; // 0-1 (1 = open, 0 = closed/defensive)
}

export interface VoiceMetrics {
  speechRate: number; // words per minute
  fillerWordCount: number; // count in current window
  energyLevel: number; // 0-1 RMS normalized
  pauseCount: number; // pauses > 1.5s in window
}

export interface CombinedMetrics {
  body: BodyMetrics;
  voice: VoiceMetrics;
  confidenceScore: number; // 0-100
  timestamp: number;
}

// ---- Conversation Types ----

export interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: number;
}

// ---- Scenario Types ----

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  systemPrompt: string;
  openingLine: string;
}

// ---- Round Types ----

export type RoundStatus = "selecting" | "character-select" | "countdown" | "active" | "reviewing";

export interface RoundState {
  status: RoundStatus;
  scenario: Scenario | null;
  messages: Message[];
  metricsTimeline: CombinedMetrics[];
  startTime: number | null;
  elapsedSeconds: number;
}

// ---- Feedback Types ----

export interface RoundFeedback {
  overall_score: number;
  strongest_moment: string;
  weakest_moment: string;
  body_feedback: string[];
  voice_feedback: string[];
  content_feedback: string[];
  tip_for_next_round: string;
  // Enhanced Gemini analysis
  strategy_analysis: string;
  emotional_progression: string;
  improvement_areas: string[];
}

// ---- Conflict Alert Types ----

export interface ConflictAlert {
  id: string;
  entityName: string;
  risk: "low" | "medium" | "high";
  matchType: string;
  summary: string;
  timestamp: number;
}

// ---- Annotation Types ----

export interface Annotation {
  id: string;
  text: string;
  type: "good" | "warning" | "bad";
  timestamp: number;
}
