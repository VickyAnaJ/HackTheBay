# REPLAI

Practice difficult conversations with AI. Get real-time feedback on your body language and voice.

**Built for Hack the Bay 2026 — USF Tampa**

---

## What It Does

REPLAI puts you in high-stakes conversations — salary negotiations, job interviews, landlord disputes, HR complaints, legal client intakes. An AI opponent role-plays the other person while your webcam tracks eye contact, fidgeting, and posture, and your mic analyzes speech rate, filler words, and energy. After each round, you get a structured scorecard with specific feedback.

The **Legal Client Intake** scenario also runs real-time conflict-of-interest detection — extracting entity names from the conversation and fuzzy-matching them against a mock firm database.

---

## Setup

```bash
git clone https://github.com/VickyAnaJ/HackTheBay.git
cd HackTheBay
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
```

Run:

```bash
npm run dev
```

Open **Chrome** at `http://localhost:3000`. Grant camera + mic access.

---

## Tech Stack

- **Next.js 16** + React 19 + TypeScript + Tailwind CSS 4
- **Google Gemini 2.5 Flash** — conversation AI, coaching, entity extraction, structured feedback
- **LiveKit WebRTC** — mic input with echo cancellation
- **MediaPipe Face Mesh** — real-time body language tracking
- **Three.js** — 3D interactive background
- **Custom conflict engine** — Levenshtein + Jaccard fuzzy matching with risk scoring

---

## Team

- **VickyAnaJ** — Gemini integration, legal conflict system
- **HarenG8374** — Body tracking, UI components, styling
- **keillycespedes** — LiveKit voice pipeline, session layout, 3D background
- **4shivv** — Core types, TTS engine, page orchestrator, docs
