// Integração com a NASA NeoWs (asteroides próximos da Terra). Tolerante a falhas.

import type { Asteroid } from "./schema";

const FEED_URL = "https://api.nasa.gov/neo/rest/v1/feed";
const HEADERS = { "User-Agent": "CausalCascadeEngine/0.1 (FIAP Global Solution)" };

function apiKey(): string {
  return process.env.NASA_API_KEY || "DEMO_KEY";
}

function parse(neo: any): Asteroid | null {
  try {
    const diam = neo.estimated_diameter.meters;
    const diameter_m = Math.round(
      (diam.estimated_diameter_min + diam.estimated_diameter_max) / 2,
    );
    const approach = neo.close_approach_data[0];
    let name: string = String(neo.name).trim();
    if (name.startsWith("(") && name.endsWith(")")) name = name.slice(1, -1);
    return {
      id: String(neo.id),
      name,
      diameter_m,
      velocity_kms: Math.round(parseFloat(approach.relative_velocity.kilometers_per_second) * 10) / 10,
      miss_distance_km: Math.round(parseFloat(approach.miss_distance.kilometers)),
      close_approach_date: approach.close_approach_date,
      hazardous: Boolean(neo.is_potentially_hazardous_asteroid),
      nasa_url: neo.nasa_jpl_url || "",
    };
  } catch {
    return null;
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function fetchNearEarthObjects(limit = 15): Promise<Asteroid[]> {
  const today = new Date();
  const end = new Date(today.getTime() + 6 * 86400000);
  const url = new URL(FEED_URL);
  url.search = new URLSearchParams({
    start_date: isoDate(today),
    end_date: isoDate(end),
    api_key: apiKey(),
  }).toString();

  let byDate: Record<string, any[]> = {};
  try {
    const resp = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    byDate = (await resp.json())?.near_earth_objects || {};
  } catch {
    return [];
  }

  const asteroids: Asteroid[] = [];
  for (const day of Object.values(byDate)) {
    for (const neo of day) {
      const parsed = parse(neo);
      if (parsed) asteroids.push(parsed);
    }
  }

  // Perigosos primeiro, depois os maiores.
  asteroids.sort((a, b) => Number(b.hazardous) - Number(a.hazardous) || b.diameter_m - a.diameter_m);

  const seen = new Set<string>();
  const unique = asteroids.filter((a) => (seen.has(a.name) ? false : (seen.add(a.name), true)));
  return unique.slice(0, limit);
}
