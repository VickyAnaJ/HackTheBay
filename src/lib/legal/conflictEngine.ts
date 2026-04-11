// ---- Conflict Detection Engine ----
// Pure logic: fuzzy matching, conflict detection, risk scoring
// No Gemini calls — those happen in gemini.ts

import { FIRM_DATABASE, type FirmDatabase } from "./firmDatabase";

// ---- Types ----

export interface ExtractedEntity {
  name: string;
  role: "client" | "opposing_party" | "related_entity" | "witness" | "counsel";
  context?: string;
}

export interface ExtractedEntities {
  entities: ExtractedEntity[];
  caseType?: string;
  jurisdiction?: string;
}

export interface ConflictMatch {
  extractedEntity: string;
  matchedRecord: string;
  matchType: "direct_client" | "opposing_party" | "related_entity" | "contact" | "indirect_relationship";
  matchStrength: number;
  matterReference?: string;
  details: string;
}

export type RiskLevel = "low" | "medium" | "high";

export interface ConflictResult {
  match: ConflictMatch;
  risk: RiskLevel;
  explanation: string;
}

export interface ConflictReport {
  results: ConflictResult[];
  overallRisk: RiskLevel;
  summary: string;
  entitiesChecked: number;
  extractedEntities: ExtractedEntity[];
  timestamp: number;
}

// ---- Name Normalization ----

const SUFFIXES = /\b(llc|inc|corp|ltd|co|jr|sr|ii|iii|iv|esq|ph\.?d|m\.?d)\b\.?/gi;

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(SUFFIXES, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---- Fuzzy Matching ----

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function jaccard(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function fuzzyMatch(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);

  if (na === nb) return 1.0;

  // Containment check
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  // Levenshtein similarity
  const maxLen = Math.max(na.length, nb.length);
  const levScore = maxLen === 0 ? 0 : 1 - levenshtein(na, nb) / maxLen;

  // Jaccard token overlap
  const jaccardScore = jaccard(na, nb);

  // Best of both
  return Math.max(levScore, jaccardScore);
}

// ---- Conflict Detection ----

const MATCH_THRESHOLD = 0.7;

function findMatches(entityName: string, db: FirmDatabase): ConflictMatch[] {
  const matches: ConflictMatch[] = [];

  // Check against clients (including aliases)
  for (const client of db.clients) {
    const names = [client.name, ...client.aliases];
    for (const name of names) {
      const score = fuzzyMatch(entityName, name);
      if (score >= MATCH_THRESHOLD) {
        matches.push({
          extractedEntity: entityName,
          matchedRecord: client.name,
          matchType: "direct_client",
          matchStrength: score,
          details: `Matched existing ${client.status} client "${client.name}" (${client.type})`,
        });
        break; // One match per client
      }
    }
  }

  // Check against opposing parties in matters
  for (const matter of db.matters) {
    for (const opp of matter.opposingParties) {
      const score = fuzzyMatch(entityName, opp);
      if (score >= MATCH_THRESHOLD) {
        const client = db.clients.find(c => c.id === matter.clientId);
        matches.push({
          extractedEntity: entityName,
          matchedRecord: opp,
          matchType: "opposing_party",
          matchStrength: score,
          matterReference: matter.title,
          details: `"${opp}" is an opposing party in "${matter.title}" (client: ${client?.name || "unknown"})`,
        });
      }
    }

    // Check related entities
    for (const rel of matter.relatedEntities) {
      const score = fuzzyMatch(entityName, rel);
      if (score >= MATCH_THRESHOLD) {
        matches.push({
          extractedEntity: entityName,
          matchedRecord: rel,
          matchType: "related_entity",
          matchStrength: score,
          matterReference: matter.title,
          details: `"${rel}" is a related entity in "${matter.title}"`,
        });
      }
    }
  }

  // Check contacts
  for (const contact of db.contacts) {
    const score = fuzzyMatch(entityName, contact.name);
    if (score >= MATCH_THRESHOLD) {
      matches.push({
        extractedEntity: entityName,
        matchedRecord: contact.name,
        matchType: "contact",
        matchStrength: score,
        details: `"${contact.name}" is a known ${contact.relationship} in firm records`,
      });
    }
  }

  // Check relationships for indirect conflicts
  for (const rel of db.relationships) {
    const scoreA = fuzzyMatch(entityName, rel.entityA);
    const scoreB = fuzzyMatch(entityName, rel.entityB);
    if (scoreA >= MATCH_THRESHOLD) {
      matches.push({
        extractedEntity: entityName,
        matchedRecord: rel.entityA,
        matchType: "indirect_relationship",
        matchStrength: scoreA * 0.9, // Slightly lower for indirect
        details: `"${rel.entityA}" has a ${rel.type} relationship with "${rel.entityB}"`,
      });
    }
    if (scoreB >= MATCH_THRESHOLD) {
      matches.push({
        extractedEntity: entityName,
        matchedRecord: rel.entityB,
        matchType: "indirect_relationship",
        matchStrength: scoreB * 0.9,
        details: `"${rel.entityB}" has a ${rel.type} relationship with "${rel.entityA}"`,
      });
    }
  }

  // Deduplicate by matchedRecord
  const seen = new Set<string>();
  return matches.filter(m => {
    const key = `${m.matchedRecord}-${m.matchType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---- Risk Scoring ----

function scoreRisk(match: ConflictMatch): RiskLevel {
  // Direct client conflicts are always high
  if (match.matchType === "direct_client" && match.matchStrength >= 0.85) return "high";

  // Opposing party in open matter = high
  if (match.matchType === "opposing_party" && match.matchStrength >= 0.8) return "high";

  // Strong match on any type = at least medium
  if (match.matchStrength >= 0.85) return "medium";

  // Related entities and contacts
  if (match.matchType === "related_entity" || match.matchType === "contact") return "medium";

  // Indirect relationships
  if (match.matchType === "indirect_relationship") return "low";

  // Weak matches
  return match.matchStrength >= 0.8 ? "medium" : "low";
}

// ---- Main Entry Point ----

export function checkConflicts(entities: ExtractedEntities): ConflictReport {
  const allResults: ConflictResult[] = [];

  for (const entity of entities.entities) {
    const matches = findMatches(entity.name, FIRM_DATABASE);
    for (const match of matches) {
      const risk = scoreRisk(match);
      allResults.push({
        match,
        risk,
        explanation: `${risk.toUpperCase()} RISK: ${match.details}`,
      });
    }
  }

  // Deduplicate across entities (same matched record)
  const seen = new Set<string>();
  const deduped = allResults.filter(r => {
    const key = `${r.match.matchedRecord}-${r.match.matchType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Overall risk = highest individual risk
  const overallRisk: RiskLevel = deduped.some(r => r.risk === "high")
    ? "high"
    : deduped.some(r => r.risk === "medium")
      ? "medium"
      : deduped.length > 0 ? "low" : "low";

  const summary = deduped.length === 0
    ? "No conflicts detected. Clear to proceed with intake."
    : `${deduped.length} potential conflict(s) found. Overall risk: ${overallRisk.toUpperCase()}. Review required before engagement.`;

  return {
    results: deduped,
    overallRisk,
    summary,
    entitiesChecked: entities.entities.length,
    extractedEntities: entities.entities,
    timestamp: Date.now(),
  };
}
