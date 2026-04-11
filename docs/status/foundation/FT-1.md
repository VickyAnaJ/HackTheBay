# Foundation Task: FT-1

## Metadata
| Field | Value |
|-------|-------|
| Purpose | Fallback chain ensuring demo never fails (FM-1 through FM-8) |
| Serves Slices | All (S1-S5) |
| Contract / Interface | Each hook exposes error state. Page renders WarningBar. Chrome detection blocks round start. |
| Owner | Claude |
| Status | Done |

## Scope
| Owns | Must Not Do |
|------|-------------|
| Error state exposure from hooks (cameraError, speechError, isFaceOnly) | Must not suppress errors silently |
| WarningBar component for inline UI warnings | Must not show modal dialogs that block interaction |
| Chrome-required block screen | Must not allow round start without Speech API |
| FPS monitoring + auto-fallback to face-only | Must not silently drop metrics without notifying user |

## Implementation
| Item | Check | Result | Evidence |
|------|-------|--------|----------|
| FM-1 (MediaPipe CDN down) | Face-only fallback on init | Pass | useBodyTracking try/catch chain |
| FM-2 (FPS drop <10) | Auto-drop Pose, keep Face Mesh | Pass | frameCountRef every 30 frames, poseLandmarkerRef.close() |
| FM-3 (Webcam denied) | cameraError state → WarningBar | Pass | setCameraError() in catch, rendered in page.tsx |
| FM-4 (Gemini timeout >3s) | Promise.race → cached response | Pass | ROLE_PLAY_TIMEOUT_MS = 3000 in gemini.ts |
| FM-5 (Gemini API error) | Same cached fallback | Pass | catch block uses getCachedResponse() |
| FM-6 (No Speech API) | speechError → Chrome block screen | Pass | Full-screen block in page.tsx when speechError is set |
| FM-7 (Noisy room) | Filler count best-effort | Pass | No mitigation needed — energy metrics still work |
| FM-8 (Feedback JSON parse fail) | Client-side fallback from raw metrics | Pass | catch block in getRoundFeedback() |
| WarningBar component | Inline yellow warning bar | Pass | src/components/WarningBar.tsx |

## Verification
| Item | Check | Result | Evidence |
|------|-------|--------|----------|
| All 8 failure modes have documented fallback | Pass | Each FM-X maps to specific code path with fallback behavior |
| No failure mode silently fails | Pass | All expose error state or degrade visibly |
| WarningBar renders for hook errors | Pass | page.tsx maps body.cameraError + speech.speechError → WarningBar |

## Closure
| Item | Check | Result | Evidence |
|------|-------|--------|----------|
| All FM-1 through FM-8 covered | Pass | 8/8 failure modes implemented |
| Status | Done | |
