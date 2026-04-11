import { motion } from 'framer-motion';
import { Eye, Activity, Gauge, MessageSquare, AlertTriangle, Zap } from 'lucide-react';
import ConfidenceRing from '../ConfidenceRing';
import MetricGauge from '../MetricGauge';

export default function LiveMetricsPanel({ metrics, elapsed }) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-strong rounded-2xl p-4 h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-space font-semibold uppercase tracking-wider text-muted-foreground">
          Live Metrics
        </h3>
        <div className="flex items-center gap-2 glass px-3 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-mono font-medium">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="flex justify-center mb-5">
        <ConfidenceRing score={metrics.confidence} />
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        <MetricGauge
          label="Eye Contact"
          value={metrics.eyeContact}
          unit="%"
          icon={Eye}
          color="secondary"
        />
        <MetricGauge
          label="Posture"
          value={metrics.posture}
          unit="%"
          icon={Activity}
          color="green"
        />
        <MetricGauge
          label="Speech Pace"
          value={metrics.speechPace}
          unit="WPM"
          icon={Gauge}
          color="amber"
        />
        <MetricGauge
          label="Fidget Rate"
          value={metrics.fidget}
          unit="/min"
          icon={AlertTriangle}
          color={metrics.fidget > 10 ? 'rose' : 'green'}
        />
      </div>

      {/* Additional Stats */}
      <div className="mt-4 space-y-2">
        <div className="glass rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Filler Words</span>
          </div>
          <span className="text-sm font-space font-semibold">{metrics.fillerWords || 3}</span>
        </div>
        <div className="glass rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground">Energy Level</span>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <motion.div
                key={i}
                animate={{ scaleY: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                className={`w-1.5 h-4 rounded-full ${i <= (metrics.energy || 4) ? 'bg-secondary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}