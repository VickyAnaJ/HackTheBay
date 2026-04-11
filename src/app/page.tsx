"use client";

// Suppress MediaPipe's INFO messages logged via console.error
if (typeof window !== "undefined") {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (msg.includes("INFO: Created TensorFlow Lite")) return;
    origError.apply(console, args);
  };
}

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  RoundStatus,
  Scenario,
  Message,
  CombinedMetrics,
  RoundFeedback,
  Annotation,
  ConflictAlert,
} from "@/lib/types";
import { useBodyTracking } from "@/hooks/useBodyTracking";
import { useLiveKitVoice } from "@/hooks/useLiveKitVoice";
import { computeConfidence } from "@/lib/scoring";
import {
  getRolePlayResponse,
  getRoundFeedback,
  getCoachingAnnotation,
  toGeminiHistory,
} from "@/lib/gemini";
import { speak, prefetchAudio, abortSpeech } from "@/lib/elevenlabs";
import dynamic from "next/dynamic";
import ScenarioSelector from "@/components/ScenarioSelector";
import CharacterSelect from "@/components/CharacterSelect";
import SessionView from "@/components/SessionView";
import WarningBar from "@/components/WarningBar";
import { characterPresets, type CharacterProfile } from "@/lib/characters";
import { runConflictCheck } from "@/lib/legal/conflictCheck";
import type { ConflictReport } from "@/lib/legal/conflictEngine";

// Dynamic import for Three.js (SSR breaks WebGL)
const Background3D = dynamic(() => import("@/components/Background3D"), {
  ssr: false,
});

