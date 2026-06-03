import { NextResponse } from "next/server";
import { fetchNearEarthObjects } from "@/lib/nasa";

export const runtime = "nodejs";
// Revalida a lista da NASA a cada hora.
export const revalidate = 3600;

export async function GET() {
  const list = await fetchNearEarthObjects();
  return NextResponse.json(list);
}
