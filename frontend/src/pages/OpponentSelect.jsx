import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Shield, Swords, Star } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import GlassCard from '../components/GlassCard';
import { scenarios, opponents } from '../lib/demoData';

const difficultyConfig = {
  Easy: { color: 'text-green-400 bg-green-500/10', icon: Star },
  Medium: { color: 'text-amber-400 bg-amber-500/10', icon: Shield },
  Hard: { color: 'text-rose-400 bg-rose-500/10', icon: Swords },
  Expert: { color: 'text-purple-400 bg-purple-500/10', icon: Swords },
};

export default function OpponentSelect() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const scenarioId = urlParams.get('scenario') || 'job-interview';
  const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0];
  const opponentList = opponents[scenarioId] || opponents['job-interview'];

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

          {/* Scenario Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{scenario.icon}</span>
              <div>
                <h1 className="text-3xl sm:text-4xl font-space font-bold">{scenario.title}</h1>
                <p className="text-muted-foreground">{scenario.description}</p>
              </div>
            </div>
          </motion.div>

          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-8"
          >
            <h2 className="text-xl font-space font-semibold">Choose Your Opponent</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          {/* Opponents */}
          <div className="grid gap-4">
            {opponentList.map((opponent, i) => {
              const diff = difficultyConfig[opponent.difficulty] || difficultyConfig.Medium;
              return (
                <GlassCard
                  key={opponent.id}
                  delay={0.1 * i}
                  onClick={() => navigate(`/session?scenario=${scenarioId}&opponent=${opponent.id}`)}
                  className="group"
                >
                  <div className="flex items-center gap-5">
                    {/* Avatar */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl sm:text-4xl shrink-0">
                      {opponent.avatar}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-lg font-space font-semibold">{opponent.name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${diff.color}`}>
                          <diff.icon className="w-3 h-3" />
                          {opponent.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-primary/70 font-medium mb-1">{opponent.role}</p>
                      <p className="text-sm text-muted-foreground hidden sm:block">{opponent.personality}</p>
                      <p className="text-xs text-muted-foreground mt-1 italic">Style: {opponent.style}</p>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-full glass flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}