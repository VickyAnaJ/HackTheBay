import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Square, Clock } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import WebcamPanel from '../components/session/WebcamPanel';
import ConversationPanel from '../components/session/ConversationPanel';
import LiveMetricsPanel from '../components/session/LiveMetricsPanel';
import { scenarios, opponents, demoConversation } from '../lib/demoData';

export default function PracticeSession() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const scenarioId = urlParams.get('scenario') || 'job-interview';
  const opponentId = urlParams.get('opponent') || 'strict-cto';
  
  const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0];
  const opponentList = opponents[scenarioId] || opponents['job-interview'];
  const opponent = opponentList.find(o => o.id === opponentId) || opponentList[0];

  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [metrics, setMetrics] = useState({
    confidence: 78,
    eyeContact: 85,
    posture: 88,
    speechPace: 142,
    fidget: 4,
    fillerWords: 2,
    energy: 4,
  });

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate conversation progression
  useEffect(() => {
    const addMessage = (idx) => {
      if (idx < demoConversation.length) {
        setTimeout(() => {
          setMessages(prev => [...prev, demoConversation[idx]]);
          addMessage(idx + 1);
        }, 3000 + Math.random() * 2000);
      }
    };
    addMessage(0);
  }, []);

  // Simulate fluctuating metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        confidence: Math.min(100, Math.max(40, prev.confidence + (Math.random() - 0.45) * 6)),
        eyeContact: Math.min(100, Math.max(40, prev.eyeContact + (Math.random() - 0.45) * 8)),
        posture: Math.min(100, Math.max(50, prev.posture + (Math.random() - 0.48) * 4)),
        speechPace: Math.min(200, Math.max(100, prev.speechPace + (Math.random() - 0.5) * 10)),
        fidget: Math.min(20, Math.max(0, prev.fidget + (Math.random() - 0.5) * 3)),
        fillerWords: Math.min(15, Math.max(0, prev.fillerWords + (Math.random() > 0.7 ? 1 : 0))),
        energy: Math.min(5, Math.max(1, prev.energy + (Math.random() > 0.5 ? 0 : Math.random() > 0.5 ? 1 : -1))),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleEndSession = useCallback(() => {
    navigate(`/results?scenario=${scenarioId}&opponent=${opponentId}&confidence=${Math.round(metrics.confidence)}`);
  }, [navigate, scenarioId, opponentId, metrics.confidence]);

  const roundedMetrics = {
    ...metrics,
    confidence: Math.round(metrics.confidence),
    eyeContact: Math.round(metrics.eyeContact),
    posture: Math.round(metrics.posture),
    speechPace: Math.round(metrics.speechPace),
    fidget: Math.round(metrics.fidget),
  };

  return (
    <PageTransition>
      <div className="h-screen flex flex-col relative z-10 overflow-hidden">
        {/* Session Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-4 py-3 flex items-center justify-between glass border-b border-border/30"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{scenario.icon}</span>
            <div>
              <h2 className="text-sm font-space font-semibold">{scenario.title}</h2>
              <p className="text-xs text-muted-foreground">vs {opponent.name} • {opponent.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-mono">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</span>
            </div>
            <button
              onClick={handleEndSession}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              End Session
            </button>
          </div>
        </motion.div>

        {/* 3-Panel Layout */}
        <div className="flex-1 p-3 gap-3 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_0.8fr] overflow-hidden">
          {/* Camera */}
          <div className="hidden lg:block">
            <WebcamPanel isActive={true} />
          </div>

          {/* Conversation */}
          <ConversationPanel
            messages={messages}
            isRecording={isRecording}
            onToggleRecording={() => setIsRecording(!isRecording)}
            opponentAvatar={opponent.avatar}
          />

          {/* Metrics */}
          <div className="hidden lg:block">
            <LiveMetricsPanel metrics={roundedMetrics} elapsed={elapsed} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}