import { z } from "zod";

// --- Schema da saída estruturada do modelo (validado pelo OpenAI) ---

export const Domain = z.enum([
  "economy",
  "climate",
  "society",
  "politics",
  "infrastructure",
  "health",
  "environment",
  "technology",
  "security",
]);

export const Horizon = z.enum(["immediate", "days", "weeks", "months", "years"]);
export const Magnitude = z.enum(["low", "medium", "high", "severe"]);

export const ConsequenceNode = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  domain: Domain,
  confidence: z.number(),
  horizon: Horizon,
  magnitude: Magnitude,
  geography: z.string(),
  sources: z.array(z.string()),
});

export const CausalEdge = z.object({
  source: z.string(),
  target: z.string(),
  weight: z.number(),
  rationale: z.string(),
});

export const CausalGraph = z.object({
  event: z.string(),
  root_id: z.string(),
  nodes: z.array(ConsequenceNode),
  edges: z.array(CausalEdge),
  summary: z.string(),
});

export type CausalGraphT = z.infer<typeof CausalGraph>;
export type CausalEdgeT = z.infer<typeof CausalEdge>;

// --- Tipos da saída enriquecida (fontes verificadas + base de conhecimento) ---

export type SourceRef = { title: string; url: string | null; verified: boolean };

export type EnrichedNode = {
  id: string;
  label: string;
  description: string;
  domain: z.infer<typeof Domain>;
  confidence: number;
  horizon: z.infer<typeof Horizon>;
  magnitude: z.infer<typeof Magnitude>;
  geography: string;
  sources: SourceRef[];
};

export type EnrichedGraph = {
  event: string;
  root_id: string;
  nodes: EnrichedNode[];
  edges: CausalEdgeT[];
  summary: string;
  retrieved: SourceRef[];
};

export type Asteroid = {
  id: string;
  name: string;
  diameter_m: number;
  velocity_kms: number;
  miss_distance_km: number;
  close_approach_date: string;
  hazardous: boolean;
  nasa_url: string;
};
