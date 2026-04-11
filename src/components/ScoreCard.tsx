"use client";

import type { RoundFeedback } from "@/lib/types";
import type { ConflictReport } from "@/lib/legal/conflictEngine";

interface Props {
  feedback: RoundFeedback;
  conflictReport?: ConflictReport | null;
}

export default function ScoreCard({ feedback, conflictReport }: Props) {
  const scoreColor =
    feedback.overall_score >= 70
      ? "text-good score-glow-good"
      : feedback.overall_score >= 40
        ? "text-warning score-glow-warning"
        : "text-bad score-glow-bad";

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto custom-scrollbar" role="region" aria-label="Round results">
      {/* Score — reveal-1 */}
      <div className="text-center py-3 reveal-1">
        <h3 className="text-xs text-text-secondary uppercase tracking-wider mb-1">
          Round Results
        </h3>
        <p className={`text-5xl font-bold ${scoreColor}`}>
          {feedback.overall_score}
          <span className="text-lg text-text-secondary font-normal"> /100</span>
        </p>
      </div>

      {/* Strongest moment — reveal-2 */}
      <div className="bg-good/10 border border-good/20 rounded-lg px-4 py-3 reveal-2">
        <h4 className="text-xs text-good uppercase tracking-wider font-semibold mb-1">
          Strongest Moment
        </h4>
        <p className="text-sm text-text-primary leading-relaxed">
          {feedback.strongest_moment}
        </p>
      </div>

      {/* Weakest moment — reveal-3 */}
      <div className="bg-bad/10 border border-bad/20 rounded-lg px-4 py-3 reveal-3">
        <h4 className="text-xs text-bad uppercase tracking-wider font-semibold mb-1">
          Weakest Moment
        </h4>
        <p className="text-sm text-text-primary leading-relaxed">
          {feedback.weakest_moment}
        </p>
      </div>

      {/* Body feedback — reveal-4 */}
      {feedback.body_feedback.length > 0 && (
        <div className="reveal-4">
          <h4 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-2">
            Body Language
          </h4>
          <ul className="flex flex-col gap-2" role="list">
            {feedback.body_feedback.map((item, i) => (
              <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                <span className="text-warning shrink-0" aria-hidden="true">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Voice feedback — reveal-5 */}
      {feedback.voice_feedback.length > 0 && (
        <div className="reveal-5">
          <h4 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-2">
            Voice
          </h4>
          <ul className="flex flex-col gap-2" role="list">
            {feedback.voice_feedback.map((item, i) => (
              <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                <span className="text-warning shrink-0" aria-hidden="true">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content feedback — reveal-6 */}
      {feedback.content_feedback.length > 0 && (
        <div className="reveal-6">
          <h4 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-2">
            What You Said
          </h4>
          <ul className="flex flex-col gap-2" role="list">
            {feedback.content_feedback.map((item, i) => (
              <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                <span className="text-accent shrink-0" aria-hidden="true">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conflict Check Report (legal scenario only) */}
      {conflictReport && conflictReport.results.length > 0 && (
        <div className="reveal-7">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-warning text-sm">⚖</span>
            <h4 className="text-xs text-warning uppercase tracking-wider font-semibold">
              Conflict Check Report
            </h4>
            <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
              ${conflictReport.overallRisk === "high" ? "bg-bad/20 text-bad" :
                conflictReport.overallRisk === "medium" ? "bg-warning/20 text-warning" :
                "bg-good/20 text-good"}`}>
              {conflictReport.overallRisk} risk
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-text-secondary">
              {conflictReport.entitiesChecked} entities checked — {conflictReport.results.length} conflict(s) found
            </p>
            {conflictReport.results.map((r, i) => (
              <div key={i} className={`px-3 py-2 rounded-lg border text-xs leading-relaxed
                ${r.risk === "high" ? "bg-bad/5 border-bad/20 text-bad" :
                  r.risk === "medium" ? "bg-warning/5 border-warning/20 text-warning" :
                  "bg-good/5 border-good/20 text-good"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">{r.match.extractedEntity}</span>
                  <span className="opacity-60">→</span>
                  <span className="font-medium">{r.match.matchedRecord}</span>
                  <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                    ${r.risk === "high" ? "bg-bad/20" : r.risk === "medium" ? "bg-warning/20" : "bg-good/20"}`}>
                    {r.risk}
                  </span>
                </div>
                <p className="text-text-secondary">{r.match.details}</p>
                {r.match.matterReference && (
                  <p className="text-text-secondary/60 mt-0.5">Matter: {r.match.matterReference}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gemini Deep Analysis — reveal-7 */}
      {feedback.strategy_analysis && (
        <div className="reveal-7">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-accent text-sm">✦</span>
            <h4 className="text-xs text-accent uppercase tracking-wider font-semibold">
              Gemini Strategy Analysis
            </h4>
          </div>
          <div className="bg-accent/5 border border-accent/15 rounded-lg px-4 py-3">
            <p className="text-sm text-text-primary leading-relaxed">
              {feedback.strategy_analysis}
            </p>
          </div>
        </div>
      )}

      {/* Emotional Progression — reveal-8 */}
      {feedback.emotional_progression && (
        <div className="reveal-8">
          <h4 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-2">
            Emotional Arc
          </h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            {feedback.emotional_progression}
          </p>
        </div>
      )}

      {/* Improvement Areas — reveal-9 */}
      {feedback.improvement_areas && feedback.improvement_areas.length > 0 && (
        <div className="reveal-9">
          <h4 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-2">
            Focus Areas
          </h4>
          <ul className="flex flex-col gap-2" role="list">
            {feedback.improvement_areas.map((item, i) => (
              <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                <span className="text-accent shrink-0" aria-hidden="true">◆</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tip — reveal-10 */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg px-4 py-3 reveal-10">
        <h4 className="text-xs text-accent uppercase tracking-wider font-semibold mb-1">
          Tip for Next Round
        </h4>
        <p className="text-sm text-text-primary leading-relaxed">
          {feedback.tip_for_next_round}
        </p>
      </div>

      {/* Powered by Gemini badge */}
      <div className="flex items-center justify-center gap-1.5 pt-2 pb-1 reveal-10">
        <span className="text-accent text-xs">✦</span>
        <span className="text-[10px] text-text-secondary/40 tracking-wider uppercase">
          Analysis by Gemini 2.5 Flash
        </span>
      </div>
    </div>
  );
}
