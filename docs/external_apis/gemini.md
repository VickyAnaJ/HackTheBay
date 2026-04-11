# Gemini API — External Dependency

**Spec references:** L2.2 (Neighbor), L2.5 (Agent Boundaries), L2.7 (Contract), L2.8 (FM-4, FM-5)

## API Details
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **Auth:** API key as query param
- **Model:** gemini-2.5-flash
- **Rate limit:** 15 RPM (free tier)

## Two Call Patterns

### 1. Role-Play Response
- **Input:** system_instruction + conversation history + metrics context
- **Output:** Plain text (2-3 sentences, in character)
- **Timeout:** 3 seconds → cached fallback
- **Fallback:** Pre-cached responses per scenario (3 per scenario)

### 2. Structured Feedback
- **Input:** Full transcript + metrics timeline summary
- **Output:** JSON via `responseMimeType: 'application/json'` with `responseSchema`
- **Timeout:** 8 seconds
- **Fallback:** Client-side generated feedback from raw metrics
