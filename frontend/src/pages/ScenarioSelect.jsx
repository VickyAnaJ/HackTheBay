import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Clock } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import GlassCard from '../components/GlassCard';
import { scenarios } from '../lib/demoData';

const statCards = [
  { label: 'Sessions Completed', value: '24', icon: Clock },
  { label: 'Avg Confidence', value: '82%', icon: TrendingUp },
  { label: 'Skills Improved', value: '6', icon: Sparkles },
];

export default function ScenarioSelect() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Practice Coach</span>
            </motion.div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-space font-bold mb-4 leading-tight">
              Master Every<br />
              <span className="text-gradient">Conversation</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Practice high-stakes conversations with AI opponents. Get real-time feedback
              on body language, speech patterns, and confidence.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-12 max-w-lg mx-auto">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glass rounded-xl p-3 sm:p-4 text-center"
              >
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="text-xl sm:text-2xl font-space font-bold">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <h2 className="text-xl font-space font-semibold">Choose Your Scenario</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          {/* Scenario Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario, i) => (
              <GlassCard
                key={scenario.id}
                delay={0.1 * i}
                onClick={() => navigate(`/opponents?scenario=${scenario.id}`)}
                className="group relative overflow-hidden"
              >
                {/* Gradient accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${scenario.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl">{scenario.icon}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium px-2 py-1 rounded-full bg-muted/50">
                      {scenario.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-space font-semibold mb-1">{scenario.title}</h3>
                  <p className="text-xs text-primary/70 font-medium mb-2">{scenario.subtitle}</p>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{scenario.description}</p>
                  <div className="flex items-center text-sm text-primary font-medium group-hover:gap-3 gap-2 transition-all">
                    Start Practice
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}