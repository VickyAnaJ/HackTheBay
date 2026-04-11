import { motion } from 'framer-motion';
import { Eye, Activity, Gauge, AlertTriangle, MessageSquare } from 'lucide-react';

const metricDefs = [
  { key: 'eyeContact', label: 'Eye Contact', icon: Eye, unit: '%', target: 80 },
  { key: 'posture', label: 'Posture Score', icon: Activity, unit: '%', target: 85 },
  { key: 'speechPace', label: 'Speech Pace', icon: Gauge, unit: 'WPM', target: 150, invert: true },
  { key: 'fidget', label: 'Fidget Rate', icon: AlertTriangle, unit: '/min', target: 5, invert: true },
];

function MetricBar({ label, value, unit, icon: Icon, target, invert, delay }) {
  const isGood = invert
    ? value <= target
    : value >= target;

  const percent = invert
    ? Math.max(0, Math.min(100, (1 - Math.abs(value - target) / target) * 100))
    : Math.min(100, (value / 100) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isGood ? 'text-green-400' : 'text-amber-400'}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-lg font-space font-bold">
          {typeof value === 'number' ? Math.round(value) : value}
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: delay + 0.3, ease: 'easeOut' }}
          className={`h-full rounded-full ${isGood ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">Target: {target}{unit}</span>
        <span className={`text-[10px] font-medium ${isGood ? 'text-green-400' : 'text-amber-400'}`}>
          {isGood ? '✓ On Target' : '⚠ Needs Work'}
        </span>
      </div>
    </motion.div>
  );
}

export default function MetricsBreakdown({ metrics }) {
  return (
    <div className="space-y-3">
      {metricDefs.map((def, i) => (
        <MetricBar
          key={def.key}
          label={def.label}
          value={metrics[def.key]}
          unit={def.unit}
          icon={def.icon}
          target={def.target}
          invert={def.invert}
          delay={0.1 * i}
        />
      ))}
    </div>
  );
}