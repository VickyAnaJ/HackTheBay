import type { CombinedMetrics, RoundFeedback } from "./types";
import type { ExtractedEntities } from "./legal/conflictEngine";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const ROLE_PLAY_TIMEOUT_MS = 8000; // 8s — 3s was too aggressive, caused wrong cached responses
// FEEDBACK_TIMEOUT_MS not needed — feedback call is not time-critical (happens after round ends)

// FM-4/FM-5: Pre-cached fallback responses per scenario + exchange number
const CACHED_RESPONSES: Record<string, string[]> = {
  salary: [
    "That's an interesting number. Can you walk me through how you arrived at that figure?",
    "I understand your perspective, but we need to be realistic about what the budget allows. What else matters to you beyond base salary?",
    "Look, I appreciate your preparation. Let me see what I can do, but I can't promise anything above what we discussed.",
  ],
  interview: [
    "Interesting. Can you give me a specific example of when you demonstrated that?",
    "I see that on your resume, but what I'm really looking for is how you handled the challenge, not just the outcome.",
    "Let's move on. Tell me about a time you failed at something and what you learned from it.",
  ],
  landlord: [
    "I hear you, but you signed the lease knowing the terms. The market is what it is.",
    "Look, I have bills to pay too. If you can't afford it, maybe it's time to look at other options.",
    "I'm not trying to be difficult here, but I need to cover my costs. That's just business.",
  ],
  harassment: [
    "I appreciate you coming forward. Can you tell me more about the specific incidents?",
    "I understand that was uncomfortable. Have you considered that maybe it was a misunderstanding?",
    "We take these things seriously, but we also need to hear both sides. Let me talk to them first.",
  ],
  legal: [
    "Thanks for asking. So here's the situation — my business partner and I are in a dispute over our company, Meridian Tech Solutions.",
    "His name is David Chen. He's been making decisions without consulting me, and now he's set up his own company — Chen Industries — on the side.",
    "There's also a contract we signed with Apex Industries last year that's become part of the issue. I think they might be working with David behind my back.",
  ],
};

interface ConversationMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

/**
 * Get a role-play response from Gemini.
 * The AI stays in character based on the scenario system prompt.
 * Receives the user's transcript + current metrics to adapt pressure.
 */
export async function getRolePlayResponse(
  systemPrompt: string,
  conversationHistory: ConversationMessage[],
  currentMetrics?: CombinedMetrics | null,
  scenarioId?: string
): Promise<string> {
  // Build metrics context so AI can adapt to user's nervousness
  let metricsContext = "";
  if (currentMetrics) {
    const { body, voice, confidenceScore } = currentMetrics;
    metricsContext = `\n\n[The user's current state — use this to calibrate pressure:
Confidence: ${confidenceScore.toFixed(0)}/100
Eye contact: ${body.eyeContactPercent.toFixed(0)}%
Fidgeting: ${body.fidgetRate.toFixed(1)}/min
Filler words: ${voice.fillerWordCount}
Speech pace: ${voice.speechRate.toFixed(0)} wpm
If confidence is low or fidgeting is high, push a little harder.
CRITICAL: ALWAYS finish your sentences completely. NEVER stop mid-thought or mid-sentence.]`;
  }

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt + metricsContext }],
    },
    contents: conversationHistory,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 2048, // High because Gemini 2.5 Flash thinking tokens eat into this limit
    },
  };

  try {
    // FM-4: Race Gemini against timeout
    const fetchPromise = fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");
      return text.trim();
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini timeout")), ROLE_PLAY_TIMEOUT_MS)
    );

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Gemini role-play error, using cached fallback:", error);
    return getCachedResponse(conversationHistory, scenarioId);
  }
}

/**
 * Get a cached fallback response based on scenario and exchange count.
 */
function getCachedResponse(history: ConversationMessage[], scenarioId?: string): string {
  const modelCount = history.filter((m) => m.role === "model").length;
  const id = scenarioId || "salary";
  const responses = CACHED_RESPONSES[id] ?? CACHED_RESPONSES.salary;
  const idx = Math.min(modelCount, responses.length - 1);
  return responses[idx];
}

/**
 * Get structured round feedback from Gemini.
 * Uses responseMimeType: 'application/json' with a schema for the Gemini prize pattern.
 */
