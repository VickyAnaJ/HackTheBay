import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

function ChatBubble({ message, isLast }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center shrink-0 mt-1">
          <span className="text-xs">{message.avatar || '🤖'}</span>
        </div>
      )}
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3",
        isUser
          ? "bg-primary/20 border border-primary/20"
          : "glass-strong"
      )}>
        <p className="text-sm leading-relaxed">{message.text}</p>
        <span className="text-[10px] text-muted-foreground mt-1 block">{message.timestamp}</span>
      </div>
    </motion.div>
  );
}

export default function ConversationPanel({ messages, isRecording, onToggleRecording, opponentAvatar }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="glass-strong rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Live Conversation</span>
        </div>
        <span className="text-xs text-muted-foreground">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <ChatBubble
              key={i}
              message={{ ...msg, avatar: msg.role === 'opponent' ? opponentAvatar : undefined }}
              isLast={i === messages.length - 1}
            />
          ))}
        </AnimatePresence>
        
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-primary"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [1, 2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                  className="w-1 h-3 rounded-full bg-primary"
                />
              ))}
            </div>
            <span className="text-xs">Listening...</span>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRecording}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              isRecording
                ? "bg-red-500/20 text-red-400 glow-primary"
                : "glass hover:bg-primary/10 text-muted-foreground hover:text-primary"
            )}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <div className="flex-1 glass rounded-full px-4 py-2 text-sm text-muted-foreground">
            {isRecording ? "Recording your response..." : "Tap mic to speak or wait for AI..."}
          </div>
          <button className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}