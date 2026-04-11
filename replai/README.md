# REPLAI

> AI-powered conversation practice with real-time body language + voice analysis.  
> Built for **Hack the Bay 2026** at USF Tampa.

---

## What is REPLAI?

REPLAI drops you into high-stakes conversations — salary negotiations, job interviews, landlord disputes, HR complaints, legal client intakes — and makes you practice them. An AI opponent role-plays the other party while your webcam and microphone track how you're actually coming across: eye contact, fidgeting, posture, speech rate, filler words, energy. After each round, you get a full scorecard breaking down what went well and where you fell apart.

Zero backend servers. Runs entirely in the browser.

---

## Features

- **5 Conversation Scenarios** — Salary negotiation, job interview, landlord confrontation, harassment reporting, legal client intake
- **3 Difficulty Presets per Scenario** — Easy / Normal / Hard with distinct AI personality modifiers
- **Real-time Body Tracking** — MediaPipe Face Mesh for eye contact %, fidget rate, and posture score
- **Real-time Voice Analysis** — Speech rate, filler word detection, audio energy via LiveKit WebRTC
- **Confidence Score** — Composite 0–100 score (eye contact 30%, fidget 20%, posture 15%, fillers 15%, energy 10%, pace 10%)
- **AI Coaching Annotations** — Fire-and-forget Gemini calls surface tips on the video feed mid-conversation
- **End-of-Round Scorecard** — Structured JSON feedback: strongest/weakest moments, emotional arc, improvement areas
- **Legal Conflict Detection** *(Scenario 5 only)* — Gemini extracts entities from conversation, runs fuzzy matching against a mock law firm database, and flags High/Medium/Low risk conflicts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| 3D Background | Three.js + React Three Fiber |
| AI | Google Gemini 2.5 Flash (REST) |
| Voice / Echo Cancellation | LiveKit WebRTC 2.18 |
| Speech-to-Text | Web Speech API (Chrome built-in) |
| Text-to-Speech | Browser SpeechSynthesis |
| Body Tracking | MediaPipe Face Mesh 0.10 |
| Conflict Engine | Custom TypeScript — Levenshtein + Jaccard fuzzy matching |

---

## Architecture

REPLAI is a single-orchestrator design. `page.tsx` owns all state, all hooks, and all API calls. Nothing else touches Gemini or LiveKit directly.

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER (Chrome)                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  page.tsx (Orchestrator)                 │    │
│  │   selecting → character-select → countdown              │    │
│  │              → active → reviewing                       │    │
│  └────┬──────────┬──────────┬──────────┬───────────────────┘    │
│       │          │          │          │                         │
│  ┌────▼────┐ ┌──▼───┐ ┌───▼────┐ ┌──▼────────────┐            │
│  │useBody  │ │useLK │ │gemini  │ │conflictCheck  │            │
│  │Tracking │ │Voice │ │.ts     │ │(legal only)   │            │
│  └────┬────┘ └──┬───┘ └───┬────┘ └───┬───────────┘            │
│       │         │         │          │                          │
│  MediaPipe  LiveKit    Browser    firmDatabase                  │
│  Face Mesh  WebRTC     Speech     fuzzy engine                  │
│  (GPU)      + Mic      Synthesis                                │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                      ┌────────▼────────┐
                      │  Gemini 2.5     │
                      │  Flash API      │
                      └─────────────────┘
```

### Conversation Turn Pipeline

```
User speaks → LiveKit mic (echo-cancelled) → Web Speech API
    │
    ▼
Silence detected (2s) → handleUserFinishedSpeaking()
    │
    ├── Echo filter: discard if >30% AI words in user text
    ├── Mute mic
    ├── [Background] Coaching annotation (Gemini, fire-and-forget)
    │
    ▼
Gemini 2.5 Flash → AI response text
    │
    ├── [Legal only] Entity extraction → conflict check → video overlay
    │
    ▼
speak() → Browser SpeechSynthesis (sentence-by-sentence)
    │
    ▼
