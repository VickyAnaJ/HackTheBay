import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, BarChart3, Home } from 'lucide-react';

export default function NavBar() {
  const location = useLocation();
  const isSession = location.pathname === '/session';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary transition-all group-hover:scale-105">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-space font-bold text-xl tracking-tight text-foreground">
            REPL<span className="text-gradient">AI</span>
          </span>
        </Link>

        {!isSession && (
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="glass px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/analytics"
              className="glass px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
}