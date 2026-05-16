"use client";

// the live demo: a real conversation with bro, powered by a real
// Backboard call. threadId is kept in state and sent back each turn so
// the conversation actually remembers, which is the whole point of the
// Backboard track. honest offline state if the key isn't wired.

import { useRef, useState } from "react";
import { Label } from "@/app/components/Label";
import { Button } from "@/app/components/Button";
import { Reveal } from "@/lib/motion";

type Turn = { role: "you" | "bro"; text: string };

export function TalkToBro() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const threadId = useRef<string | null>(null);

  async function send() {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput("");
    setTurns((t) => [...t, { role: "you", text: msg }]);
    setBusy(true);
    try {
      const res = await fetch("/api/bro/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, threadId: threadId.current }),
      });
      const data = (await res.json()) as {
        reply?: string;
        threadId?: string | null;
      };
      if (data.threadId) threadId.current = data.threadId;
      setTurns((t) => [
        ...t,
        { role: "bro", text: data.reply || "bro got cut off. try again." },
      ]);
    } catch {
      setTurns((t) => [
        ...t,
        { role: "bro", text: "bro got cut off. try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="talk"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-8 py-28 sm:px-16"
    >
      <Reveal>
        <Label>talk to bro</Label>
        <h2 className="bro-display mt-4 max-w-xl text-4xl text-ink sm:text-5xl">
          it already remembers.
        </h2>
        <p className="bro-body mt-5 max-w-md text-lg">
          a real conversation, powered by Backboard. keep going, it holds
          the thread.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 overflow-hidden rounded-bro border border-line bg-bg">
          <div className="flex min-h-52 flex-col gap-4 p-7">
            {turns.length === 0 && (
              <p className="bro-body text-sm text-soft">
                ask it anything. e.g. &ldquo;what are you?&rdquo;
              </p>
            )}
            {turns.map((t, i) => (
              <div key={i} className="text-[15px] leading-relaxed">
                <span className="bro-label mr-3 align-middle">
                  {t.role}
                </span>
                <span
                  className={
                    t.role === "bro" ? "text-ink" : "bro-body text-ink/80"
                  }
                >
                  {t.text}
                </span>
              </div>
            ))}
            {busy && (
              <div className="text-[15px] text-soft">
                <span className="bro-label mr-3">bro</span>
                thinking...
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 border-t border-line p-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="say something to bro"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[15px] text-ink outline-none placeholder:text-soft/70"
            />
            <Button onClick={send} disabled={busy || !input.trim()}>
              send
            </Button>
          </div>
        </div>
        <p className="mt-4 text-xs text-soft">
          powered by Backboard, persistent memory across the thread.
        </p>
      </Reveal>
    </section>
  );
}
