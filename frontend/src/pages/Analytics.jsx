import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Target, Zap, Award, Eye, Activity } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ConfidenceRing from '../components/ConfidenceRing';
import PerformanceChart from '../components/analytics/PerformanceChart';
import SessionHistory from '../components/analytics/SessionHistory';
import { demoAnalyticsHistory } from '../lib/demoData';

const summaryStats = [
  { label: 'Total Sessions', value: '24', icon: Zap, color: 'text-primary' },
  { label: 'Best Score', value: '92', icon: Award, color: 'text-green-400' },
  { label: 'Avg Eye Contact', value: '82%', icon: Eye, color: 'text-secondary' },
  { label: 'Avg Posture', value: '87%', icon: Activity, color: 'text-emerald-400' },
];

const metricToggles = [
  { key: 'confidence', label: 'Confidence', color: '#8b5cf6' },
  { key: 'eyeContact', label: 'Eye Contact', color: '#22d3ee' },
  { key: 'posture', label: 'Posture', color: '#34d399' },
  { key: 'speechPace', label: 'Speech', color: '#fbbf24' },
];

export default function Analytics() {
  const navigate = useNavigate();
  const [activeMetrics, setActiveMetrics] = useState(['confidence', 'eyeContact']);

  const toggleMetric = (key) => {
    setActiveMetrics(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Back */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to home</span>
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-space font-bold mb-2">
              Your <span className="text-gradient">Analytics</span>
            </h1>
            <p className="text-muted-foreground">Track your progress and identify areas for improvement.</p>
          </motion.div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {summaryStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="glass-strong rounded-2xl p-5 text-center"
              >
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-space font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Overall Score */}
          <div className="grid lg:grid-cols-[auto_1fr] gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-2xl p-8 flex flex-col items-center justify-center"
            >
              <ConfidenceRing score={85} size={180} strokeWidth={12} />
              <p className="text-sm text-muted-foreground mt-4">Current Average</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">+12% this month</span>
              </div>
            </motion.div>

            <div>
              {/* Metric Toggles */}
              <div className="flex flex-wrap gap-2 mb-4">
                {metricToggles.map(metric => (
                  <button
                    key={metric.key}
                    onClick={() => toggleMetric(metric.key)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                      activeMetrics.includes(metric.key)
                        ? 'glass-strong border-primary/30'
                        : 'glass opacity-50 hover:opacity-80'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: metric.color }} />
                    {metric.label}
                  </button>
                ))}
              </div>

              <PerformanceChart data={demoAnalyticsHistory} dataKeys={activeMetrics} />
            </div>
          </div>

          {/* Session History */}
          <SessionHistory />

          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 glass-strong rounded-2xl p-6"
          >
            <h3 className="text-sm font-space font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              AI Insights
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: 'Strongest Skill', value: 'Eye Contact', detail: 'Consistently above 80% across all sessions', color: 'text-secondary' },
                { title: 'Most Improved', value: 'Posture Score', detail: 'Up 21% since your first session', color: 'text-green-400' },
                { title: 'Focus Area', value: 'Filler Words', detail: 'Reduce "um" and "like" usage by practicing pauses', color: 'text-amber-400' },
              ].map((insight, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{insight.title}</p>
                  <p className={`text-lg font-space font-bold mt-1 ${insight.color}`}>{insight.value}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{insight.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}