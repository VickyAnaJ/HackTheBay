# ReplAI

**Practice real conversations before they matter.**

ReplAI is a real-time, AI-powered conversation simulator that helps users improve communication skills through realistic roleplay scenarios. It analyzes voice and body language while providing structured feedback, enabling users to train for high-stakes situations like interviews, negotiations, and client interactions.

---

## Overview

ReplAI simulates real-world conversations by combining natural language processing, computer vision, and real-time audio analysis into a single interactive experience.

Users engage in conversations with an AI character while the system continuously evaluates their performance based on verbal and non-verbal cues. After each session, users receive detailed feedback and a confidence score to guide improvement.

---

## Features

- **AI Roleplay Simulation**  
  Engage in dynamic conversations with AI-driven characters across multiple scenarios.

- **Real-Time Voice Analysis**  
  Measures speech rate, filler words, pauses, and vocal energy.

- **Body Language Tracking**  
  Uses facial landmark detection to analyze eye contact, posture, and movement.

- **Performance Scoring**  
  Generates a real-time confidence score based on combined voice and body metrics.

- **Structured Feedback**  
  Provides actionable insights on communication style and effectiveness.

- **Legal Conflict Detection**  
  Extracts entities from conversations and identifies potential conflicts using fuzzy matching and relationship mapping.

- **Browser-Based Execution**  
  Runs entirely in the browser with minimal setup.

---

## Architecture

ReplAI is designed as a client-first application with a lightweight serverless component for secure token generation.

- **Frontend:** React with TypeScript  
- **State Management:** Centralized orchestrator handling session lifecycle and AI interactions  
- **Voice Processing:** WebRTC (LiveKit) + Web Speech API  
- **Computer Vision:** MediaPipe Face Mesh  
- **AI Integration:** Google Gemini API for conversation, feedback, and entity extraction  
- **Conflict Engine:** Custom fuzzy matching system (Levenshtein + Jaccard similarity)

The system processes voice, vision, and language inputs simultaneously to deliver real-time feedback.

---

## Tech Stack

- **Languages:** TypeScript, JavaScript  
- **Frameworks & Libraries:** React, Tailwind CSS, Three.js  
- **AI & APIs:** Google Gemini API  
- **Audio:** LiveKit (WebRTC), Web Speech API, SpeechSynthesis  
- **Vision:** MediaPipe Face Mesh  
- **Algorithms:** Fuzzy matching, real-time scoring  

---

## Challenges

- Synchronizing real-time audio, video, and AI responses  
- Handling speech recognition edge cases and echo filtering  
- Ensuring stable performance metrics during live interaction  
- Managing latency across multiple real-time systems  

---

## Future Work

- Improve tracking accuracy and scoring reliability  
- Add configurable AI personalities (character conditioning)  
- Introduce session memory and adaptive feedback  
- Expand legal conflict detection with larger datasets  
- Add backend support for persistence and analytics  

---

## Getting Started

```bash
git clone https://github.com/your-username/replai.git
cd replai
npm install
npm run dev