Post-speech: 300ms → unmute mic → clear turn
```

### Metrics Pipeline

Every 500ms, body + voice metrics are collected and fed into `computeConfidence()`:

| Signal | Weight | Source |
|--------|--------|--------|
| Eye contact % | 30% | MediaPipe iris deviation < 15% |
| Fidget rate (inverted) | 20% | Nose + jaw variance with dead zones |
| Posture score | 15% | Ear-to-ear Y delta + chin-forehead distance |
| Filler words (inverted) | 15% | 9 patterns: um, uh, like, you know… |
| Audio energy | 10% | RMS from LiveKit AudioContext |
| Speech pace | 10% | 15s sliding window, optimal 70–180 wpm |

---

## Project Structure

```
src/
├── app/
│   ├── api/livekit-token/route.ts   # LiveKit JWT generation
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                     # Orchestrator — all state + hooks + API calls
├── components/
│   ├── Background3D.tsx             # Three.js orbs + confidence glow ring
│   ├── CharacterSelect.tsx          # Difficulty presets + context input
│   ├── ConversationPanel.tsx        # Chat bubbles + typing indicator
│   ├── MetricsPanel.tsx             # Live metric bars
│   ├── ScenarioSelector.tsx         # 5 scenario cards
│   ├── ScoreCard.tsx                # Round results + conflict report
│   ├── SessionView.tsx              # Three-panel layout
│   ├── VideoFeed.tsx                # Webcam + landmark overlay + alerts
│   └── WarningBar.tsx               # Error notifications
├── hooks/
│   ├── useBodyTracking.ts           # MediaPipe Face Mesh + metrics
│   └── useLiveKitVoice.ts           # LiveKit WebRTC + Web Speech API
└── lib/
    ├── characters.ts                # 5 scenarios × 3 difficulty presets
    ├── gemini.ts                    # All 7 Gemini features
    ├── scenarios.ts                 # Scenario definitions + system prompts
    ├── scoring.ts                   # Confidence formula
    ├── types.ts                     # TypeScript interfaces
    └── legal/
        ├── conflictCheck.ts         # Conflict check orchestrator
        ├── conflictEngine.ts        # Levenshtein + Jaccard fuzzy matching
        └── firmDatabase.ts          # Mock firm DB (20 clients, 15 matters)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Google Chrome** (required — Web Speech API is Chrome-only)
- A **Gemini API key** (free tier works)
- A **LiveKit Cloud** account (free tier works) — [livekit.io](https://livekit.io)

### Clone & Install

```bash
git clone https://github.com/your-org/replai.git
cd replai
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Gemini (required)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# LiveKit (required)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# ElevenLabs (optional — deprecated, free tier exhausted)
NEXT_PUBLIC_ELEVENLABS_API_KEY=
```

**Getting your keys:**
- **Gemini** → [aistudio.google.com](https://aistudio.google.com) → Get API Key
- **LiveKit** → [cloud.livekit.io](https://cloud.livekit.io) → New Project → Settings → Keys

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in **Chrome**.

> **Note:** Camera and microphone permissions are required for full functionality. The app degrades gracefully if denied — conversation and voice metrics still work without camera access.

### Build for Production

```bash
npm run build
npm start
```

---

## Gemini Integration

REPLAI uses Gemini 2.5 Flash for 7 distinct features:

| # | Feature | Pattern |
|---|---------|---------|
| 1 | Multi-turn role-play conversation | `system_instruction` + conversation history |
| 2 | Character conditioning | `promptModifier` appended to system prompt |
| 3 | Metrics-aware adaptive AI | Real-time confidence/body metrics injected per turn |
| 4 | Structured JSON feedback scorecard | `responseMimeType: "application/json"` + schema |
| 5 | Real-time coaching annotations | Parallel fire-and-forget with structured output |
| 6 | Legal entity extraction | Structured output extracting parties from transcript |
| 7 | Conflict risk analysis | Entities fed into local fuzzy matching engine |

---

## Fault Tolerance

| Failure | Recovery |
|---------|---------|
| Gemini timeout > 8s | Cached fallback response per scenario |
| Gemini truncated text | Trim to last complete sentence |
| Entity extraction JSON truncated | Salvage entity names via regex from partial JSON |
| AI mic echo (>30% word overlap) | Discard turn, clear transcript |
| MediaPipe FPS < 5 | Auto-fallback to face-only mode |
| TTS hang | 30s master timeout + 10s per-sentence timeout |
| Camera / mic denied | Warning bar, conversation continues |
| Web Speech API unavailable | Chrome-required block screen |

---

## Scenarios

| Scenario | AI Character | Focus |
|----------|-------------|-------|
| Salary Negotiation | Alex Chen — hiring manager, 12yr experience | Assertiveness, anchoring |
| Job Interview | Jordan Park — VP Engineering, 500+ interviews | Confidence, storytelling |
| Landlord Confrontation | Pat Moreno — landlord, 20yr, dismissive | De-escalation, documentation |
| Report Harassment | Morgan Ellis — HR Business Partner, risk-averse | Clarity, composure |
| Legal Client Intake | Casey Morales — prospective client, nervous | Active listening, conflict detection |

Each scenario has Hard / Normal / Easy difficulty presets that adjust the AI's personality, pushback level, and empathy.

---

## Built At

**Hack the Bay 2026** · USF Tampa · 6-hour build window

---

## License

MIT