export async function getRoundFeedback(
  systemPrompt: string,
  fullTranscript: string,
  metricsTimeline: CombinedMetrics[]
): Promise<RoundFeedback> {
  // Compute summary stats from the timeline
  const avgConfidence =
    metricsTimeline.length > 0
      ? metricsTimeline.reduce((sum, m) => sum + m.confidenceScore, 0) /
        metricsTimeline.length
      : 50;

  const avgEyeContact =
    metricsTimeline.length > 0
      ? metricsTimeline.reduce((sum, m) => sum + m.body.eyeContactPercent, 0) /
        metricsTimeline.length
      : 50;

  const avgFidget =
    metricsTimeline.length > 0
      ? metricsTimeline.reduce((sum, m) => sum + m.body.fidgetRate, 0) /
        metricsTimeline.length
      : 0;

  const totalFillers = metricsTimeline.reduce(
    (sum, m) => sum + m.voice.fillerWordCount,
    0
  );

  const avgSpeechRate =
    metricsTimeline.length > 0
      ? metricsTimeline.reduce((sum, m) => sum + m.voice.speechRate, 0) /
        metricsTimeline.length
      : 140;

  const feedbackPrompt = `You are analyzing a practice conversation session. The user was practicing: ${systemPrompt.split("\n")[0]}

Here is the full transcript of the conversation:
${fullTranscript}

Here are the measured metrics (REAL data — do NOT make up numbers):
- Average confidence score: ${avgConfidence.toFixed(1)}/100
- Average eye contact: ${avgEyeContact.toFixed(1)}%
- Average fidget rate: ${avgFidget.toFixed(1)} movements/min
- Total filler words used: ${totalFillers}
- Average speech rate: ${avgSpeechRate.toFixed(0)} WPM
- Number of data points: ${metricsTimeline.length}

Based on this REAL data, provide specific, actionable feedback. Reference specific moments from the transcript when possible. The overall_score should be close to the average confidence score of ${avgConfidence.toFixed(0)}.`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: feedbackPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          overall_score: {
            type: "NUMBER",
            description: "Overall confidence score 0-100 based on measured metrics",
          },
          strongest_moment: {
            type: "STRING",
            description:
              "The user's best moment — reference a specific thing they said or did",
          },
          weakest_moment: {
            type: "STRING",
            description:
              "The user's weakest moment — reference a specific thing they said or did",
          },
          body_feedback: {
            type: "ARRAY",
            items: { type: "STRING" },
            description:
              "2-3 specific feedback items about body language based on measured metrics",
          },
          voice_feedback: {
            type: "ARRAY",
            items: { type: "STRING" },
            description:
              "2-3 specific feedback items about voice based on measured metrics",
          },
          content_feedback: {
            type: "ARRAY",
            items: { type: "STRING" },
            description:
              "2-3 specific feedback items about what they said and how they argued",
          },
          tip_for_next_round: {
            type: "STRING",
            description:
              "One concrete, actionable tip for the next practice round",
          },
          strategy_analysis: {
            type: "STRING",
            description:
              "What communication/negotiation strategy the user employed (e.g., anchoring, emotional appeal, data-driven, deflection, mirroring). Be specific about tactics observed.",
          },
          emotional_progression: {
            type: "STRING",
            description:
              "How the user's emotional state and confidence evolved during the conversation — reference specific moments where they gained or lost composure.",
          },
          improvement_areas: {
            type: "ARRAY",
            items: { type: "STRING" },
            description:
              "2-3 specific skills to practice (e.g., 'Use silence as a tool', 'Anchor with market data before stating your number')",
          },
        },
        required: [
          "overall_score",
          "strongest_moment",
          "weakest_moment",
          "body_feedback",
          "voice_feedback",
          "content_feedback",
          "tip_for_next_round",
          "strategy_analysis",
          "emotional_progression",
          "improvement_areas",
        ],
      },
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Gemini feedback API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty feedback response");
    }

    return JSON.parse(text) as RoundFeedback;
  } catch (error) {
    console.error("Gemini feedback error:", error);
    // Fallback: generate basic feedback from raw metrics
    return {
      overall_score: Math.round(avgConfidence),
      strongest_moment: "Your opening statement showed preparation and clarity.",
      weakest_moment:
        "There were moments where your confidence visibly dropped during pushback.",
      body_feedback: [
        `Eye contact averaged ${avgEyeContact.toFixed(0)}% — ${avgEyeContact > 60 ? "solid, keep it up" : "try maintaining gaze when challenged"}.`,
        `Fidget rate was ${avgFidget.toFixed(1)}/min — ${avgFidget < 3 ? "well controlled" : "try anchoring your hands on the table"}.`,
      ],
      voice_feedback: [
        `${totalFillers} filler words detected — ${totalFillers < 3 ? "minimal, good discipline" : "try pausing instead of filling silence"}.`,
        `Speech rate averaged ${avgSpeechRate.toFixed(0)} WPM — ${avgSpeechRate > 120 && avgSpeechRate < 160 ? "well paced" : "try slowing down to signal confidence"}.`,
      ],
      content_feedback: [
        "Focus on specific examples and data to strengthen your arguments.",
      ],
      tip_for_next_round:
        "Before responding to a tough question, take a 2-second pause. It signals confidence and gives you time to think.",
      strategy_analysis:
        "Mixed approach — some data-driven arguments combined with emotional appeals. Consider leading with evidence before making value statements.",
      emotional_progression:
        "Started confident, showed some uncertainty during pushback, but recovered composure toward the end.",
      improvement_areas: [
        "Lead with specific data points before making value claims",
        "Use strategic pauses to signal confidence under pressure",
      ],
    };
  }
}

