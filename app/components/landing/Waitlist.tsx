"use client";

// "want to know more" capture. the email is written to MongoDB Atlas
// and the count is read back from it. honest states: if storage isn't
// configured it says so instead of faking a success.

import { useEffect, useState } from "react";
import { Button } from "@/app/components/Button";
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
    <section id="waitlist" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-8 pb-28 pt-44 sm:px-16">
      <div className="relative z-10 max-w-xl">
        <Reveal>
          <h2 className="bro-display text-4xl text-bg sm:text-5xl">
            want to keep up with bro?
          </h2>
          <p className="bro-body mt-5 text-lg text-bg/85">
            {count != null
              ? `${count.toLocaleString()} already keeping up.`
              : "drop your email, we'll keep you in the loop."}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          {status === "done" ? (
            <p className="mt-9 text-lg text-bg">
              got it. we&rsquo;ll be in touch.
            </p>
          ) : (
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && join()}
                placeholder="you@email.com"
                className="min-w-0 flex-1 rounded-bro border border-bg/20 bg-bg px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-soft/70 focus:border-bg/50"
              />
              <Button
                onClick={join}
                disabled={status === "sending"}
                className="bg-bg! text-accent! px-7 py-3.5"
              >
                {status === "sending" ? "sending..." : "send it"}
              </Button>
            </div>
          )}
          {msg && <p className="mt-4 text-sm text-bg/70">{msg}</p>}
        </Reveal>
      </div>
    </section>
  );
}
