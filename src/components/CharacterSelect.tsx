"use client";

import { useState } from "react";
import type { CharacterProfile } from "@/lib/characters";

interface Props {
  scenarioId: string;
  scenarioTitle: string;
  characters: CharacterProfile[];
  onSelect: (character: CharacterProfile, jobContext?: string) => void;
}

const difficultyColors = {
  "Hard Mode": "border-bad/40 hover:border-bad/70 hover:bg-bad/5",
  "Normal": "border-warning/40 hover:border-warning/70 hover:bg-warning/5",
  "Easy Mode": "border-good/40 hover:border-good/70 hover:bg-good/5",
};

const labelColors = {
  "Hard Mode": "text-bad",
  "Normal": "text-warning",
  "Easy Mode": "text-good",
};

export default function CharacterSelect({ scenarioId, scenarioTitle, characters, onSelect }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDesc, setCustomDesc] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [firmContext, setFirmContext] = useState("");

  // Use the right context based on scenario
  const contextValue = scenarioId === "legal" ? firmContext : jobTitle;

  const handleCustomSubmit = () => {
    if (!customDesc.trim()) return;
    const custom: CharacterProfile = {
      id: "custom",
      name: "Custom Character",
      label: "Custom",
      description: customDesc,
      personality: "assertive",
      pushback: "medium",
      empathy: "medium",
      promptModifier: `CUSTOM PERSONALITY OVERRIDE: The user described the person they're practicing against as: "${customDesc}"

You MUST embody this exact personality. Adopt their mannerisms, tone, attitude, and behavioral patterns as described. If they said the person is rude, be rude. If they said the person is passive-aggressive, be passive-aggressive. If they said the person interrupts, interrupt. Match the description precisely — this is who you ARE for this session.`,
    };
    onSelect(custom, contextValue.trim() || undefined);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="text-center">
        <p className="text-text-secondary text-sm uppercase tracking-wider mb-2">
          {scenarioTitle}
        </p>
        <h2 className="text-3xl font-bold mb-3">
          Choose your <span className="text-accent">opponent</span>
        </h2>
        <p className="text-text-secondary text-sm max-w-md mx-auto">
          Pick a preset or describe the exact person you&apos;re preparing for.
        </p>
      </div>

      {/* Job context input — interview scenario */}
      {scenarioId === "interview" && (
        <div className="w-full max-w-3xl">
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-bg-surface border border-accent/20">
            <label className="text-xs text-accent uppercase tracking-wider font-semibold">
              What role are you interviewing for?
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Software Engineer at Google, Product Manager, Data Analyst..."
              className="w-full px-4 py-3 rounded-lg bg-bg-base border border-border text-sm text-text-primary
                       placeholder:text-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
            />
            {jobTitle.trim() && (
              <p className="text-[11px] text-text-secondary/60">
                Questions will be tailored to this specific role
              </p>
            )}
          </div>
        </div>
      )}

      {/* Firm context input — legal scenario */}
      {scenarioId === "legal" && (
        <div className="w-full max-w-3xl">
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-bg-surface border border-warning/20">
            <label className="text-xs text-warning uppercase tracking-wider font-semibold">
              What type of law does your firm practice?
            </label>
            <input
              type="text"
              value={firmContext}
              onChange={(e) => setFirmContext(e.target.value)}
              placeholder="e.g. Corporate M&A, Family Law, Personal Injury, Real Estate..."
              className="w-full px-4 py-3 rounded-lg bg-bg-base border border-border text-sm text-text-primary
                       placeholder:text-text-secondary/40 focus:outline-none focus:border-warning transition-colors"
            />
            {firmContext.trim() && (
              <p className="text-[11px] text-text-secondary/60">
                Conflict checks will be tailored to this practice area
              </p>
            )}
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="flex gap-4 w-full max-w-3xl">
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => onSelect(char, contextValue.trim() || undefined)}
            className={`flex-1 flex flex-col gap-3 p-5 rounded-xl bg-bg-surface border
                       transition-all duration-200 text-left cursor-pointer group
                       ${difficultyColors[char.label as keyof typeof difficultyColors] || "border-border hover:border-accent"}`}
            aria-label={`Select ${char.name} — ${char.description}`}
          >
            <span className={`text-xs font-semibold uppercase tracking-wider
              ${labelColors[char.label as keyof typeof labelColors] || "text-accent"}`}>
              {char.label}
            </span>
            <h3 className="text-base font-semibold text-text-primary group-hover:text-white transition-colors">
              {char.name}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {char.description}
            </p>
          </button>
        ))}
      </div>

      {/* Custom personality */}
      <div className="w-full max-w-3xl">
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full py-3 rounded-xl border border-dashed border-accent/30 text-accent text-sm
                     hover:border-accent/60 hover:bg-accent/5 transition-colors cursor-pointer"
          >
            Or describe the exact person you&apos;re preparing for...
          </button>
        ) : (
          <div className="flex flex-col gap-3 p-5 rounded-xl bg-bg-surface border border-accent/30">
            <label className="text-xs text-accent uppercase tracking-wider font-semibold">
              Describe the person
            </label>
            <textarea
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="My boss is super strict and harsh. He interrupts people mid-sentence, never smiles, and responds to everything with 'that's not good enough.' He makes you feel like nothing you do is ever right."
              className="w-full h-24 px-4 py-3 rounded-lg bg-bg-base border border-border text-sm text-text-primary
                       placeholder:text-text-secondary/40 resize-none focus:outline-none focus:border-accent"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCustom(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomSubmit}
                disabled={!customDesc.trim()}
                className="px-6 py-2 rounded-lg bg-accent text-white text-sm font-semibold
                         hover:bg-accent/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start with this person
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
