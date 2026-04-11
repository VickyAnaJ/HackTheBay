import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GlassCard({ children, className, hover = true, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={cn(
        "glass-strong rounded-2xl p-6 transition-all duration-300",
        hover && "cursor-pointer hover:border-primary/20",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}