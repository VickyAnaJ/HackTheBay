# ElevenLabs API — External Dependency

**Spec references:** L3 (Technology Classification), L2.8 (fallback to SpeechSynthesis)

## API Details
- **Endpoint:** `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- **Auth:** `xi-api-key` header
- **Model:** eleven_multilingual_v2
- **Voice:** Adam (pNInz6obpgDQGcFmaJgB)
- **Free tier:** 10,000 characters/month

## Settings
- stability: 0.6
- similarity_boost: 0.75

## Fallback
- Timeout: 3 seconds → browser SpeechSynthesis API
- API error → browser SpeechSynthesis API
- No API key → browser SpeechSynthesis API immediately
