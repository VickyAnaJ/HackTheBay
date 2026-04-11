"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";

interface Props {
  messages: Message[];
  interimText: string;
  isAiSpeaking: boolean;
}

export default function ConversationPanel({
  messages,
  interimText,
  isAiSpeaking,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  return (
    <div className="flex flex-col h-full p-4">
      {/* Messages */}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 mb-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
        >
          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
              ${msg.role === "ai"
                ? "bg-accent/20 text-accent"
                : "bg-good/20 text-good"
              }`}
          >
            {msg.role === "ai" ? "✦" : "You"}
          </div>

          {/* Bubble */}
          <div
            className={`rounded-lg px-4 py-3 max-w-[80%]
              ${msg.role === "ai"
                ? "bg-bg-raised rounded-tl-none"
                : "bg-accent/10 rounded-tr-none"
              }`}
          >
            <p className="text-sm text-text-primary leading-relaxed">
              {msg.text}
            </p>
          </div>
        </div>
      ))}

      {/* Interim (live) transcript */}
      {interimText && (
        <div className="flex gap-3 mb-4 flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-good/20 flex items-center justify-center text-good text-sm font-bold shrink-0">
            You
          </div>
          <div className="bg-accent/5 rounded-lg rounded-tr-none px-4 py-3 max-w-[80%] border border-border/50">
            <p className="text-sm text-text-secondary italic leading-relaxed">
              {interimText}
              <span className="inline-block w-1 h-4 bg-text-secondary ml-1 animate-pulse" />
            </p>
          </div>
        </div>
      )}

      {/* AI typing indicator */}
      {isAiSpeaking && (
        <div className="flex gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold shrink-0">
            ✦
          </div>
          <div className="bg-bg-raised rounded-lg rounded-tl-none px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-accent rounded-full typing-dot" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-accent rounded-full typing-dot" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-accent rounded-full typing-dot" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[10px] text-accent/50 tracking-wider uppercase">Gemini</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {messages.length <= 1 && !interimText && (
        <p className="text-text-secondary text-xs text-center mt-4">
          Start speaking — your words will appear here
        </p>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
