# REPLAI — System Architecture

> AI-powered conversation practice with real-time body language + voice analysis and legal conflict detection.
> Built for Hack the Bay 2026 at USF Tampa.

---

## 1. System Overview

REPLAI is a browser-based application where users practice difficult conversations (salary negotiation, job interviews, landlord disputes, harassment reporting, legal client intake) while an AI opponent role-plays the other party. The user's webcam tracks body language and their microphone analyzes voice patterns in real-time. After each round, Gemini generates a structured performance scorecard.

### Core Value Proposition
- **Practice difficult conversations** with realistic AI opponents at adjustable difficulty
- **Real-time feedback** on body language, voice, and communication strategy
- **Legal conflict detection** (Scenario 5) — AI extracts entities from conversation and runs fuzzy matching against a firm database
- **Zero setup** — runs entirely in the browser with no backend servers

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 16.2.3 | SSR, routing, API routes |
| UI | React | 19.2.4 | Component rendering |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| 3D Graphics | Three.js + React Three Fiber | 0.183.2 | Background orbs, confidence glow ring |
| AI Conversation | Google Gemini 2.5 Flash | REST API | Role-play, feedback, coaching, entity extraction |
| Voice Input | LiveKit (WebRTC) | 2.18.1 | Echo cancellation, noise suppression, audio energy |
| Speech Recognition | Web Speech API | Chrome built-in | Speech-to-text transcription |
| Text-to-Speech | Browser SpeechSynthesis | Chrome built-in | AI voice output (sentence-by-sentence) |
| Body Tracking | MediaPipe Face Mesh | 0.10.34 | Eye contact, fidget, posture via face landmarks |
| Conflict Engine | Custom (TypeScript) | — | Levenshtein + Jaccard fuzzy matching, risk scoring |

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Chrome)                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    page.tsx (Orchestrator)                    │   │
│  │  Round lifecycle: selecting → character-select → countdown   │   │
│  │                   → active → reviewing                       │   │
│  │  Owns ALL hooks, ALL state, ALL API calls                    │   │
│  └─────┬──────────┬──────────┬──────────┬──────────┬───────────┘   │
│        │          │          │          │          │                 │
│   ┌────▼────┐ ┌──▼───┐ ┌───▼────┐ ┌──▼───┐ ┌───▼──────────┐     │
│   │ useBody │ │useLK │ │gemini  │ │elev- │ │ conflict     │     │
│   │Tracking │ │Voice │ │.ts     │ │enlabs│ │ Check        │     │
│   │         │ │      │ │        │ │.ts   │ │ (legal only) │     │
│   └────┬────┘ └──┬───┘ └───┬────┘ └──┬───┘ └───┬──────────┘     │
│        │         │         │         │          │                  │
│   ┌────▼────┐ ┌──▼──────┐ │    ┌────▼────┐ ┌──▼───────────┐     │
│   │MediaPipe│ │LiveKit  │ │    │Browser  │ │firmDatabase  │     │
│   │Face Mesh│ │Room +   │ │    │Speech   │ │.ts (mock DB) │     │
│   │(GPU)    │ │WebRTC   │ │    │Synthesis│ │              │     │
│   └────┬────┘ └──┬──────┘ │    └─────────┘ └──────────────┘     │
│        │         │         │                                       │
│   ┌────▼────┐ ┌──▼──────┐ │                                       │
│   │Webcam   │ │Mic +    │ │                                       │
│   │(getUserM│ │Echo     │ │                                       │
│   │edia)   │ │Cancel   │ │                                       │
│   └─────────┘ └─────────┘ │                                       │
│                            │                                       │
└────────────────────────────┼───────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Gemini 2.5     │
                    │  Flash API      │
                    │  (Google Cloud) │
                    └─────────────────┘
```

---

## 4. Component Registry

### 4.1 Orchestrator

| File | Lines | Responsibility |
|------|-------|----------------|
| `src/app/page.tsx` | ~590 | **Single source of truth.** Owns round lifecycle state machine, all hooks, all Gemini API calls, mute/unmute timing, echo filtering, text streaming, conflict check orchestration. No other component makes API calls or owns hooks. |

### 4.2 Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useBodyTracking` | `src/hooks/useBodyTracking.ts` | MediaPipe Face Mesh initialization, webcam capture, per-frame landmark processing, eye contact detection (15% iris deviation threshold), fidget measurement (nose variance + jaw width variance with dead zones), posture scoring (ear-to-ear Y delta + chin-to-forehead distance), annotation generation |
| `useLiveKitVoice` | `src/hooks/useLiveKitVoice.ts` | LiveKit room connection with WebRTC echo cancellation, Web Speech API integration with mute gate (`mutedRef`) and hard stop gate (`stoppedRef`), speech rate calculation (15s sliding window), filler word counting, audio energy (RMS) monitoring, turn management |

