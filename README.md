# Axis — Simulador de Propagação de Consequências

Dado um acontecimento inicial (ex.: *"um asteroide de 300 m atinge a Califórnia"*), o **Axis** constrói automaticamente um grafo causal probabilístico das consequências em cascata. Cada nó do grafo representa uma consequência pontuada por confiança, com domínio, horizonte temporal, magnitude, localização geográfica e fontes verificáveis que a ancoram — reduzindo ao máximo a geração de informações sem embasamento.

O projeto nasceu com foco temático em eventos de integração **Terra–Espaço**: impacto de asteroides, tempestades solares, falha em constelações de satélites. Esse recorte conecta dados reais de agências como a NASA diretamente ao motor de simulação, tornando os cenários rastreáveis e auditáveis.

---

## O que o sistema faz

### Motor causal com saída estruturada

O núcleo do Axis é um motor que recebe um evento em linguagem natural e devolve um DAG (grafo acíclico dirigido) de consequências. Cada consequência carrega:

- **Confiança** — probabilidade estimada pelo modelo de que aquela consequência ocorra dado o evento pai
- **Domínio** — área de impacto (econômica, humanitária, ambiental, tecnológica etc.)
- **Horizonte temporal** — quando a consequência tende a se manifestar
- **Magnitude** — escala do impacto
- **Fontes** — referências verificáveis que sustentam a relação causal

A saída estruturada é validada via Zod antes de chegar ao cliente, garantindo que o grafo seja sempre completo e tipado.

### Grounding via Wikipedia

Antes de montar o grafo, o motor busca na Wikipedia artigos relacionados ao evento simulado e usa esse conteúdo como contexto adicional. Isso ancora as consequências em fatos documentados e exibe, para cada nó do grafo, os links das fontes consultadas — permitindo que o usuário audite de onde cada relação causal veio.

### Dados reais da NASA

O sistema integra a API **NASA NeoWs** (Near Earth Object Web Service), que lista objetos próximos à Terra com dados reais de diâmetro, velocidade e distância de aproximação. O usuário pode selecionar um asteroide real do catálogo da NASA e simular o impacto diretamente, substituindo parâmetros genéricos por valores científicos.

### Visualização interativa do grafo

O frontend exibe o DAG causal como um grafo interativo construído com **Cytoscape.js**. Os nós são coloridos por nível de confiança e clicáveis — ao selecionar um nó, o painel lateral mostra os detalhes da consequência e as fontes que a embasam. O layout usa o algoritmo Dagre para organizar a hierarquia causal de forma legível.

### Validação histórica

O Axis inclui um harness de validação que mede se o motor consegue reconstruir as consequências **documentadas** de eventos reais (Chernobyl, erupção do Eyjafjallajökull, COVID-19). A comparação usa similaridade de embeddings entre o que o motor gera e o que realmente ocorreu, produzindo um índice de recall auditável. O conjunto atual atinge **95% de recall** (21/22 consequências recuperadas, limiar 0.50).

---

## Stack

**TypeScript · Next.js (App Router) · OpenAI API · Wikipedia · NASA NeoWs · React · Cytoscape.js · Zod**

## Estrutura

- **`app/`** — interface do usuário e rotas de API (`/api/simulate`, `/api/asteroids`)
- **`lib/`** — motor causal (`engine.ts`), integrações (`wikipedia.ts`, `nasa.ts`), schemas (`schema.ts`), configuração
- **`components/`** — visualização do grafo (`CausalGraph.tsx`)
- **`validation/`** — harness de validação histórica e relatório de recall

## Como rodar

```bash
npm install
cp .env.local.example .env.local   # preencha OPENAI_API_KEY
npm run dev                        # http://localhost:3000
```

Para rodar a validação histórica:

```bash
npm run validate
```
