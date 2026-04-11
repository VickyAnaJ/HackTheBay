// ---- Conflict Check Orchestrator ----
// Calls Gemini for entity extraction, then runs local conflict engine

import type { Message } from "@/lib/types";
import { extractEntitiesFromConversation } from "@/lib/gemini";
import { checkConflicts, type ConflictReport } from "./conflictEngine";

/**
 * Run a full conflict check on the conversation so far.
 * 1. Extract entities via Gemini (structured output)
 * 2. Run fuzzy matching + conflict detection locally
 * 3. Return a full ConflictReport
 */
export async function runConflictCheck(
  conversationHistory: Message[],
  firmContext?: string
): Promise<ConflictReport | null> {
  try {
    // Build transcript
    const transcript = conversationHistory
      .map(m => `${m.role === "ai" ? "Client" : "Attorney"}: ${m.text}`)
      .join("\n");

    // Extract entities via Gemini
    const entities = await extractEntitiesFromConversation(transcript, firmContext);
    if (!entities || entities.entities.length === 0) return null;

    // Run local conflict detection
    return checkConflicts(entities);
  } catch (err) {
    console.warn("Conflict check failed:", err);
    return null;
  }
}
