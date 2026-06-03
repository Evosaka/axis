import { NextRequest, NextResponse } from "next/server";
import { runSimulation } from "@/lib/engine";

// Limite de execução (plano Hobby da Vercel permite até 60s).
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const event = String(body?.event || "").trim();
  if (event.length < 3) {
    return NextResponse.json({ detail: "Evento muito curto." }, { status: 400 });
  }
  const maxDepth = Math.min(Math.max(Number(body?.max_depth) || 4, 1), 8);
  const breadth = Math.min(Math.max(Number(body?.breadth) || 3, 1), 5);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const graph = await runSimulation(event, maxDepth, breadth, (p) =>
          send({ type: "progress", ...p }),
        );
        send({ type: "done", graph });
      } catch (e: any) {
        send({ type: "error", detail: e?.message || "Falha na simulação." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
