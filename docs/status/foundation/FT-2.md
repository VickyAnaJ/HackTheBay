# Foundation Task: FT-2

## Metadata
| Field | Value |
|-------|-------|
| Purpose | Gemini timeout handling + pre-cached fallback responses |
| Serves Slices | S2 (conversation), S5 (feedback) |
| Contract / Interface | getRolePlayResponse() returns string within 3s guaranteed. getCachedResponse() as fallback. |
| Owner | Claude |
| Status | Done |

## Scope
| Owns | Must Not Do |
|------|-------------|
| ROLE_PLAY_TIMEOUT_MS = 3000 | Must not allow Gemini to block indefinitely |
| CACHED_RESPONSES (3 per scenario × 4 scenarios = 12 total) | Must not use cached responses on the normal path |
| getCachedResponse() scenario + exchange detection | Must not serve random responses — must match scenario context |

## Implementation
| Item | Check | Result | Evidence |
|------|-------|--------|----------|
| Timeout race | Promise.race([fetch, timeout]) | Pass | gemini.ts getRolePlayResponse() |
| Cached responses | 12 responses (3 × 4 scenarios) | Pass | CACHED_RESPONSES object in gemini.ts |
| Scenario detection | First model message content analysis | Pass | getCachedResponse() detects salary/interview/landlord/harassment from keywords |
| Exchange indexing | modelCount → response index | Pass | Math.min(modelCount, responses.length - 1) |
| Normal path always calls Gemini | Production purity | Pass | Cached only fires in catch block after race failure |

## Verification
| Item | Check | Result | Evidence |
|------|-------|--------|----------|
| 3s timeout enforced | Pass | ROLE_PLAY_TIMEOUT_MS = 3000 in Promise constructor |
| All 4 scenarios have cached responses | Pass | salary: 3, interview: 3, landlord: 3, harassment: 3 |
| Cached responses are in-character | Pass | Each matches the scenario's tone and role |
| Normal path doesn't use cache | Pass | Cache only in catch block |

## Closure
| Item | Check | Result | Evidence |
|------|-------|--------|----------|
| FM-4 + FM-5 fully covered | Pass | Timeout + error → cached response |
| Status | Done | |
