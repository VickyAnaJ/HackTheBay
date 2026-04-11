"use client";

import type { BodyMetrics, VoiceMetrics } from "@/lib/types";
import { getMetricStatus } from "@/lib/scoring";

function MetricBar({
  label,
  value,
  displayValue,
  max,
  unit,
  status,
}: {
  label: string;
  value: number;
  displayValue?: string;
  max: number;
  unit?: string;
  status: "good" | "warning" | "bad";
}) {
  const pct = Math.min((value / max) * 100, 100);
  const colorMap = {
    good: "bg-good",
    warning: "bg-warning",
    bad: "bg-bad",
  };
  const textColorMap = {
    good: "text-good",
    warning: "text-warning",
    bad: "text-bad",
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className={`text-sm font-semibold ${textColorMap[status]}`}>
          {displayValue ?? Math.round(value)}
          {unit}
        </span>
      </div>
      <div className="h-2 bg-bg-base rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full metric-bar ${colorMap[status]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  bodyMetrics: BodyMetrics;
  voiceMetrics: VoiceMetrics;
  confidenceScore: number;
}

export default function MetricsPanel({
  bodyMetrics,
  voiceMetrics,
  confidenceScore,
}: Props) {
  const scoreColor =
    confidenceScore >= 70
      ? "text-good score-glow-good"
      : confidenceScore >= 40
        ? "text-warning score-glow-warning"
        : "text-bad score-glow-bad";

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Confidence Score — compact */}
      <div className="text-center py-2">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
          Confidence
        </p>
        <p className={`text-4xl font-bold ${scoreColor} score-pulse`} key={Math.round(confidenceScore / 5)}>
          {confidenceScore}
          <span className="text-sm text-text-secondary font-normal"> /100</span>
        </p>
      </div>

      {/* Body Metrics */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-text-secondary uppercase tracking-wider">
          Body Language
        </p>
        <MetricBar
          label="Eye Contact"
          value={bodyMetrics.eyeContactPercent}
          max={100}
          unit="%"
          status={getMetricStatus(bodyMetrics.eyeContactPercent, { good: 60, warning: 40 })}
        />
        <MetricBar
          label="Fidget Rate"
          value={bodyMetrics.fidgetRate}
          displayValue={bodyMetrics.fidgetRate.toFixed(1)}
          max={10}
          unit="/min"
          status={getMetricStatus(bodyMetrics.fidgetRate, { good: 3, warning: 6 }, true)}
        />
        <MetricBar
          label="Posture"
          value={bodyMetrics.postureScore * 100}
          max={100}
          unit="%"
          status={getMetricStatus(bodyMetrics.postureScore * 100, { good: 60, warning: 40 })}
        />
      </div>

      {/* Voice Metrics */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-text-secondary uppercase tracking-wider">
          Voice
        </p>
        <MetricBar
          label="Speech Pace"
          value={voiceMetrics.speechRate}
          max={200}
          unit=" wpm"
          status={
            voiceMetrics.speechRate >= 70 && voiceMetrics.speechRate <= 180
              ? "good"
              : voiceMetrics.speechRate > 0
                ? "warning"
                : "good"
          }
        />
        <MetricBar
          label="Filler Words"
          value={voiceMetrics.fillerWordCount}
          max={10}
          status={getMetricStatus(voiceMetrics.fillerWordCount, { good: 2, warning: 4 }, true)}
        />
      </div>
    </div>
  );
}
