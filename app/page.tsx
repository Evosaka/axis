"use client";

import { useEffect, useState } from "react";
import CausalGraph from "@/components/CausalGraph";
import {
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  HORIZON_LABELS,
  MAGNITUDE_LABELS,
} from "@/lib/config";
import type { Asteroid, EnrichedGraph, EnrichedNode } from "@/lib/schema";

const EXAMPLES = [
  "um asteroide de 300m atinge a Califórnia",
  "uma tempestade solar derruba metade dos satélites em órbita",
  "uma erupção vulcânica de grande porte na Islândia",
];

type ProgressMsg = { stage: string; retrieved?: { length: number }[] };

const STAGE_LABEL: Record<string, string> = {
  retrieval: "Recuperando contexto na Wikipedia…",
  reasoning: "Raciocinando a cadeia causal…",
  verification: "Verificando fontes…",
};

const STAGE_ORDER = ["retrieval", "reasoning", "verification"];
const STAGE_SHORT: Record<string, string> = {
  retrieval: "Wikipedia",
  reasoning: "Raciocínio",
  verification: "Fontes",
};

async function simulateStream(
  event: string,
  maxDepth: number,
  breadth: number,
  onProgress: (p: ProgressMsg) => void,
): Promise<EnrichedGraph> {
  const resp = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, max_depth: maxDepth, breadth }),
  });

  if (!resp.ok || !resp.body) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(typeof data.detail === "string" ? data.detail : `Erro ${resp.status}.`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      if (msg.type === "progress") onProgress(msg);
      else if (msg.type === "done") return msg.graph as EnrichedGraph;
      else if (msg.type === "error") throw new Error(msg.detail);
    }
  }
  throw new Error("Conexão encerrada antes de concluir.");
}

