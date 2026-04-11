import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Clock } from 'lucide-react';

const sessions = [
  { date: 'Apr 11', scenario: 'Job Interview', opponent: 'Marcus Chen', confidence: 85, duration: '4:12', trend: 3 },
  { date: 'Apr 8', scenario: 'Salary Negotiation', opponent: 'David Park', confidence: 78, duration: '3:45', trend: 5 },
  { date: 'Apr 5', scenario: 'Sales Pitch', opponent: 'James Morrison', confidence: 82, duration: '5:02', trend: -2 },
  { date: 'Apr 2', scenario: 'Job Interview', opponent: 'Sarah Williams', confidence: 88, duration: '3:28', trend: 8 },
  { date: 'Mar 30', scenario: 'Conflict Resolution', opponent: 'Mike Johnson', confidence: 72, duration: '4:55', trend: 4 },
];

export default function SessionHistory() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-strong rounded-2xl p-5"
    >
      <h3 className="text-sm font-space font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Recent Sessions
      </h3>
      <div className="space-y-3">
        {sessions.map((session, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{session.scenario}</span>
              </div>
              <span className="text-xs text-muted-foreground">vs {session.opponent}</span>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1">
                <span className="text-lg font-space font-bold">{session.confidence}</span>
                <span className={`text-xs font-medium ${session.trend >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                  {session.trend >= 0 ? '+' : ''}{session.trend}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {session.duration}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}