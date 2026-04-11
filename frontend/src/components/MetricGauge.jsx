import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function MetricGauge({ label, value, unit, icon: Icon, color = 'primary', trend }) {
  const colorMap = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    secondary: 'from-secondary/20 to-secondary/5 text-secondary',
    green: 'from-green-500/20 to-green-500/5 text-green-400',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-xl p-4 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center", colorMap[color])}>
          {Icon && <Icon className="w-4 h-4" />}
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            trend > 0 ? "bg-green-500/10 text-green-400" : "bg-rose-500/10 text-rose-400"
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <span className="text-2xl font-space font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
      </div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    </motion.div>
  );
}