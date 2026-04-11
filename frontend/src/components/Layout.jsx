import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ParticleBackground from './ParticleBackground';
import NavBar from './NavBar';

export default function Layout() {
  const location = useLocation();
  const isSession = location.pathname === '/session';

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <ParticleBackground />
      {!isSession && <NavBar />}
      <AnimatePresence mode="wait">
        <Outlet key={location.pathname} />
      </AnimatePresence>
    </div>
  );
}