export default function Page() {
  const [event, setEvent] = useState(EXAMPLES[0]);
  const [depth, setDepth] = useState(4);
  const [breadth, setBreadth] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graph, setGraph] = useState<EnrichedGraph | null>(null);
  const [selected, setSelected] = useState<EnrichedNode | null>(null);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [stage, setStage] = useState<string>("");
  const [retrievedCount, setRetrievedCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    fetch("/api/asteroids")
      .then((r) => (r.ok ? r.json() : []))
      .then(setAsteroids)
      .catch(() => setAsteroids([]));
  }, []);

  function pickAsteroid(id: string) {
    const a = asteroids.find((x) => x.id === id);
    if (!a) return;
    setEvent(
      `o asteroide ${a.name} (~${a.diameter_m} m de diâmetro, a ${a.velocity_kms} km/s) atinge a Califórnia`,
    );
  }

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!event.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    setStage("retrieval");
    setRetrievedCount(0);
    setElapsed(0);

    const started = Date.now();
    const timer = setInterval(() => setElapsed((Date.now() - started) / 1000), 200);

    try {
      const result = await simulateStream(event.trim(), depth, breadth, (p) => {
        setStage(p.stage);
        if (p.retrieved) setRetrievedCount(p.retrieved.length);
      });
      setGraph(result);
    } catch (err: any) {
      setError(err.message);
      setGraph(null);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        {/* thin info strip */}
        <div className="topbar-strip">
          <span className="strip-info">// AXIS · CAUSAL CASCADE ENGINE · FIAP GLOBAL SOLUTION 2025 · SYS-AXS-001</span>
          <span className="strip-active">
            <span className="strip-dot" />
            SISTEMA ATIVO
          </span>
        </div>

        {/* main header row */}
        <div className="topbar-main">
          <div className="brand">
            <span className="brand-icon">☄</span>
            <div className="brand-copy">
              <h1 className="brand-title">AX<span className="r">IS</span></h1>
              <p className="brand-engine">CAUSAL CASCADE ENGINE</p>
              <p className="brand-jp">因果の軸</p>
            </div>
            <span className="brand-serial">v1.0 // 2025</span>
          </div>

          <div className="controls-wrap">
            <form className="controls" onSubmit={run}>
              <input
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="Descreva um acontecimento catastrófico…"
              />
              <label className="field">
                <span>Profundidade</span>
                <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? "camada" : "camadas"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Amplitude</span>
                <select value={breadth} onChange={(e) => setBreadth(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((b) => (
                    <option key={b} value={b}>
                      {b}× ramos
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "SIMULANDO" : "SIMULAR"}
              </button>
            </form>
          </div>
        </div>

        {/* examples + nasa picker */}
        <div className="topbar-foot">
          <span className="foot-label">// cenários</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="chip" onClick={() => setEvent(ex)}>
              {ex}
            </button>
          ))}
          {asteroids.length > 0 && (
            <div className="nasa-picker">
              <span className="nasa-tag">
                <span className="nasa-tag-icon">☄</span>
                NASA NEO
              </span>
              <select defaultValue="" onChange={(e) => pickAsteroid(e.target.value)}>
                <option value="" disabled>
                  Usar asteroide real…
                </option>
                {asteroids.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.hazardous ? "[!] " : ""}
                    {a.name} · {a.diameter_m}m · {a.velocity_kms} km/s
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      <main className="stage">
        <section className="graph-area">
          {graph ? (
            <CausalGraph graph={graph} onSelect={setSelected} />
          ) : (
            <div className="placeholder">
              {loading ? (
                <Loading stage={stage} elapsed={elapsed} retrievedCount={retrievedCount} />
              ) : error ? (
                <>
                  <span className="placeholder-icon">⚠</span>
                  <p className="error">{error}</p>
                </>
              ) : (
                <>
                  <span className="placeholder-icon">◈</span>
                  <p>
                    Digite um acontecimento e clique em SIMULAR<br />
                    para ver a cadeia causal se propagar.
                  </p>
                </>
              )}
            </div>
          )}
          {graph && <Legend />}
        </section>

        <aside className="panel">
          <div className="panel-bar">
            <span className="panel-bar-dot" />
            <span className="panel-bar-label">
              {selected ? "ANÁLISE DE NÓ" : graph ? "RESUMO" : "PAINEL"}
            </span>
          </div>
          {selected ? (
            <NodeDetail node={selected} />
          ) : graph ? (
            <GraphSummary graph={graph} />
          ) : (
            <div className="panel-empty">
              <span className="panel-empty-icon">⬡</span>
              <p>O resumo e os detalhes aparecem aqui após a simulação.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function Loading({
  stage,
  elapsed,
  retrievedCount,
}: {
  stage: string;
  elapsed: number;
  retrievedCount: number;
}) {
  const idx = Math.max(0, STAGE_ORDER.indexOf(stage));
  return (
    <div className="loading">
      <div className="loading-header">
        <span className="loading-icon">◎</span>
        <span className="loading-title">SIMULANDO</span>
        <span className="loading-jp">シミュレーション実行中</span>
      </div>

      <div className="loading-bar">
        <div className="loading-bar-fill" />
      </div>

      <p className="loading-stage">{STAGE_LABEL[stage] || "Processando…"}</p>

      <div className="loading-steps">
        {STAGE_ORDER.map((s, i) => (
          <span
            key={s}
            className={`step ${i < idx ? "step-done" : i === idx ? "step-active" : ""}`}
          >
            {STAGE_SHORT[s]}
          </span>
        ))}
      </div>

      {retrievedCount > 0 && (
        <p className="loading-sub">{retrievedCount} artigos Wikipedia ancorando o raciocínio</p>
      )}

      <div>
        <span className="loading-elapsed">{elapsed.toFixed(0)}</span>
        <span className="loading-elapsed-unit"> SEG</span>
      </div>
    </div>
  );
}

function GraphSummary({ graph }: { graph: EnrichedGraph }) {
  return (
    <div className="detail">
      <h2>Cascata Causal</h2>
      <p className="summary">{graph.summary}</p>

      <div className="stats">
        <div>
          <strong>{graph.nodes.length}</strong>
          <span>Consequências</span>
        </div>
        <div>
          <strong>{graph.edges.length}</strong>
          <span>Vínculos Causais</span>
        </div>
      </div>

      {graph.retrieved?.length > 0 && (
        <>
          <h3>Base Wikipedia</h3>
          <p className="hint" style={{ marginTop: 0 }}>
            {graph.retrieved.length} artigo{graph.retrieved.length > 1 ? "s" : ""} recuperado{graph.retrieved.length > 1 ? "s" : ""}:
          </p>
          <ul className="sources">
            {graph.retrieved.map((s, i) => (
              <li key={i}>
                <a href={s.url || "#"} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="hint">// Clique em um nó do grafo para ver detalhes e fontes.</p>
    </div>
  );
}

function NodeDetail({ node }: { node: EnrichedNode }) {
  const color = DOMAIN_COLORS[node.domain] || "#555555";
  return (
    <div className="detail">
      <div className="tag" style={{ background: color }}>
        {DOMAIN_LABELS[node.domain] || node.domain}
      </div>
      <h2>{node.label}</h2>
      <p className="summary">{node.description}</p>

      <h3>Métricas</h3>
      <div className="meta">
        <Meta label="Confiança" value={`${Math.round(node.confidence * 100)}%`} />
        <Meta label="Horizonte" value={HORIZON_LABELS[node.horizon] || node.horizon} />
        <Meta label="Magnitude" value={MAGNITUDE_LABELS[node.magnitude] || node.magnitude} />
        <Meta label="Geografia" value={node.geography} />
      </div>

      <div className="confidence-bar">
        <div
          className="confidence-fill"
          style={{ width: `${node.confidence * 100}%`, background: color }}
        />
      </div>

      <h3>Fontes</h3>
      <ul className="sources">
        {node.sources.map((s, i) => (
          <li key={i}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
            ) : (
              s.title
            )}
            {s.verified && <span className="badge">Wikipedia</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Legend() {
  return (
    <div className="legend">
      {Object.entries(DOMAIN_LABELS).map(([k, label]) => (
        <span key={k} className="legend-item">
          <i style={{ background: DOMAIN_COLORS[k] }} />
          {label}
        </span>
      ))}
    </div>
  );
}
