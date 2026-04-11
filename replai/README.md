# ReplAI

**Practice real conversations before they matter.**

---

## Overview

ReplAI is a real-time, AI-powered conversation simulator designed to help users improve communication skills in high-stakes scenarios such as job interviews, salary negotiations, and client interactions.

Unlike traditional chatbots, ReplAI provides a fully interactive experience by combining **natural language processing, computer vision, and real-time audio analysis**. Users engage in live conversations with an AI character while the system continuously evaluates both **what they say** and **how they say it**.

The platform analyzes:
- Verbal communication (speech rate, filler words, pauses)
- Non-verbal cues (eye contact, posture, movement)
- Contextual understanding of the conversation

At the end of each session, users receive structured feedback and a confidence score, allowing them to iteratively improve their performance.

---

## Architecture

ReplAI follows a **client-first, real-time architecture**, where the majority of processing occurs directly in the browser to minimize latency and eliminate setup complexity.

### Core Design Principles
- Real-time feedback loop
- Multi-modal data processing (voice, vision, text)
- Minimal backend dependency
- Single orchestrator for state and control flow

### System Flow

1. **User Input**
   - Microphone captures speech (WebRTC)
   - Webcam captures facial data (MediaPipe)

2. **Processing Layer**
   - Speech is transcribed via Web Speech API
   - Body metrics are computed from facial landmarks
   - Voice metrics are calculated in real time

3. **AI Interaction**
   - Conversation context is sent to Google Gemini API
   - AI generates roleplay responses and feedback

4. **Output Layer**
   - AI responds via text + speech synthesis
   - Metrics are updated continuously
   - Confidence score is computed dynamically

5. **Post-Processing**
   - Structured feedback is generated
   - (Optional) Legal entity extraction + conflict detection pipeline runs

### Backend Usage

ReplAI uses a **lightweight serverless function** for secure token generation (LiveKit).  
All other logic, including AI interaction and scoring, runs on the client.

---

## Tech Stack

### Languages
- TypeScript  
- JavaScript  

### Frontend
- React  
- Tailwind CSS  
- Three.js (for interactive UI elements)

### AI & APIs
- Google Gemini API (conversation, feedback, entity extraction)

### Voice & Audio
- WebRTC (via LiveKit)  
- Web Speech API (speech-to-text)  
- SpeechSynthesis API (text-to-speech)  

### Computer Vision
- MediaPipe Face Mesh (facial tracking, posture, eye contact)

### Core Systems
- Real-time scoring engine (confidence metrics)  
- Fuzzy matching (Levenshtein distance, Jaccard similarity)  
- Legal conflict detection pipeline  

### Platform
- Fully browser-based application  
- Serverless function for token generation  

---
