"use client";

import type { Scenario } from "@/lib/types";
import { scenarios } from "@/lib/scenarios";

// SVG icons with accent glow backgrounds
const SCENARIO_ICONS: Record<string, React.ReactNode> = {
  salary: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  ),
  interview: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
  ),
  landlord: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  harassment: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
  legal: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971ZM5.25 4.97 7.87 15.696c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
    </svg>
  ),
};

interface Props {
  onSelect: (scenario: Scenario) => void;
}

export default function ScenarioSelector({ onSelect }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-12 px-6 py-12 relative overflow-hidden">
      {/* Background gradient orbs for visual depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-good/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      {/* Hero section */}
      <div className="text-center max-w-2xl relative z-10">
        {/* Brand mark */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-8 fade-in-up stagger-1">
          <div className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
          <span className="text-xs font-medium text-accent tracking-wider uppercase">AI-Powered Conversation Practice</span>
        </div>

        <h2 className="text-5xl sm:text-6xl font-bold mb-6 leading-[1.1] tracking-tight fade-in-up stagger-2">
          What conversation are you{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-good">
            dreading
          </span>
          ?
        </h2>

        <p className="text-text-secondary text-lg leading-relaxed max-w-lg mx-auto fade-in-up stagger-3">
          Pick a scenario. AI plays the other person — tough, realistic.
          Your webcam reveals the nervous habits you didn&apos;t know you had.
        </p>
      </div>

      {/* Scenario cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl relative z-10"
        role="group"
        aria-label="Conversation scenarios"
      >
        {scenarios.map((scenario, index) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            aria-label={`Practice: ${scenario.title} — ${scenario.description}`}
            className={`scenario-card fade-in-up stagger-${index + 1} group flex items-start gap-4 p-5 rounded-xl
                       bg-gradient-to-br from-bg-surface to-bg-base
                       border border-border/60 min-h-[100px]
                       hover:border-accent/60 hover:from-bg-raised hover:to-bg-surface
                       active:scale-[0.97]
                       text-left cursor-pointer`}
          >
            {/* Icon with glow background */}
            <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent
                          group-hover:bg-accent/20 group-hover:border-accent/40 transition-colors duration-200">
              {SCENARIO_ICONS[scenario.id] ?? (
                <div className="w-4 h-4 rounded-full bg-accent/40" aria-hidden="true" />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors duration-200">
                {scenario.title}
              </h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">
                {scenario.description}
              </p>
            </div>

            {/* Arrow indicator */}
            <svg className="w-4 h-4 text-border group-hover:text-accent shrink-0 mt-0.5 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>

      {/* Tagline */}
      <p className="text-text-secondary/40 text-xs tracking-widest uppercase relative z-10 fade-in-up">
        Your body says what your mouth won&apos;t
      </p>
    </div>
  );
}
