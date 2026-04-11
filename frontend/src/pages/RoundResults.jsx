import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, BarChart3, Trophy, Target } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ConfidenceRing from '../components/ConfidenceRing';
import FeedbackSection from '../components/results/FeedbackSection';
import MetricsBreakdown from '../components/results/MetricsBreakdown';
import { scenarios, opponents, demoFeedback, demoConversation } from '../lib/demoData';

export default function RoundResults() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const scenarioId = urlParams.get('scenario') || 'job-interview';
  const opponentId = urlParams.get('opponent') || 'strict-cto';
  const confidenceParam = parseInt(urlParams.get('confidence') || '82');

  const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0];
  const opponentList = opponents[scenarioId] || opponents['job-interview'];
  const opponent = opponentList.find(o => o.id === opponentId) || opponentList[0];

  const sessionMetrics = {
    eyeContact: 85,
    posture: 88,
    speechPace: 148,
    fidget: 5,
    fillerWords: 3,
  };

  const getGrade = (score) => {
    if (score >= 90) return { label: 'Exceptional', color: 'text-green-400' };
    if (score >= 80) return { label: 'Strong', color: 'text-emerald-400' };
    if (score >= 70) return { label: 'Good', color: 'text-amber-400' };
    if (score >= 60) return { label: 'Developing', color: 'text-orange-400' };
    return { label: 'Needs Work', color: 'text-rose-400' };
  };

  const grade = getGrade(confidenceParam);

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to scenarios</span>
          </motion.button>

          {/* Results Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4"
            >
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Session Complete</span>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-space font-bold mb-2">
              Round Results
            </h1>
            <p className="text-muted-foreground">
              {scenario.title} vs {opponent.name}
            </p>
          </motion.div>

          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-strong rounded-3xl p-8 mb-8 text-center"
          >
            <div className="flex flex-col items-center gap-4">
              <ConfidenceRing score={confidenceParam} size={160} strokeWidth={10} />
              <div>
                <p className={`text-2xl font-space font-bold ${grade.color}`}>{grade.label}</p>
                <p className="text-sm text-muted-foreground mt-1">Overall Confidence Score</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
              {[
                { label: 'Duration', value: '3:42' },
                { label: 'Messages', value: demoConversation.length },
                { label: 'Filler Words', value: sessionMetrics.fillerWords },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-xl font-space font-bold">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Metrics Breakdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-space font-semibold">Performance Breakdown</h2>
            </div>
            <MetricsBreakdown metrics={sessionMetrics} />
          </motion.div>

          {/* AI Feedback */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-secondary" />
              <h2 className="text-lg font-space font-semibold">AI Feedback</h2>
            </div>
            <FeedbackSection feedback={demoFeedback} />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <button
              onClick={() => navigate(`/session?scenario=${scenarioId}&opponent=${opponentId}`)}
              className="flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-6 py-3 rounded-full font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Practice Again
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center justify-center gap-2 glass hover:bg-muted/50 px-6 py-3 rounded-full font-medium transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              View Analytics
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 glass hover:bg-muted/50 px-6 py-3 rounded-full font-medium transition-colors text-muted-foreground"
            >
              New Scenario
            </button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}