"use client";

import type {
  RoundStatus,
  Message,
  VoiceMetrics,
  RoundFeedback,
  Annotation,
  ConflictAlert,
} from "@/lib/types";
import type { ConflictReport } from "@/lib/legal/conflictEngine";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { RefObject } from "react";
import type { BodyMetrics } from "@/lib/types";
import VideoFeed from "./VideoFeed";
import ConversationPanel from "./ConversationPanel";
import MetricsPanel from "./MetricsPanel";
import ScoreCard from "./ScoreCard";

interface BodyTrackingData {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  metrics: BodyMetrics;
  annotations: Annotation[];
  faceLandmarks: NormalizedLandmark[] | null;
  poseLandmarks: NormalizedLandmark[] | null;
}

interface Props {
  status: RoundStatus;
  onEndRound: () => void;
  onRestart: () => void;
  onSkipAI?: () => void;
  bodyTracking: BodyTrackingData;
  voiceMetrics: VoiceMetrics;
  confidenceScore: number;
  messages: Message[];
  interimText: string;
  isAiSpeaking: boolean;
  feedback: RoundFeedback | null;
  isLoadingFeedback: boolean;
  elapsedSeconds: number;
  coachingAnnotations: Annotation[];
  conflictAlerts?: ConflictAlert[];
  conflictReport?: ConflictReport | null;
  isLegalScenario?: boolean;
}

export default function SessionView({
  status,
  onEndRound,
  onRestart,
  onSkipAI,
  bodyTracking,
  voiceMetrics,
  confidenceScore,
  messages,
  interimText,
  isAiSpeaking,
  feedback,
  isLoadingFeedback,
  elapsedSeconds,
  coachingAnnotations,
  conflictAlerts,
  conflictReport,
  isLegalScenario,
}: Props) {
  const isReview = status === "reviewing";

  return (
    <div className="flex-1 flex flex-col glass-panel min-h-0">
      {/* Three-panel layout */}
      <div className="flex-1 grid grid-cols-[1fr_1fr_320px] gap-0 min-h-0 overflow-hidden">
        {/* Left: Camera Feed */}
        <div className="border-r border-border flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Camera Feed
            </h2>
            <span className="text-xs text-text-secondary font-mono">
              {Math.floor(elapsedSeconds / 60)}:
              {String(elapsedSeconds % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="flex-1 flex items-start justify-center bg-bg-base p-2">
            <VideoFeed
              videoRef={bodyTracking.videoRef}
              canvasRef={bodyTracking.canvasRef}
              faceLandmarks={bodyTracking.faceLandmarks}
              poseLandmarks={bodyTracking.poseLandmarks}
              annotations={bodyTracking.annotations}
              coachingAnnotations={coachingAnnotations}
              conflictAlerts={conflictAlerts}
            />
          </div>
        </div>

        {/* Center: Conversation */}
        <div className="border-r border-border/50 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-semibold text-text-secondary/70 uppercase tracking-wider">
              Conversation
            </h2>
            {isAiSpeaking && (
              <span className="flex items-center gap-1.5 text-xs text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent status-dot" />
                Speaking
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar h-0">
            <ConversationPanel
              messages={messages}
              interimText={interimText}
              isAiSpeaking={isAiSpeaking}
            />
          </div>
        </div>

        {/* Right: Metrics (active) or ScoreCard (review) — independent scroll */}
        <div className="relative">
          <div className="absolute inset-0 flex flex-col">
            <div className="px-4 py-2 border-b border-border shrink-0">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {isReview ? "Round Results" : "Live Metrics"}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isReview && feedback ? (
              <ScoreCard feedback={feedback} conflictReport={isLegalScenario ? conflictReport : undefined} />
            ) : isReview && isLoadingFeedback ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-secondary animate-pulse">
                  Analyzing your performance...
                </p>
              </div>
            ) : (
              <MetricsPanel
                bodyMetrics={bodyTracking.metrics}
                voiceMetrics={voiceMetrics}
                confidenceScore={confidenceScore}
              />
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-center gap-4 px-6 py-3 border-t border-border/50 glass-surface shrink-0" role="toolbar" aria-label="Round controls">
        {status === "active" && (
          <>
            {isAiSpeaking && onSkipAI && (
              <button
                onClick={onSkipAI}
                aria-label="Skip AI response"
                className="px-5 py-3 min-h-[44px] rounded-lg border border-border text-text-secondary font-medium
                           hover:bg-bg-raised hover:text-text-primary transition-colors duration-200 cursor-pointer text-sm"
              >
                Skip ⏭
              </button>
            )}
            <button
              onClick={onEndRound}
              aria-label="End round and see results"
              className="px-6 py-3 min-h-[44px] rounded-lg bg-accent text-white font-semibold
                         hover:bg-accent/80 transition-colors duration-200 cursor-pointer"
            >
              I&apos;m Done
            </button>
          </>
        )}
        {status === "reviewing" && (
          <>
            <button
              onClick={onRestart}
              aria-label="Practice this scenario again"
              className="px-6 py-3 min-h-[44px] rounded-lg bg-accent text-white font-semibold
                         hover:bg-accent/80 transition-colors duration-200 cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={onRestart}
              aria-label="Choose a different scenario"
              className="px-6 py-3 min-h-[44px] rounded-lg border border-border text-text-secondary
                         hover:bg-bg-raised transition-colors duration-200 cursor-pointer"
            >
              New Scenario
            </button>
          </>
        )}
      </div>
    </div>
  );
}
