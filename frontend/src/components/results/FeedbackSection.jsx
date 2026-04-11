import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

function FeedbackList({ items, icon: Icon, iconColor, title, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-strong rounded-2xl p-5"
    >
      <h3 className="text-sm font-space font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.1 * i }}
            className="flex items-start gap-3"
          >
            <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${iconColor.replace('text-', 'bg-')}`} />
            <span className="text-sm text-foreground/80 leading-relaxed">{item}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function FeedbackSection({ feedback }) {
  return (
    <div className="space-y-4">
      {/* Overall */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-5"
      >
        <h3 className="text-sm font-space font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          AI Assessment
        </h3>
        <p className="text-foreground/90 leading-relaxed">{feedback.overall}</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FeedbackList
          items={feedback.strengths}
          icon={CheckCircle}
          iconColor="text-green-400"
          title="Strengths"
          delay={0.2}
        />
        <FeedbackList
          items={feedback.improvements}
          icon={AlertCircle}
          iconColor="text-amber-400"
          title="Areas to Improve"
          delay={0.3}
        />
      </div>

      <FeedbackList
        items={feedback.tips}
        icon={Lightbulb}
        iconColor="text-secondary"
        title="Pro Tips"
        delay={0.4}
      />
    </div>
  );
}