/**
 * Real-time coaching annotation via Gemini.
 * Fires in parallel with role-play response to analyze user's communication strategy.
 * Uses structured output — a key Gemini feature for the prize.
 */
export async function getCoachingAnnotation(
  scenarioType: string,
  userText: string,
  metrics: CombinedMetrics | null
): Promise<{ text: string; type: "good" | "warning" | "bad" } | null> {
  const metricsLine = metrics
    ? `Confidence: ${metrics.confidenceScore.toFixed(0)}/100, eye contact: ${metrics.body.eyeContactPercent.toFixed(0)}%, fidget: ${metrics.body.fidgetRate.toFixed(1)}/min`
    : "";

  const prompt = `You are a real-time communication coach observing a ${scenarioType} practice session.

The user just said: "${userText}"
${metricsLine}

Give ONE brief coaching observation (max 8 words). Focus on negotiation tactics, assertiveness, body language, or persuasion effectiveness.
Examples of good observations: "Strong anchor with specific numbers", "Data-driven argument — very effective", "Good composure under pressure"
Examples of warnings: "Too vague — cite specific evidence", "Backing down too quickly", "Speaking too fast — slow down"
Examples of bad: "Avoided the question entirely", "Lost composure — getting defensive", "No counter-argument presented"`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 60,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING", description: "Brief coaching tip, max 8 words" },
          type: { type: "STRING", description: "Rating: good, warning, or bad" },
        },
        required: ["text", "type"],
      },
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text);
    // Validate type
    const validTypes = ["good", "warning", "bad"];
    if (!validTypes.includes(parsed.type)) parsed.type = "warning";
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Extract legal entities from conversation text via Gemini.
 * Uses structured output to identify parties, companies, and relationships.
 */
export async function extractEntitiesFromConversation(
  conversationText: string,
  firmContext?: string
): Promise<ExtractedEntities> {
  const prompt = `You are a legal conflict-check AI. Extract ALL named entities from this attorney-client intake conversation.
${firmContext ? `The firm specializes in: ${firmContext}` : ""}

Conversation:
${conversationText}

Extract every person name, company name, organization, and entity mentioned. Classify each by their role in the potential legal matter. Be thorough — even minor mentions matter for conflict checking.`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          entities: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING", description: "Full name of the person or entity" },
                role: { type: "STRING", description: "One of: client, opposing_party, related_entity, witness, counsel" },
                context: { type: "STRING", description: "Brief context about why this entity was mentioned" },
              },
              required: ["name", "role"],
            },
          },
          caseType: { type: "STRING", description: "Type of legal matter (litigation, corporate, family, real-estate, IP, regulatory)" },
          jurisdiction: { type: "STRING", description: "Jurisdiction if mentioned" },
        },
        required: ["entities"],
      },
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Gemini entity extraction: ${response.status}`);
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty entity extraction response");

    // Handle potentially truncated JSON from Gemini
    try {
      return JSON.parse(text) as ExtractedEntities;
    } catch {
      // Try to salvage truncated JSON — extract any entity names we can find
      const nameMatches = text.match(/"name"\s*:\s*"([^"]+)"/g);
      if (nameMatches) {
        const entities = nameMatches.map((m: string) => {
          const name = m.match(/"name"\s*:\s*"([^"]+)"/)?.[1] || "";
          return { name, role: "related_entity" as const };
        }).filter((e: { name: string }) => e.name.length > 0);
        console.log("Salvaged entities from truncated JSON:", entities.length);
        return { entities };
      }
      return { entities: [] };
    }
  } catch (err) {
    console.warn("Entity extraction failed:", err);
    return { entities: [] };
  }
}

/**
 * Convert conversation messages to the Gemini API format.
 */
export function toGeminiHistory(
  messages: { role: "user" | "ai"; text: string }[]
): ConversationMessage[] {
  return messages.map((m) => ({
    role: m.role === "ai" ? "model" : "user",
    parts: [{ text: m.text }],
  }));
}
