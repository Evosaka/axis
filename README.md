# Causal Cascade Engine — Simulador de Propagação de Consequências

Projeto para a **FIAP Global Solution 2026 ("Space Connect")**.

Dado um acontecimento (ex.: *"um asteroide de 300m atinge a Califórnia"*), o
sistema constrói um **grafo causal probabilístico** das consequências em
cascata — cada uma pontuada por confiança, com domínio, horizonte temporal,
magnitude, geografia e **fontes/evidências** que a ancoram (anti-alucinação).

> Foco temático: integração **Terra–Espaço** (impacto de asteroide / tempestade
> solar derrubando satélites). Conecta dados reais (NASA NEO, clima espacial) nas
> próximas fases.

## Status (roteiro)

- [x] **Fase 0/1** — Backend FastAPI + motor causal via OpenAI (Structured Outputs
  com Pydantic). Endpoint `POST /simulate`.
- [x] **Fase 2** — RAG Wikipedia: grounding real + verificação de fontes com links.
- [ ] Fase 3 — Expansão BFS em cascata com poda + persistência em Neo4j.
- [x] **Fase 4** — Frontend React + Cytoscape.js (grafo interativo, painel de fontes).
- [x] **Fase 5** — Dados reais da NASA NEO (selecionar asteroide real e simular o impacto).
- [x] **Fase 6** — Validação histórica: mede recall do motor vs. consequências reais (95% no conjunto atual).
- [x] **Migração Next.js** — app unificado (frontend + API + validação) na raiz, deploy de 1 push na Vercel.

## Como rodar

App Next.js (App Router) na **raiz do repositório**: frontend + API na mesma base.

```bash
npm install
cp .env.local.example .env.local     # e preencha OPENAI_API_KEY
npm run dev                          # http://localhost:3000
```

Rotas: a UI em `/`, e as APIs em `/api/simulate` (POST) e `/api/asteroids` (GET).
A lógica do motor vive em `lib/` (engine, wikipedia, nasa) e os schemas em
`lib/schema.ts` (zod). Sem CORS — frontend e API na mesma origem.

### Deploy na Vercel

1. `git push` o repositório para o GitHub.
2. Na Vercel: **New Project** → selecione o repo (Root Directory = raiz, padrão).
   O preset Next.js é detectado automaticamente.
3. Em **Environment Variables**, adicione `OPENAI_API_KEY` (e opcionalmente
   `OPENAI_MODEL`, `NASA_API_KEY`).
4. Deploy. Pronto — 1 URL, 1 serviço.

> ⚠️ O `/simulate` leva ~35s. A rota define `maxDuration = 60` (teto do plano
> Hobby). Cabe, mas é apertado — no plano Pro (300s) sobra folga. Para reduzir,
> use profundidade/amplitude menores como padrão.

---

## Validação histórica (Fase 6)

Mede se o motor reconstrói as consequências **documentadas** de eventos reais
(Chernobyl, Eyjafjallajökull, COVID-19), casando por similaridade de embeddings —
e roda o **mesmo motor que vai pro deploy**:

```bash
npm run validate                       # usa cache; -- --refresh re-roda
npm run validate -- --threshold 0.55   # testa a sensibilidade ao limiar
```

Imprime o recall por evento e o total, e salva `validation/report.md`.
Resultado atual: **21/22 = 95%** de recall (limiar 0.50, auditável).

## Arquitetura

```
Evento ─▶ Next.js /api/simulate ─▶ motor (OpenAI, saída estruturada)
   │        (streaming de etapas)        │
   │                                     ├─ Wikipedia (grounding + verificação de fontes)
   ▼                                     └─ NASA NeoWs (asteroides reais)
 Grafo React + Cytoscape          DAG causal (nós + arestas ponderadas, com fontes)
```

Stack: **TypeScript · Next.js (App Router) · OpenAI API (gpt-4.1, configurável)** ·
Wikipedia (RAG) · NASA NeoWs · React + Cytoscape.js · (futuro) Neo4j.

## Estrutura do repositório

Tudo num app Next.js só, na raiz:

- **`app/`** — UI (`page.tsx`) + rotas de API (`api/simulate`, `api/asteroids`)
- **`lib/`** — motor (`engine.ts`), `wikipedia.ts`, `nasa.ts`, `schema.ts` (zod), `config.ts`
- **`components/`** — `CausalGraph.tsx` (Cytoscape)
- **`validation/`** — harness da Fase 6 (`npm run validate`) + `report.md`
