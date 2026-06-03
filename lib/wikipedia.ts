// Recuperação e verificação de fontes na Wikipedia (RAG). Tolerante a falhas.

import type { SourceRef } from "./schema";

const LANG = "pt";
const API = `https://${LANG}.wikipedia.org/w/api.php`;
const REST_SUMMARY = `https://${LANG}.wikipedia.org/api/rest_v1/page/summary/`;
const HEADERS = {
  "User-Agent": "CausalCascadeEngine/0.1 (FIAP Global Solution; projeto educacional)",
};

const MAX_CONTEXT_ARTICLES = 6;
const MAX_VERIFY = 80;
const CONCURRENCY = 10;

const STOPWORDS = new Set([
  "um", "uma", "uns", "umas", "o", "a", "os", "as", "de", "do", "da", "dos",
  "das", "em", "no", "na", "nos", "nas", "e", "que", "com", "por", "para",
  "ao", "aos", "se", "sua", "seu", "atinge", "cai", "caiu", "ocorre",
]);

function pageUrl(title: string): string {
  return `https://${LANG}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function isUsefulTitle(title: string): boolean {
  return !/^(\d{1,4}|século\s+\w+|\d+\s+de\s+\w+)$/i.test(title.trim());
}

function cleanQuery(event: string): string {
  const tokens = event.match(/[\wÀ-ÿ]+/g) || [];
  const keep = tokens.filter(
    (t) => !STOPWORDS.has(t.toLowerCase()) && !/^\d+[a-zçãéíóú]*$/i.test(t),
  );
  return keep.length ? keep.join(" ") : event;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .trim();
}

function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2);
    m.set(bg, (m.get(bg) || 0) + 1);
  }
  return m;
}

// Coeficiente de Dice sobre bigramas — aproxima a similaridade de strings.
function dice(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let overlap = 0;
  for (const [bg, count] of A) overlap += Math.min(count, B.get(bg) || 0);
  return (2 * overlap) / (a.length - 1 + (b.length - 1));
}

function similar(term: string, title: string): boolean {
  const a = norm(term);
  const b = norm(title);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  return dice(a, b) >= 0.5;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function searchTitles(query: string, limit: number): Promise<string[]> {
  try {
    const url = new URL(API);
    url.search = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: String(limit),
      format: "json",
    }).toString();
    const resp = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(6000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const titles: string[] = (data?.query?.search || []).map((h: any) => h.title);
    return titles.filter(isUsefulTitle);
  } catch {
    return [];
  }
}

async function summary(title: string): Promise<{ title: string; extract: string; url: string } | null> {
  try {
    const resp = await fetch(REST_SUMMARY + encodeURIComponent(title.replace(/ /g, "_")), {
      headers: HEADERS,
      signal: AbortSignal.timeout(6000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (String(data?.type || "").endsWith("not_found")) return null;
    return {
      title: data.title || title,
      extract: data.extract || "",
      url: data?.content_urls?.desktop?.page || pageUrl(title),
    };
  } catch {
    return null;
  }
}

export async function retrieveContext(
  event: string,
): Promise<{ context: string; retrieved: SourceRef[] }> {
  let titles = await searchTitles(event, MAX_CONTEXT_ARTICLES);
  if (titles.length === 0) titles = await searchTitles(cleanQuery(event), MAX_CONTEXT_ARTICLES);
  if (titles.length === 0) return { context: "", retrieved: [] };

  const summaries = await mapLimit(titles, CONCURRENCY, summary);
  const parts: string[] = [];
  const retrieved: SourceRef[] = [];
  for (const s of summaries) {
    if (!s || !s.extract) continue;
    parts.push(`## ${s.title}\n${s.extract}`);
    retrieved.push({ title: s.title, url: s.url, verified: true });
  }
  return { context: parts.join("\n\n"), retrieved };
}

export async function verifySources(titles: string[]): Promise<Map<string, SourceRef>> {
  const unique = Array.from(new Set(titles.filter((t) => t && t.trim())));
  const result = new Map<string, SourceRef>();
  const capped = unique.slice(0, MAX_VERIFY);

  const refs = await mapLimit(capped, CONCURRENCY, async (term) => {
    const hits = await searchTitles(term, 3);
    for (const hit of hits) {
      if (similar(term, hit)) {
        return [term, { title: hit, url: pageUrl(hit), verified: true }] as const;
      }
    }
    return [term, { title: term, url: null, verified: false }] as const;
  });

  for (const [term, ref] of refs) result.set(term, ref);
  for (const t of unique) {
    if (!result.has(t)) result.set(t, { title: t, url: null, verified: false });
  }
  return result;
}