### 4.3 UI Components

| Component | File | Props Source | Responsibility |
|-----------|------|-------------|----------------|
| `ScenarioSelector` | `src/components/ScenarioSelector.tsx` | Static `scenarios[]` | 5 scenario cards with icons, hover effects, staggered animations |
| `CharacterSelect` | `src/components/CharacterSelect.tsx` | `characterPresets[scenarioId]` | 3 difficulty presets (Hard/Normal/Easy) + custom personality textarea + context input (job title for interview, firm specialty for legal) |
| `SessionView` | `src/components/SessionView.tsx` | All props from page.tsx | Three-panel grid layout (camera \| conversation \| metrics/scorecard), bottom toolbar |
| `VideoFeed` | `src/components/VideoFeed.tsx` | Refs + landmarks + annotations | Mirrored webcam, canvas overlay with face tracking dots, body annotations (top-left), coaching annotations (bottom-right), conflict alerts (top-right) |
| `ConversationPanel` | `src/components/ConversationPanel.tsx` | `messages[]` + `interimText` | Chat bubbles, AI typing indicator with Gemini branding, live interim transcript, auto-scroll |
| `MetricsPanel` | `src/components/MetricsPanel.tsx` | Body + voice metrics | Confidence score (color-coded), metric bars for eye contact, fidget rate, posture, speech pace, filler words |
| `ScoreCard` | `src/components/ScoreCard.tsx` | `RoundFeedback` + `ConflictReport` | Staggered reveal animation, strongest/weakest moments, body/voice/content feedback, Gemini strategy analysis, emotional arc, improvement areas, conflict check report (legal only), Gemini branding |
| `Background3D` | `src/components/Background3D.tsx` | `confidenceScore` + `isActive` | Three.js floating orbs (instanced mesh), glow ring that changes color based on confidence, grid floor |
| `WarningBar` | `src/components/WarningBar.tsx` | Error message string | Yellow warning banner for camera/mic issues |

### 4.4 Libraries

| Module | File | Exports |
|--------|------|---------|
| `types` | `src/lib/types.ts` | `BodyMetrics`, `VoiceMetrics`, `CombinedMetrics`, `Message`, `Scenario`, `RoundStatus`, `RoundState`, `RoundFeedback`, `Annotation`, `ConflictAlert` |
| `scenarios` | `src/lib/scenarios.ts` | `scenarios[]` — 5 scenarios with system prompts, opening lines, character definitions |
| `characters` | `src/lib/characters.ts` | `CharacterProfile` interface, `characterPresets` — 3 difficulty levels per scenario with prompt modifiers |
| `scoring` | `src/lib/scoring.ts` | `computeConfidence()` (weighted: eye 30%, fidget 20%, posture 15%, fillers 15%, energy 10%, pace 10%), `countFillerWords()`, `getMetricStatus()` |
| `gemini` | `src/lib/gemini.ts` | `getRolePlayResponse()`, `getRoundFeedback()`, `getCoachingAnnotation()`, `extractEntitiesFromConversation()`, `toGeminiHistory()` |
| `elevenlabs` | `src/lib/elevenlabs.ts` | `speak()` (browser SpeechSynthesis, sentence-by-sentence with word-synced text streaming), `prefetchAudio()`, `resetSpeakState()` |

### 4.5 Legal Conflict Check System

| Module | File | Purpose |
|--------|------|---------|
| `firmDatabase` | `src/lib/legal/firmDatabase.ts` | Mock "Sterling & Associates" database: 20 clients, 15 matters, 8 contacts, 11 entity relationships. Includes active/former/prospective clients, open/closed/settled matters, direct and indirect relationships (parent-subsidiary, officer-of, spouse, business-partner, affiliate) |
| `conflictEngine` | `src/lib/legal/conflictEngine.ts` | `normalizeName()` (strip LLC/Inc/Corp, lowercase), `fuzzyMatch()` (Levenshtein distance + Jaccard token overlap + containment, threshold 0.7), `checkConflicts()` (scans clients, matters, contacts, relationships), `scoreRisk()` (Low/Medium/High based on match type + strength) |
| `conflictCheck` | `src/lib/legal/conflictCheck.ts` | `runConflictCheck()` — orchestrates Gemini entity extraction → local conflict engine → returns `ConflictReport` |