export default function Home() {
  // ---- Round lifecycle ----
  const [status, setStatus] = useState<RoundStatus>("selecting");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [character, setCharacter] = useState<CharacterProfile | null>(null);
  const [countdown, setCountdown] = useState(3);

  // ---- Hooks (owned by page per spec L2.5) ----
  const body = useBodyTracking();
  const lk = useLiveKitVoice(); // Combined voice + speech via LiveKit (echo cancellation)

  // ---- Conversation + metrics state ----
  const [messages, setMessages] = useState<Message[]>([]);
  const [metricsTimeline, setMetricsTimeline] = useState<CombinedMetrics[]>([]);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<RoundFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [coachingAnnotations, setCoachingAnnotations] = useState<Annotation[]>([]);
  const [conflictAlerts, setConflictAlerts] = useState<ConflictAlert[]>([]);
  const [conflictReport, setConflictReport] = useState<ConflictReport | null>(null);

  const [jobContext, setJobContext] = useState("");

  const lastUserTextRef = useRef("");
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenOpeningRef = useRef(false);
  const openingLineRef = useRef("");

  // ---- Scenario selection ----
  const handleSelectScenario = (s: Scenario) => {
    setScenario(s);
    setStatus("character-select");
  };

  const handleSelectCharacter = (c: CharacterProfile, jobCtx?: string) => {
    setCharacter(c);
    const job = jobCtx || "";
    setJobContext(job);

    // Customize opening line for interview/legal with context
    let openingLine = scenario!.openingLine;
    if (scenario!.id === "interview" && job) {
      openingLine = `So, you're here for the ${job} role. I've looked over your background — tell me specifically why you think you're the right fit for this position.`;
    } else if (scenario!.id === "legal" && job) {
      openingLine = `Hi, thanks for making time to see me. I heard your firm handles ${job} cases — I've got a situation I need help with.`;
    }
    openingLineRef.current = openingLine;

    prefetchAudio(openingLine);
    setCountdown(3);
    setStatus("countdown");
    setMessages([
      { id: "opening", role: "ai", text: openingLine, timestamp: Date.now() },
    ]);
    setMetricsTimeline([]);
    setConfidenceScore(0);
    setFeedback(null);
    setIsLoadingFeedback(false);
    setElapsedSeconds(0);
    setWarnings([]);
    setCoachingAnnotations([]);
    setConflictAlerts([]);
    setConflictReport(null);
    hasSpokenOpeningRef.current = false;
    lastUserTextRef.current = "";
    lk.reset();
  };

  // ---- Countdown ----
  useEffect(() => {
    if (status !== "countdown") return;
    if (countdown <= 0) {
      setStatus("active");
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown]);

  // ---- Start sensors when round goes active ----
  useEffect(() => {
    if (status !== "active") return;

    body.start();
    // voice analysis now handled by lk (LiveKit)

    // Speak opening line first, THEN start speech recognition
    if (!hasSpokenOpeningRef.current && scenario) {
      hasSpokenOpeningRef.current = true;
      setIsAiSpeaking(true);
      speak(openingLineRef.current || scenario.openingLine).then(async () => {
        await new Promise((r) => setTimeout(r, 300));
        setIsAiSpeaking(false);
        // NOW start listening — AI is completely done
        lk.start();
        console.log("Speech recognition started — listening for user");
      });
    } else {
      lk.start();
    }

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ---- Collect warnings from hooks ----
  useEffect(() => {
    const w: string[] = [];
    if (body.cameraError) w.push(body.cameraError);
    // Don't warn about face-only mode — it's intentional now (face landmarks track everything)
    if (lk.speechError) w.push(lk.speechError);
    setWarnings(w);
  }, [body.cameraError, lk.speechError]);

  // Keep refs to latest metric values so the interval always reads current data
  const bodyMetricsRef = useRef(body.metrics);
  const voiceEnergyRef = useRef(0);
  const speechRateRef = useRef(0);
  const fillerCountRef = useRef(0);
  const pauseCountRef = useRef(0);

  useEffect(() => { bodyMetricsRef.current = body.metrics; }, [body.metrics]);

  // ---- Compute confidence + record metrics ----
  useEffect(() => {
    if (status !== "active") return;

    metricsIntervalRef.current = setInterval(() => {
      const voiceMetrics = {
        speechRate: speechRateRef.current,
        fillerWordCount: fillerCountRef.current,
        energyLevel: voiceEnergyRef.current,
        pauseCount: pauseCountRef.current,
      };
      const score = computeConfidence(bodyMetricsRef.current, voiceMetrics);
      setConfidenceScore(score);

      const combined: CombinedMetrics = {
        body: { ...bodyMetricsRef.current },
        voice: voiceMetrics,
        confidenceScore: score,
        timestamp: Date.now(),
      };
      setMetricsTimeline((prev) => [...prev, combined]);
    }, 500); // NFR-2: 500ms updates

    return () => {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // Only re-create interval when status changes. Refs handle live data.

  // ---- Detect silence → call Gemini ----
  useEffect(() => {
    if (status !== "active" || isAiSpeaking) return;

    // Use currentTurnText (resets each turn) instead of cumulative transcript
    const turnText = lk.currentTurnText;
    if (turnText !== lastUserTextRef.current && turnText.length > 0) {
      lastUserTextRef.current = turnText;

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        handleUserFinishedSpeaking(turnText);
      }, 2000); // 2s silence — fast enough for real conversation feel
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lk.currentTurnText, status, isAiSpeaking]);

  // ---- Handle user turn → Gemini call ----
  const handleUserFinishedSpeaking = useCallback(
    async (turnText: string) => {
      if (!turnText.trim()) return;

      // ECHO FILTER: bidirectional check against recent AI messages.
      const recentAiMsgs = messages.filter((m) => m.role === "ai").slice(-3);
      const userLower = turnText.trim().toLowerCase();
      const userWordList = userLower.split(/\s+/);
      const userWordsLong = userWordList.filter((w) => w.length > 3);

      for (const aiMsg of recentAiMsgs) {
        const aiLower = aiMsg.text.toLowerCase();
        const aiWords = aiLower.split(/\s+/).filter((w) => w.length > 3);
        if (aiWords.length === 0) continue;

        // Direction 1: what % of AI words appear in user text
        const aiInUser = aiWords.filter((w) => userLower.includes(w)).length;
        const ratioAiInUser = aiInUser / aiWords.length;

        // Direction 2: what % of USER words appear in AI text (catches substring echo)
        const userInAi = userWordsLong.length > 0
          ? userWordsLong.filter((w) => aiLower.includes(w)).length / userWordsLong.length
          : 0;

        // Echo if: >30% of AI words in user text, OR >60% of user words in AI text
        if (ratioAiInUser > 0.30 || userInAi > 0.60) {
          console.warn(`Echo detected (AI→User: ${(ratioAiInUser * 100).toFixed(0)}%, User→AI: ${(userInAi * 100).toFixed(0)}%) — discarding`);
          lk.markTurnEnd();
          lastUserTextRef.current = "";
          return;
        }
      }

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        text: turnText.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Mute recognition — keep it running but discard results while AI speaks
      lk.mute();
      setIsAiSpeaking(true);

      const allMessages = [...messages, userMsg];
      const currentMetrics: CombinedMetrics = {
        body: { ...body.metrics },
        voice: {
          speechRate: lk.speechRate,
          fillerWordCount: lk.fillerWordCount,
          energyLevel: lk.energyLevel,
          pauseCount: lk.pauseCount,
        },
        confidenceScore,
        timestamp: Date.now(),
      };

      // Build full system prompt with character + job/legal context
      let fullSystemPrompt = scenario!.systemPrompt + (character ? "\n\n" + character.promptModifier : "");
      if (jobContext && scenario!.id === "interview") {
        fullSystemPrompt += `\n\nJOB CONTEXT: The candidate is interviewing for: ${jobContext}. Tailor ALL questions to this specific role. Ask about relevant skills, experience, and scenarios specific to this job. Reference the role requirements when probing their answers.`;
      }
      if (jobContext && scenario!.id === "legal") {
        fullSystemPrompt += `\n\nFIRM SPECIALTY: This law firm specializes in ${jobContext}. You MUST adapt your entire situation to match this practice area. Reshape your story so it naturally fits ${jobContext} law — change relationships, dispute types, and context accordingly. For example: if the firm does divorce/family law, your issue involves a spouse or family dispute; if corporate, a business conflict; if real estate, a property dispute; if IP/patent, an invention theft issue. BUT you MUST still naturally mention these specific names during the conversation (they are critical for the firm's conflict check system): David Chen, Meridian Tech Solutions, Apex Industries, Sarah Mitchell, Greenfield Properties, NovaCorp Holdings, Chen Industries, Robert Johnson. Weave them in as parties, relatives, companies, witnesses, or related entities — adapt their roles to fit the ${jobContext} context.`;
      }

      // Fire coaching in background — do NOT block the conversation critical path
      getCoachingAnnotation(scenario!.id, turnText, currentMetrics).then(coaching => {
        if (coaching) {
          const annotation: Annotation = {
            id: `coach-${Date.now()}`,
            text: coaching.text,
            type: coaching.type,
            timestamp: Date.now(),
          };
          setCoachingAnnotations(prev => [...prev.slice(-2), annotation]);
          setTimeout(() => {
            setCoachingAnnotations(prev => prev.filter(a => a.id !== annotation.id));
          }, 8000);
        }
      });

      // Critical path: Gemini role-play response only
      let aiText = await getRolePlayResponse(
        fullSystemPrompt,
        toGeminiHistory(allMessages),
        currentMetrics,
        scenario!.id
      );

      // Fix truncated/incomplete responses
      if (aiText) {
        // Strip trailing ellipsis
        aiText = aiText.replace(/\.{2,}\s*$/, ".").trimEnd();

        // Split into sentences and remove the last one if it's garbage (< 8 words)
        const sentences = aiText.match(/[^.!?]*[.!?]+/g);
        if (sentences && sentences.length > 1) {
          const lastSentence = sentences[sentences.length - 1].trim();
          const lastWordCount = lastSentence.split(/\s+/).length;
          // If last sentence is suspiciously short (< 4 words like "and a."), remove it
          if (lastWordCount < 4) {
            sentences.pop();
            aiText = sentences.join("").trimEnd();
          }
        }

        // If no sentence boundaries at all and text doesn't end with punctuation, add period
        if (!aiText.match(/[.!?]["']?\s*$/)) {
          aiText = aiText.trimEnd() + ".";
        }
      }

      const aiMsgId = `ai-${Date.now()}`;

      // Add message with empty text — text will stream synced to speech
      setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", text: "", timestamp: Date.now() }]);

      // Fire conflict check in background for legal scenario
      if (scenario!.id === "legal") {
        const aiMsg: Message = { id: aiMsgId, role: "ai", text: aiText, timestamp: Date.now() };
        const fullConvo = [...allMessages, aiMsg];
        runConflictCheck(fullConvo, jobContext || undefined).then(report => {
          if (!report || report.results.length === 0) return;
          setConflictReport(report);
          const newAlerts: ConflictAlert[] = report.results
            .filter(r => r.risk !== "low")
            .map(r => ({
              id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              entityName: r.match.extractedEntity,
              risk: r.risk,
              matchType: r.match.matchType,
              summary: r.explanation,
              timestamp: Date.now(),
            }));
          if (newAlerts.length > 0) {
            setConflictAlerts(prev => {
              const existing = new Set(prev.map(a => a.entityName));
              const fresh = newAlerts.filter(a => !existing.has(a.entityName));
              return [...prev, ...fresh].slice(-8);
            });
          }
        });
      }

      // Speak with text streaming synced to speech
      await speak(aiText, (displayedText) => {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: displayedText } : m));
      });

      // Ensure full text shown
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: aiText } : m));

      // Brief pause then unmute
      await new Promise((r) => setTimeout(r, 200));

      // ALWAYS unmute — wrapped in try/catch so nothing can prevent it
      try {
        setIsAiSpeaking(false);
        lk.markTurnEnd();
        lastUserTextRef.current = "";
        lk.unmute();
        console.log("Speech recognition unmuted — listening for user");
      } catch (err) {
        console.error("Unmute failed:", err);
        // Force recovery
        setIsAiSpeaking(false);
        lk.unmute();
      }
    },
    [messages, body.metrics, lk.energyLevel, lk, confidenceScore, scenario, character, jobContext]
  );

  // ---- End round → Gemini feedback (page is the ONLY caller) ----
  const handleEndRound = useCallback(() => {
    setStatus("reviewing");
    setIsLoadingFeedback(true);

    // Kill all timers FIRST — prevent any pending speech from triggering
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    // Keep camera running during review (avoid black screen) — only stop mic
    lk.mute();
    lk.stop();

    const fullTranscript = messages
      .map((m) => `${m.role === "ai" ? "AI" : "You"}: ${m.text}`)
      .join("\n");

    let feedbackPrompt = scenario!.systemPrompt + (character ? "\n\n" + character.promptModifier : "");
    if (jobContext && scenario!.id === "interview") {
      feedbackPrompt += `\n\nJOB CONTEXT: The candidate was interviewing for: ${jobContext}.`;
    }
    if (scenario!.id === "legal") {
      const conflictCount = conflictReport?.results.length || 0;
      const entitiesFound = conflictReport?.entitiesChecked || 0;
      feedbackPrompt += `\n\nLEGAL INTAKE EVALUATION: The user is an ATTORNEY conducting a client intake. Evaluate their performance AS A LAWYER gathering information for a conflict check.

REFRAME ALL FEEDBACK FOR LEGAL CONTEXT:
- body_feedback: Frame as client trust — "maintaining eye contact builds client confidence to share sensitive details" or "fidgeting may make the client hesitant to disclose"
- voice_feedback: Frame as professional presence — "steady speech pace projects competence" or "filler words can undermine client confidence in your expertise"
- content_feedback: Focus on INTAKE QUALITY — Did they ask probing follow-up questions? Did they ask about ALL parties involved? Did they ask about opposing counsel, related entities, family connections? Did they miss obvious follow-ups?
- strategy_analysis: Assess their QUESTIONING TECHNIQUE — open-ended vs closed questions, how effectively they drew out entity names for conflict detection
- strongest_moment / weakest_moment: Reference specific questions they asked (or failed to ask) that surfaced (or missed) key entities
- tip_for_next_round: Give a specific intake technique tip

CONFLICT CHECK RESULTS: ${conflictCount} conflicts detected from ${entitiesFound} entities extracted. Factor this into the assessment — did the attorney's questioning uncover enough information?`;
    }

    getRoundFeedback(feedbackPrompt, fullTranscript, metricsTimeline)
      .then((fb) => {
        setFeedback(fb);
        setIsLoadingFeedback(false);
      })
      .catch((err) => {
        console.error("Feedback error:", err);
        setIsLoadingFeedback(false);
      });
  }, [messages, metricsTimeline, scenario, body, lk]);

  const handleSkipAI = useCallback(() => {
    console.log("User skipped AI speech");
    abortSpeech();
  }, []);

  const handleRestart = () => {
    body.stop(); // Stop camera when leaving review
    setStatus("selecting");
    setScenario(null);
    setCharacter(null);
  };

  // ---- Voice metrics for passing down ----
  const voiceMetrics = {
    speechRate: lk.speechRate,
    fillerWordCount: lk.fillerWordCount,
    energyLevel: lk.energyLevel,
    pauseCount: lk.pauseCount,
  };

  // Update refs for metrics interval
  useEffect(() => { voiceEnergyRef.current = lk.energyLevel; }, [lk.energyLevel]);
  useEffect(() => { speechRateRef.current = lk.speechRate; }, [lk.speechRate]);
  useEffect(() => { fillerCountRef.current = lk.fillerWordCount; }, [lk.fillerWordCount]);
  useEffect(() => { pauseCountRef.current = lk.pauseCount; }, [lk.pauseCount]);

  // ---- FM-6: Block if speech not supported ----
  const isSpeechBlocked = !!lk.speechError;

  return (
    <main className="min-h-dvh flex flex-col relative">
      {/* 3D Background — responds to confidence score */}
      <Background3D
        confidenceScore={confidenceScore}
        isActive={status === "active"}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 glass-surface relative z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">RE</span>
            <span className="text-text-primary">PLAI</span>
          </h1>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] text-accent/70 font-medium tracking-wide">
            <span>✦</span> Gemini 2.5 Flash
          </span>
        </div>
        {scenario && status !== "selecting" && (
          <div className="flex items-center gap-3">
            {status === "active" && (
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-good/10 border border-good/20">
                <span className="w-1.5 h-1.5 rounded-full bg-good status-dot" />
                <span className="text-xs text-good font-medium tracking-wide">LIVE</span>
              </span>
            )}
            {status === "reviewing" && (
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                <span className="text-xs text-accent font-medium tracking-wide">REVIEW</span>
              </span>
            )}
            <span className="text-sm text-text-secondary font-medium">
              {scenario.title}
            </span>
          </div>
        )}
      </header>

      {/* Warning bars (L2.7 Error Response Standard) */}
      {warnings.map((w, i) => (
        <WarningBar key={i} message={w} />
      ))}

      {/* FM-6: Chrome block */}
      {isSpeechBlocked && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-4">🚫</p>
            <p className="text-xl font-semibold text-bad mb-2">Chrome Required</p>
            <p className="text-text-secondary">
              {lk.speechError}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isSpeechBlocked && (
        <div className="flex-1 flex">
          {status === "selecting" && (
            <ScenarioSelector onSelect={handleSelectScenario} />
          )}

          {status === "character-select" && scenario && (
            <CharacterSelect
              scenarioId={scenario.id}
              scenarioTitle={scenario.title}
              characters={characterPresets[scenario.id] || characterPresets.salary}
              onSelect={handleSelectCharacter}
            />
          )}

          {status === "countdown" && scenario && (
            <div className="flex-1 flex flex-col items-center justify-center gap-10 relative overflow-hidden">
              {/* Background pulse */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                <div className="w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
              </div>

              <div className="text-center relative z-10">
                <p className="text-text-secondary text-lg font-medium mb-1">
                  {scenario.title}
                </p>
                <p className="text-text-secondary/60 text-sm">
                  Camera &amp; mic will activate. Get ready.
                </p>
              </div>

              <div
                className="relative z-10 text-[10rem] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-b from-accent to-accent/40"
                key={countdown}
                style={{ animation: "pulse 0.5s ease-out" }}
              >
                {countdown || "GO"}
              </div>

              {/* Status indicators */}
              <div className="flex gap-8 relative z-10">
                {["Camera", "Microphone", "AI"].map((label) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-good status-dot" />
                    <span className="text-xs text-text-secondary/60 uppercase tracking-wider">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(status === "active" || status === "reviewing") && scenario && (
            <SessionView
              status={status}
              onEndRound={handleEndRound}
              onRestart={handleRestart}
              onSkipAI={handleSkipAI}
              // Pass all data down — SessionView is now a pure display component
              bodyTracking={body}
              voiceMetrics={voiceMetrics}
              confidenceScore={confidenceScore}
              messages={messages}
              interimText={lk.interimText}
              isAiSpeaking={isAiSpeaking}
              feedback={feedback}
              isLoadingFeedback={isLoadingFeedback}
              elapsedSeconds={elapsedSeconds}
              coachingAnnotations={coachingAnnotations}
              conflictAlerts={conflictAlerts}
              conflictReport={conflictReport}
              isLegalScenario={scenario.id === "legal"}
            />
          )}
        </div>
      )}
    </main>
  );
}
