// ---- Mock Law Firm Database ----
// Represents "Sterling & Associates" — a mid-size firm with ~50 entities
// Designed to create realistic conflict scenarios across entity types

export interface FirmClient {
  id: string;
  name: string;
  aliases: string[];
  type: "individual" | "corporation" | "government";
  status: "active" | "former" | "prospective";
}

export interface FirmMatter {
  id: string;
  clientId: string;
  title: string;
  type: "litigation" | "corporate" | "regulatory" | "family" | "real-estate" | "IP";
  status: "open" | "closed" | "settled";
  opposingParties: string[];
  relatedEntities: string[];
}

export interface FirmContact {
  id: string;
  name: string;
  relationship: "attorney" | "witness" | "expert" | "opposing-counsel" | "judge" | "mediator";
  associatedClientIds: string[];
  associatedMatterIds: string[];
}

export interface FirmRelationship {
  entityA: string;
  entityB: string;
  type: "parent-subsidiary" | "officer-of" | "spouse" | "business-partner" | "former-employer" | "affiliate";
  bidirectional: boolean;
}

export interface FirmDatabase {
  clients: FirmClient[];
  matters: FirmMatter[];
  contacts: FirmContact[];
  relationships: FirmRelationship[];
}

export const FIRM_DATABASE: FirmDatabase = {
  clients: [
    { id: "c1", name: "Meridian Tech Solutions", aliases: ["Meridian", "MTS", "Meridian Tech"], type: "corporation", status: "active" },
    { id: "c2", name: "David Chen", aliases: ["D. Chen", "Dave Chen"], type: "individual", status: "active" },
    { id: "c3", name: "Apex Industries Inc", aliases: ["Apex", "Apex Industries", "Apex Inc"], type: "corporation", status: "active" },
    { id: "c4", name: "Sarah Mitchell", aliases: ["S. Mitchell"], type: "individual", status: "active" },
    { id: "c5", name: "Greenfield Properties LLC", aliases: ["Greenfield", "Greenfield Properties"], type: "corporation", status: "former" },
    { id: "c6", name: "Marcus Rivera", aliases: ["M. Rivera"], type: "individual", status: "active" },
    { id: "c7", name: "TechVault Corporation", aliases: ["TechVault", "Tech Vault"], type: "corporation", status: "active" },
    { id: "c8", name: "Linda Park", aliases: ["L. Park"], type: "individual", status: "former" },
    { id: "c9", name: "Vanguard Capital Partners", aliases: ["Vanguard Capital", "Vanguard", "VCP"], type: "corporation", status: "active" },
    { id: "c10", name: "James Whitfield", aliases: ["J. Whitfield", "Jim Whitfield"], type: "individual", status: "active" },
    { id: "c11", name: "NovaCorp Holdings", aliases: ["NovaCorp", "Nova Corp", "Nova Holdings"], type: "corporation", status: "active" },
    { id: "c12", name: "Elena Rodriguez", aliases: ["E. Rodriguez"], type: "individual", status: "former" },
    { id: "c13", name: "Pacific Rim Trading Co", aliases: ["Pacific Rim", "PRTC", "Pacific Rim Trading"], type: "corporation", status: "active" },
    { id: "c14", name: "Robert Johnson", aliases: ["R. Johnson", "Bob Johnson", "Rob Johnson"], type: "individual", status: "active" },
    { id: "c15", name: "Silverline Media Group", aliases: ["Silverline", "Silverline Media", "SMG"], type: "corporation", status: "former" },
    { id: "c16", name: "Chen Industries", aliases: ["Chen Ind", "Chen Industries LLC"], type: "corporation", status: "active" },
    { id: "c17", name: "Victoria Chang", aliases: ["V. Chang", "Vicky Chang"], type: "individual", status: "active" },
    { id: "c18", name: "Westfield Development Corp", aliases: ["Westfield", "Westfield Dev", "WDC"], type: "corporation", status: "active" },
    { id: "c19", name: "Thompson & Associates", aliases: ["Thompson Associates", "Thompson & Assoc"], type: "corporation", status: "former" },
    { id: "c20", name: "Katherine Wells", aliases: ["K. Wells", "Kate Wells", "Kathy Wells"], type: "individual", status: "active" },
  ],

  matters: [
    { id: "m1", clientId: "c1", title: "Meridian v. Chen — Partnership Dispute", type: "litigation", status: "open", opposingParties: ["David Chen", "Chen Industries"], relatedEntities: ["TechVault Corporation"] },
    { id: "m2", clientId: "c3", title: "Apex Industries — IP Licensing", type: "IP", status: "open", opposingParties: ["NovaCorp Holdings"], relatedEntities: ["Pacific Rim Trading Co"] },
    { id: "m3", clientId: "c4", title: "Mitchell Divorce Proceedings", type: "family", status: "open", opposingParties: ["Robert Johnson"], relatedEntities: ["Greenfield Properties LLC"] },
    { id: "m4", clientId: "c5", title: "Greenfield — Zoning Dispute", type: "real-estate", status: "closed", opposingParties: ["City of Tampa", "Westfield Development Corp"], relatedEntities: ["Marcus Rivera"] },
    { id: "m5", clientId: "c7", title: "TechVault — Data Breach Class Action", type: "litigation", status: "open", opposingParties: ["Consumer Protection Bureau"], relatedEntities: ["Meridian Tech Solutions", "Apex Industries Inc"] },
    { id: "m6", clientId: "c9", title: "Vanguard — SEC Compliance Review", type: "regulatory", status: "open", opposingParties: ["SEC"], relatedEntities: ["NovaCorp Holdings", "Pacific Rim Trading Co"] },
    { id: "m7", clientId: "c10", title: "Whitfield Employment Dispute", type: "litigation", status: "settled", opposingParties: ["Silverline Media Group"], relatedEntities: ["Victoria Chang"] },
    { id: "m8", clientId: "c11", title: "NovaCorp — Merger Advisory", type: "corporate", status: "open", opposingParties: [], relatedEntities: ["Apex Industries Inc", "Vanguard Capital Partners"] },
    { id: "m9", clientId: "c13", title: "Pacific Rim — Import/Export Compliance", type: "regulatory", status: "open", opposingParties: ["US Customs"], relatedEntities: ["Chen Industries"] },
    { id: "m10", clientId: "c14", title: "Johnson Real Estate Portfolio", type: "real-estate", status: "open", opposingParties: [], relatedEntities: ["Greenfield Properties LLC", "Westfield Development Corp"] },
    { id: "m11", clientId: "c16", title: "Chen Industries — Corporate Restructuring", type: "corporate", status: "open", opposingParties: [], relatedEntities: ["David Chen", "Meridian Tech Solutions"] },
    { id: "m12", clientId: "c17", title: "Chang v. Silverline — Wrongful Termination", type: "litigation", status: "open", opposingParties: ["Silverline Media Group"], relatedEntities: ["James Whitfield"] },
    { id: "m13", clientId: "c18", title: "Westfield — Land Acquisition", type: "real-estate", status: "open", opposingParties: ["Thompson & Associates"], relatedEntities: ["Greenfield Properties LLC"] },
    { id: "m14", clientId: "c20", title: "Wells — Trust & Estate Planning", type: "corporate", status: "open", opposingParties: [], relatedEntities: ["Vanguard Capital Partners"] },
    { id: "m15", clientId: "c12", title: "Rodriguez v. Apex — Product Liability", type: "litigation", status: "closed", opposingParties: ["Apex Industries Inc"], relatedEntities: ["Elena Rodriguez"] },
  ],

  contacts: [
    { id: "ct1", name: "Judge Patricia Hernandez", relationship: "judge", associatedClientIds: ["c1", "c7"], associatedMatterIds: ["m1", "m5"] },
    { id: "ct2", name: "Dr. Alan Foster", relationship: "expert", associatedClientIds: ["c7"], associatedMatterIds: ["m5"] },
    { id: "ct3", name: "Maria Santos", relationship: "witness", associatedClientIds: ["c1", "c16"], associatedMatterIds: ["m1", "m11"] },
    { id: "ct4", name: "Attorney Richard Blake", relationship: "opposing-counsel", associatedClientIds: [], associatedMatterIds: ["m1", "m12"] },
    { id: "ct5", name: "Jennifer Wu", relationship: "mediator", associatedClientIds: [], associatedMatterIds: ["m3", "m7"] },
    { id: "ct6", name: "Steven Park", relationship: "witness", associatedClientIds: ["c8"], associatedMatterIds: ["m7"] },
    { id: "ct7", name: "Attorney Diana Reeves", relationship: "opposing-counsel", associatedClientIds: [], associatedMatterIds: ["m5", "m15"] },
    { id: "ct8", name: "Michael Torres", relationship: "expert", associatedClientIds: ["c18"], associatedMatterIds: ["m4", "m13"] },
  ],

  relationships: [
    { entityA: "David Chen", entityB: "Chen Industries", type: "officer-of", bidirectional: false },
    { entityA: "David Chen", entityB: "Meridian Tech Solutions", type: "business-partner", bidirectional: true },
    { entityA: "Sarah Mitchell", entityB: "Robert Johnson", type: "spouse", bidirectional: true },
    { entityA: "NovaCorp Holdings", entityB: "Apex Industries Inc", type: "affiliate", bidirectional: true },
    { entityA: "Greenfield Properties LLC", entityB: "Westfield Development Corp", type: "affiliate", bidirectional: true },
    { entityA: "James Whitfield", entityB: "Silverline Media Group", type: "former-employer", bidirectional: false },
    { entityA: "Victoria Chang", entityB: "Silverline Media Group", type: "former-employer", bidirectional: false },
    { entityA: "Vanguard Capital Partners", entityB: "NovaCorp Holdings", type: "parent-subsidiary", bidirectional: false },
    { entityA: "Linda Park", entityB: "Steven Park", type: "spouse", bidirectional: true },
    { entityA: "Chen Industries", entityB: "Pacific Rim Trading Co", type: "affiliate", bidirectional: true },
    { entityA: "Katherine Wells", entityB: "Vanguard Capital Partners", type: "officer-of", bidirectional: false },
  ],
};