### 4.6 API Routes

| Route | File | Purpose |
|-------|------|---------|
| `POST /api/livekit-token` | `src/app/api/livekit-token/route.ts` | Generates LiveKit JWT tokens for WebRTC room connection using `livekit-server-sdk` |

---

## 5. Data Flow

### 5.1 Conversation Turn Pipeline

```
User speaks
    │
    ▼
LiveKit mic (echo-cancelled) → Web Speech API
    │
    ▼
currentTurnText updates (useLiveKitVoice)
    │
    ▼
Silence detection (2s timeout) → handleUserFinishedSpeaking()
    │
    ├─── Echo filter (bidirectional word matching)
    │    ├── AI→User: >30% of AI words in user text? → discard
    │    └── User→AI: >60% of user words in AI text? → discard
    │
    ├─── Mute mic (lk.mute())
    │
    ├─── [Background] Coaching annotation (Gemini, fire-and-forget)
    │
    ▼
Gemini 2.5 Flash: getRolePlayResponse()
    │
    ├── System prompt + character modifier + job/legal context + metrics
    ├── Conversation history (toGeminiHistory)
    ├── 8s timeout → cached fallback per scenario
    ├── Truncation fix: strip trailing ellipsis, trim to last sentence
    │
    ▼
AI response text
    │
    ├─── Add message (empty text, streams word-by-word)
    ├─── [Background, legal only] Conflict check pipeline
    │    ├── extractEntitiesFromConversation() (Gemini, 10s timeout)
    │    ├── checkConflicts() (local fuzzy matching)
    │    └── ConflictAlerts → VideoFeed overlay
    │
    ▼
speak(aiText, onProgress) — Browser SpeechSynthesis
    │
    ├── Split into sentences
    ├── Speak each sentence separately (avoids Chrome 15s cutoff)
    ├── Word-by-word text streaming synced to 370ms/word timer
    ├── 30s master timeout
    │
    ▼
Post-speech: 300ms wait → unmute mic → clear turn text
```

### 5.2 Metrics Pipeline

```
Every 500ms (metricsIntervalRef):
    │
    ├── bodyMetricsRef.current (from useBodyTracking)
    │   ├── eyeContactPercent (iris deviation < 15% = contact)
    │   ├── fidgetRate (nose variance + jaw variance, dead zones 0.0015/0.001)
    │   ├── postureScore (ear-to-ear Y delta + chin-to-forehead distance)
    │   └── gestureOpenness (deprecated, kept for interface compat)
    │
    ├── voiceMetrics (from useLiveKitVoice)
    │   ├── speechRate (15s window × 4, capped at 200 wpm)
    │   ├── fillerWordCount (9 patterns: um, uh, like, you know, etc.)
    │   ├── energyLevel (RMS normalized to 0.05 scale)
    │   └── pauseCount (gaps > 1.5s)
    │
    ▼
computeConfidence() → 0-100 score
    │
    ├── Eye contact: 30% weight
    ├── Fidget (inverted): 20%
    ├── Posture: 15%
    ├── Fillers (inverted): 15%
    ├── Energy: 10%
    └── Pace (70-180 wpm = good): 10%
    │
    ▼
confidenceScore → MetricsPanel + Background3D glow color
metricsTimeline[] → appended for end-of-round analysis
```

### 5.3 Legal Conflict Check Pipeline

```
After each AI response (legal scenario only):
    │
    ▼
Full conversation transcript
    │
    ▼
Gemini 2.5 Flash: extractEntitiesFromConversation()
    │
    ├── responseMimeType: "application/json"
    ├── responseSchema: { entities[], caseType, jurisdiction }
    ├── Each entity: { name, role, context }
    ├── Roles: client, opposing_party, related_entity, witness, counsel
    ├── 10s timeout, salvages entity names from truncated JSON
    │
    ▼
checkConflicts(extractedEntities)
    │
    ├── For each entity, scan:
    │   ├── clients[] (name + aliases)
    │   ├── matters[].opposingParties[]
    │   ├── matters[].relatedEntities[]
    │   ├── contacts[]
    │   └── relationships[] (indirect: parent-subsidiary, spouse, etc.)
    │
    ├── fuzzyMatch() per pair:
    │   ├── Exact match → 1.0
    │   ├── Containment → 0.85
    │   ├── Levenshtein similarity
    │   └── Jaccard token overlap
    │   └── Threshold: 0.7
    │
    ├── scoreRisk() per match:
    │   ├── Direct client + high score → HIGH
    │   ├── Opposing party in open matter → HIGH
    │   ├── Related entity / contact → MEDIUM
    │   └── Indirect relationship → LOW
    │
    ▼
ConflictReport → VideoFeed alerts + ScoreCard report
```

