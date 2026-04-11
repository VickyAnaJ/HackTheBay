# MediaPipe Tasks Vision — External Dependency

**Spec references:** L3 (Load-Bearing), L2.5 (useBodyTracking), L2.8 (FM-1, FM-2)

## Package
- **npm:** @mediapipe/tasks-vision
- **CDN (WASM):** https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm

## Models Used
1. **Face Landmarker** — 468 landmarks per face, includes iris tracking
   - Model: face_landmarker/float16/1/face_landmarker.task
   - Delegate: GPU
   - Used for: eye contact detection

2. **Pose Landmarker (lite)** — 33 body landmarks
   - Model: pose_landmarker_lite/float16/1/pose_landmarker_lite.task
   - Delegate: GPU
   - Used for: shoulder alignment, wrist fidgeting, posture, gesture openness

## Fallback Chain
1. Face Mesh + Pose → full metrics
2. Face Mesh only → eye contact only (if Pose init fails or FPS < 10)
3. No tracking → camera preview only, metrics show N/A
