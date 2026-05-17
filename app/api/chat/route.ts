// bro's chat endpoint. the browser POSTs here, never to jabby directly
// (BRO_PLAN.md §9.1). it streams jabby's SSE straight through, byte for
// byte, because jabby already emits exactly the events the UI parses:
//   data: {"type":"chunk","text":...}
//   data: {"type":"unblock"}
//   data: {"type":"done"} | {"type":"error","message":...}
//
// a dead daemon, the public build, or a bad body never throw a 500:
// they emit one calm SSE error + done so the client's parser stays
// uniform and the UI can show a human sentence with retry (rule 6).

import { chat } from "@/lib/jabby";
import { isAppEnabled } from "@/lib/mode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function sseOnce(message: string): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(
        enc.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`),
      );
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      controller.close();
    },
  });
  return new Response(body, { headers: SSE_HEADERS });
}

export async function POST(req: Request) {
  if (!isAppEnabled()) {
    return sseOnce("the bridge is off in this build. run bro locally.");
  }

  let message = "";
  try {
    const body = (await req.json()) as { message?: unknown };
    message = String(body?.message ?? "").trim();
  } catch {
    return sseOnce("that message did not come through. try again.");
  }
  if (!message) {
    return sseOnce("type something first.");
  }

  const result = await chat(message);
  if (!result.ok) {
    return sseOnce(result.message);
  }

  // pass jabby's SSE through unmodified. the connect was already bounded
  // in lib/jabby; the stream itself flows for as long as jabby needs.
  return new Response(result.stream, { headers: SSE_HEADERS });
}
