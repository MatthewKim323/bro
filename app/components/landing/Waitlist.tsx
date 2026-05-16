"use client";

// real waitlist. the email is written to MongoDB Atlas and the count
// is read back from it. honest states: if storage isn't configured it
// says so instead of faking a success.

import { useEffect, useState } from "react";
import { Label } from "@/app/components/Label";
import { Button } from "@/app/components/Button";
import { MatchaField } from "@/app/components/MatchaField";
import { Reveal } from "@/lib/motion";

type Status = "idle" | "sending" | "done" | "error" | "unconfigured";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [count, setCount] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d: { count?: number; configured?: boolean }) => {
        if (d.configured && typeof d.count === "number") setCount(d.count);
      })
      .catch(() => {});
  }, []);

  async function join() {
    if (status === "sending") return;
    setStatus("sending");
    setMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        configured?: boolean;
        count?: number;
        error?: string;
      };
      if (data.ok) {
        setStatus("done");
        if (typeof data.count === "number") setCount(data.count);
      } else if (data.configured === false) {
        setStatus("unconfigured");
        setMsg("waitlist storage isn't wired in this build yet.");
      } else {
        setStatus("error");
        setMsg(data.error || "something went wrong.");
      }
    } catch {
      setStatus("error");
      setMsg("network hiccup. try again.");
    }
  }

  return (
    <section className="relative mx-auto mt-28 w-full max-w-6xl overflow-hidden rounded-bro px-8 py-24 sm:px-16">
      <MatchaField variant="soft" />
      <div className="relative z-10 max-w-xl">
        <Reveal>
          <Label>be first</Label>
          <h2 className="bro-display mt-4 text-4xl text-ink sm:text-5xl">
            get bro before everyone else.
          </h2>
          <p className="bro-body mt-5 text-lg">
            {count != null
              ? `${count.toLocaleString()} already on the list.`
              : "drop your email. no spam, just the invite."}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          {status === "done" ? (
            <p className="mt-9 text-lg text-ink">
              you&rsquo;re in. bro will reach out.
            </p>
          ) : (
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && join()}
                placeholder="you@email.com"
                className="min-w-0 flex-1 rounded-bro border border-line bg-bg px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-soft/70 focus:border-accent/50"
              />
              <Button
                onClick={join}
                disabled={status === "sending"}
                className="px-7 py-3.5"
              >
                {status === "sending" ? "joining..." : "join the waitlist"}
              </Button>
            </div>
          )}
          {msg && <p className="mt-4 text-sm text-soft">{msg}</p>}
        </Reveal>
      </div>
    </section>
  );
}
