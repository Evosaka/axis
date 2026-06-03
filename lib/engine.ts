// Motor causal: OpenAI (saída estruturada) + grounding/verificação na Wikipedia.

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { CausalGraph, type CausalGraphT, type EnrichedGraph, type SourceRef } from "./schema";
import { retrieveContext, verifySources } from "./wikipedia";

const DEFAULT_MODEL = "gpt-4.1";

const SYSTEM_PROMPT = `Você é o Causal Cascade Engine, um simulador de propagação de consequências.

Dado um ACONTECIMENTO, você constrói um GRAFO CAUSAL DIRECIONADO ACÍCLICO (DAG)
das consequências em cascata que decorreriam dele.

PRINCÍPIOS (siga rigorosamente):
1. Causalidade, não associação. Cada aresta deve ser uma relação de CAUSA→EFEITO
   plausível e defensável, não apenas "temas relacionados".
2. Probabilístico, não determinístico. Toda consequência recebe uma confidence
   (0.0-1.0). NÃO afirme certezas; modele probabilidades calibradas. Efeitos
   diretos e bem estabelecidos têm confiança alta; efeitos de 2ª/3ª ordem caem.
3. Ancoragem obrigatória. Toda consequência precisa de sources não-vazio:
   referências plausíveis (artigos da Wikipedia, eventos históricos análogos,
   princípios econômicos/físicos conhecidos). Sem fontes = sem alucinação aceita.
4. DAG, não árvore. Reutilize nós quando várias causas convergem para o mesmo
   efeito (uma consequência pode ter múltiplas arestas de entrada). Sem ciclos.
5. Atributos completos: domínio, horizonte temporal, magnitude e geografia em
   cada nó.
6. Riqueza com poda. Gere um grafo DENSO e RAMIFICADO: derive vários efeitos por
   nó e desça por todas as camadas pedidas. Mas só inclua vínculos defensáveis —
   a confiança decai com a profundidade; descarte ramos com confiança < 0.12.

O nó-raiz representa o próprio acontecimento (confidence=1.0, sources com o fato).
Gere ids curtos e sequenciais ('n1', 'n2', ...). Responda em português.`;

function buildUserPrompt(event: string, maxDepth: number, breadth: number, context: string): string {
  const grounding = context
    ? `\n\nCONTEXTO RECUPERADO DA WIKIPEDIA (use para ancorar o raciocínio e ` +
      `prefira citar estes títulos reais nas sources):\n${context}\n`
    : "";
  return (
    `ACONTECIMENTO: ${event}\n\n` +
    `Construa um grafo causal RICO e PROFUNDO:\n` +
    `- Profundidade: exatamente ${maxDepth} camadas de consequências a partir da raiz.\n` +
    `- Amplitude: derive em média ${breadth} efeitos diretos de cada nó relevante ` +
    `(mais nos efeitos de alta confiança, menos nos incertos).\n` +
    `- Reaproveite nós quando vários caminhos convergirem para o mesmo efeito (é um DAG).\n` +
    `- Cubra múltiplos domínios (economia, clima, sociedade, política, infraestrutura, saúde, etc.).\n` +
    `Gere o máximo de nós defensáveis — quanto maior o evento, maior o grafo.` +
    grounding
  );
}

async function enrich(graph: CausalGraphT, retrieved: SourceRef[]): Promise<EnrichedGraph> {
  const unique = Array.from(new Set(graph.nodes.flatMap((n) => n.sources)));
  let verified = new Map<string, SourceRef>();
  try {
    verified = await verifySources(unique);
  } catch {
    verified = new Map();
  }
  const nodes = graph.nodes.map((n) => ({
    ...n,
    sources: n.sources.map(
      (s) => verified.get(s) || { title: s, url: null, verified: false },
    ),
  }));
  return {
    event: graph.event,
    root_id: graph.root_id,
    nodes,
    edges: graph.edges,
    summary: graph.summary,
    retrieved,
  };
}

export type Progress =
  | { stage: "retrieval" }
  | { stage: "reasoning"; retrieved: SourceRef[] }
  | { stage: "verification" };

export async function runSimulation(
  event: string,
  maxDepth = 4,
  breadth = 3,
  onProgress?: (p: Progress) => void,
): Promise<EnrichedGraph> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não definida (web/.env.local ou Vercel).");
  }
  const client = new OpenAI({ timeout: 180000 });
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  // 1. Grounding real da Wikipedia (tolerante a falhas).
  onProgress?.({ stage: "retrieval" });
  let context = "";
  let retrieved: SourceRef[] = [];
  try {
    ({ context, retrieved } = await retrieveContext(event));
  } catch {
    context = "";
    retrieved = [];
  }

  // 2. Raciocínio causal ancorado, com saída estruturada.
  onProgress?.({ stage: "reasoning", retrieved });
  const response = await client.responses.parse({
    model,
    max_output_tokens: 32000,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(event, maxDepth, breadth, context) },
    ],
    text: { format: zodTextFormat(CausalGraph, "causal_graph") },
  });

  const graph = response.output_parsed;
  if (!graph) throw new Error("O modelo não retornou um grafo válido.");

  // 3. Verifica fontes na Wikipedia e monta o grafo final.
  onProgress?.({ stage: "verification" });
  return enrich(graph, retrieved);
}
