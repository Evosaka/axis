// Harness de validação histórica (Fase 6), em TypeScript.
//
// Roda o MESMO motor que vai pro deploy (../lib/engine) sobre eventos históricos
// e mede quantas das consequências reais documentadas ele reconstrói, casando
// por similaridade de embeddings (objetivo e reproduzível).
//
// Uso:
//   npm run validate                 # usa cache se existir
//   npm run validate -- --refresh    # re-roda as simulações
//   npm run validate -- --threshold 0.55
//
// Resultados também são salvos em web/validation/report.md.

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { runSimulation } from "../lib/engine";
import type { EnrichedGraph } from "../lib/schema";
import { HISTORICAL_EVENTS } from "./dataset";

const CACHE_DIR = path.join(__dirname, "cache");
const REPORT = path.join(__dirname, "report.md");
const EMBED_MODEL = "text-embedding-3-small";
const DEPTH = 4;
const BREADTH = 3;

async function getGraph(slug: string, event: string, refresh: boolean): Promise<EnrichedGraph> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${slug}.json`);
  if (fs.existsSync(file) && !refresh) {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  }
  const graph = await runSimulation(event, DEPTH, BREADTH);
  fs.writeFileSync(file, JSON.stringify(graph, null, 2));
  return graph;
}

async function embed(client: OpenAI, texts: string[]): Promise<number[][]> {
  const resp = await client.embeddings.create({ model: EMBED_MODEL, input: texts });
  return resp.data.map((d) => d.embedding);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

async function run(threshold: number, refresh: boolean): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY não definida (web/.env.local).");
    process.exit(1);
  }
  const client = new OpenAI();

  const lines: string[] = ["# Relatório de validação histórica\n"];
  lines.push(`Limiar de similaridade: **${threshold}** · modelo de embeddings: \`${EMBED_MODEL}\`\n`);
  let totalHits = 0;
  let totalGt = 0;

  for (const item of HISTORICAL_EVENTS) {
    const graph = await getGraph(item.slug, item.event, refresh);
    const nodeTexts = graph.nodes.map((n) => `${n.label}. ${n.description}`);
    const gt = item.groundTruth;

    const gtVecs = await embed(client, gt);
    const nodeVecs = await embed(client, nodeTexts);

    let hits = 0;
    const rows: { text: string; score: number; node: string }[] = [];
    gt.forEach((gText, gi) => {
      let bestScore = 0;
      let bestNode = "";
      nodeTexts.forEach((nText, ni) => {
        const s = cosine(gtVecs[gi], nodeVecs[ni]);
        if (s > bestScore) {
          bestScore = s;
          bestNode = nText;
        }
      });
      const hit = bestScore >= threshold;
      if (hit) hits++;
      rows.push({ text: gText, score: bestScore, node: hit ? bestNode : "" });
    });

    totalHits += hits;
    totalGt += gt.length;
    const recall = hits / gt.length;

    const header = `\n## ${item.event}\n\nRecall: **${hits}/${gt.length} = ${Math.round(recall * 100)}%**  (${graph.nodes.length} nós gerados)\n`;
    console.log(header);
    lines.push(header);
    lines.push("| Consequência documentada | Reconstruída? | Score | Nó correspondente |");
    lines.push("|---|---|---|---|");
    for (const r of rows) {
      const mark = r.score >= threshold ? "✅" : "❌";
      console.log(`  ${mark} ${r.score.toFixed(2)}  ${r.text}`);
      const shortNode = r.node.length > 70 ? r.node.slice(0, 70) + "…" : r.node;
      lines.push(`| ${r.text} | ${mark} | ${r.score.toFixed(2)} | ${shortNode} |`);
    }
  }

  const overall = totalGt ? totalHits / totalGt : 0;
  const summary = `\n# RESULTADO GERAL: ${totalHits}/${totalGt} = ${Math.round(overall * 100)}% de recall\n`;
  console.log(summary);
  lines.push(summary);
  lines.push(
    "\n> Nota: eventos conhecidos pelo modelo — isto mede a capacidade de " +
      "*reconstruir* a cadeia causal correta, não previsão inédita. O recall " +
      "depende do limiar escolhido; os scores acima são auditáveis.",
  );
  fs.writeFileSync(REPORT, lines.join("\n"), "utf-8");
  console.log(`Relatório salvo em ${REPORT}`);
}

const args = process.argv.slice(2);
const refresh = args.includes("--refresh");
const ti = args.indexOf("--threshold");
const threshold = ti >= 0 ? parseFloat(args[ti + 1]) : 0.5;

run(threshold, refresh).catch((e) => {
  console.error(e);
  process.exit(1);
});