---

## 6. Gemini Integration (7 Distinct Features)

| # | Feature | Model | API Pattern | Where |
|---|---------|-------|-------------|-------|
| 1 | Multi-turn role-play conversation | 2.5 Flash | `system_instruction` + `contents[]` | `getRolePlayResponse()` |
| 2 | Character conditioning | 2.5 Flash | `promptModifier` appended to system prompt | `characters.ts` presets |
| 3 | Metrics-aware adaptive AI | 2.5 Flash | Real-time confidence/body metrics in system prompt | `metricsContext` block |
| 4 | Structured JSON feedback | 2.5 Flash | `responseMimeType: "application/json"` + `responseSchema` | `getRoundFeedback()` |
| 5 | Real-time coaching annotations | 2.5 Flash | Parallel fire-and-forget call with structured output | `getCoachingAnnotation()` |
| 6 | Legal entity extraction | 2.5 Flash | Structured output extracting parties from conversation | `extractEntitiesFromConversation()` |
| 7 | Conflict analysis driving risk scoring | 2.5 Flash | Entities feed into local fuzzy matching + risk engine | `conflictEngine.ts` |

---

## 7. LiveKit Integration

| Feature | Implementation |
|---------|---------------|
| Echo cancellation | `Room` with `audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }` |
| Audio track | `createLocalAudioTrack()` published to room |
| Energy monitoring | `AudioContext` + `AnalyserNode` on LiveKit's `mediaStreamTrack`, RMS every `requestAnimationFrame` |
| Fallback | If LiveKit connection fails, falls back to direct `getUserMedia` with browser echo cancellation flags |
| Token generation | Server-side `/api/livekit-token` route using `livekit-server-sdk` |

---

## 8. Scenarios

| ID | Title | AI Character | Key Entities (Legal) |
|----|-------|-------------|---------------------|
| `salary` | Salary Negotiation | Alex Chen (hiring manager, 12yr experience) | — |
| `interview` | Job Interview | Jordan Park (VP Engineering, 500+ interviews) | — |
| `landlord` | Landlord Confrontation | Pat Moreno (landlord, 20yr, dismissive) | — |
| `harassment` | Report Harassment | Morgan Ellis (HR Business Partner, risk-averse) | — |
| `legal` | Legal Client Intake | Casey Morales (prospective client, nervous) | David Chen, Meridian Tech Solutions, Apex Industries, Chen Industries, NovaCorp Holdings, Sarah Mitchell, Greenfield Properties, Robert Johnson |

Each scenario has 3 difficulty presets (Hard/Normal/Easy) with distinct prompt modifiers that adjust personality, pushback level, and empathy.

---

## 9. Fault Tolerance

| ID | Failure Mode | Detection | Recovery |
|----|-------------|-----------|----------|
| FM-1 | MediaPipe Pose drops FPS < 5 | FPS counter every 30 frames | Auto-fallback to face-only mode |
| FM-2 | No face detected | Empty landmarks array | Warning bar, voice metrics continue |
| FM-3 | Gemini timeout (>8s) | `Promise.race` with timeout | Cached fallback responses per scenario |
| FM-4 | Gemini returns truncated text | Regex check for trailing ellipsis / no terminal punctuation | Trim to last complete sentence |
| FM-5 | Entity extraction JSON truncated | `JSON.parse` catch | Salvage entity names via regex from partial JSON |
| FM-6 | Web Speech API unsupported | `window.SpeechRecognition` check | Chrome-required block screen |
| FM-7 | Mic echo (AI words captured as user) | Bidirectional word matching: AI→User (30%) + User→AI (60%) | Discard echoed text, clear turn |
| FM-8 | Camera/mic denied | `getUserMedia` catch | Warning bar, conversation + voice metrics still work |
| FM-9 | TTS hangs | 30s master timeout on `speak()`, 10s per-sentence timeout | Force-resolve, conversation continues silently |
| FM-10 | Speech stops after "I'm Done" | `stoppedRef` flag prevents recognition restart + discards buffered results | Hard stop on recognition |

---

## 10. File Tree

```
src/
├── app/
│   ├── api/
│   │   └── livekit-token/
│   │       └── route.ts          # LiveKit JWT token generation
│   ├── globals.css               # Dark theme, animations, glass morphism
│   ├── layout.tsx                # Root layout + fonts
│   └── page.tsx                  # ORCHESTRATOR — all state + hooks + API calls
├── components/
│   ├── Background3D.tsx          # Three.js floating orbs + confidence glow
│   ├── CharacterSelect.tsx       # Difficulty presets + context input
│   ├── ConversationPanel.tsx     # Chat bubbles + typing indicator
│   ├── MetricsPanel.tsx          # Live metric bars + confidence score
│   ├── ScenarioSelector.tsx      # 5 scenario cards
│   ├── ScoreCard.tsx             # Round results + conflict report
│   ├── SessionView.tsx           # Three-panel grid layout
│   ├── VideoFeed.tsx             # Webcam + landmark overlay + alerts
│   └── WarningBar.tsx            # Error notifications
├── hooks/
│   ├── useBodyTracking.ts        # MediaPipe Face Mesh + metrics
│   └── useLiveKitVoice.ts        # LiveKit WebRTC + Web Speech API
├── lib/
│   ├── characters.ts             # Character presets (5 scenarios × 3 difficulties)
│   ├── elevenlabs.ts             # TTS engine (browser SpeechSynthesis)
│   ├── gemini.ts                 # All Gemini API calls (7 features)
│   ├── legal/
│   │   ├── conflictCheck.ts      # Conflict check orchestrator
│   │   ├── conflictEngine.ts     # Fuzzy matching + risk scoring engine
│   │   └── firmDatabase.ts       # Mock law firm database (20 clients, 15 matters)
│   ├── scenarios.ts              # 5 scenario definitions with system prompts
│   ├── scoring.ts                # Confidence formula + filler word detection
│   └── types.ts                  # All TypeScript interfaces
└── types/
    └── speech.d.ts               # Web Speech API type declarations
```

---

## 11. Environment Variables

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `NEXT_PUBLIC_GEMINI_API_KEY` | Client | Yes | Gemini 2.5 Flash API calls |
| `NEXT_PUBLIC_ELEVENLABS_API_KEY` | Client | No | ElevenLabs TTS (deprecated — free tier exhausted) |
| `LIVEKIT_URL` | Server | Yes | LiveKit cloud WebSocket URL |
| `LIVEKIT_API_KEY` | Server | Yes | LiveKit API key for token generation |
| `LIVEKIT_API_SECRET` | Server | Yes | LiveKit API secret for token signing |
| `NEXT_PUBLIC_LIVEKIT_URL` | Client | Yes | LiveKit cloud URL for client connection |

---

## 12. Challenge Compliance — Legal Conflict Check

**Sponsor Challenge: AI-Powered Legal Conflict Check System**

| Requirement | Implementation | Evidence |
|-------------|---------------|----------|
| **Req 1: Party Identification** — Input client, opposing party, related entities; normalize names; handle duplicates | Gemini `extractEntitiesFromConversation()` classifies entities by role (client/opposing/related/witness/counsel). `normalizeName()` strips suffixes (LLC, Inc, Corp, Jr, Sr). Deduplication by `matchedRecord + matchType`. | `gemini.ts:380-450`, `conflictEngine.ts:45-55`, `conflictEngine.ts:175-180` |
| **Req 2: Conflict Detection** — Check clients, matters, contacts; detect direct + indirect conflicts; include historical data | Engine scans all 3 database tables. Traces `relationships[]` for indirect conflicts (parent-subsidiary, officer-of, spouse). Database includes `status: "closed"` matters and `status: "former"` clients. | `conflictEngine.ts:95-170` |
| **Req 3: Intelligent Matching** — Fuzzy matching; NLP/embeddings; detect similar entities | Levenshtein distance + Jaccard token overlap + containment check (threshold 0.7). Gemini provides the NLP layer via entity extraction with semantic understanding. | `conflictEngine.ts:60-90` |
| **Req 4: Risk Scoring** — Assign Low/Medium/High based on match strength and relationships | `scoreRisk()` returns `RiskLevel` based on match type (direct client=HIGH, opposing party=HIGH, related/contact=MEDIUM, indirect=LOW) and fuzzy match strength. | `conflictEngine.ts:175-195` |

---

*Last updated: 2026-04-11 (Hack the Bay)*
