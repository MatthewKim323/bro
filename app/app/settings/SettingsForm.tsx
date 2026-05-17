"use client";

// the settings surface. quiet, human, one column of choices with a
// live chat preview that reflects every change instantly. palette
// tokens only, one radius, no shadow, calm. copy is honest: vocab is
// carried with every message, filter words are redacted client-side.

import { useState, type ReactNode } from "react";
import { BroMark } from "@/app/components/landing/BroMark";
import { Button } from "@/app/components/Button";
import {
  useSettingsPrefs,
  cssVarsFor,
  redactFilter,
  bubbleDisabledForSkin,
  DEFAULT_PREFS,
  TONES,
  SKINS,
  type ToneKey,
} from "../_shell/useSettingsPrefs";

function Field({
  eyebrow,
  line,
  children,
}: {
  eyebrow: string;
  line: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <div className="bro-label">{eyebrow}</div>
        <p className="mt-1.5 text-sm text-soft">{line}</p>
      </div>
      {children}
    </section>
  );
}

function Swatches({
  value,
  onPick,
  disabled,
}: {
  value: ToneKey;
  onPick: (t: ToneKey) => void;
  disabled?: (t: ToneKey) => boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {TONES.map((t) => {
        const off = disabled?.(t.key) ?? false;
        return (
          <button
            key={t.key}
            type="button"
            title={off ? `${t.label} (matches your chat skin)` : t.label}
            aria-label={t.label}
            aria-disabled={off}
            disabled={off}
            onClick={() => {
              if (!off) onPick(t.key);
            }}
            style={{ backgroundColor: t.varRef }}
            className={`h-8 w-8 rounded-bro transition-transform duration-200 ease-[var(--ease-bro)] ${
              off
                ? "cursor-not-allowed opacity-25 ring-1 ring-line"
                : value === t.key
                  ? "ring-2 ring-accent ring-offset-2 ring-offset-bg hover:scale-105"
                  : "ring-1 ring-line hover:scale-105"
            }`}
          />
        );
      })}
    </div>
  );
}

function Tags({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [v, setV] = useState("");
  const add = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (!t || items.includes(t)) {
      setV("");
      return;
    }
    onChange([...items, t]);
    setV("");
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-bro border border-line p-2 transition-colors duration-200 ease-[var(--ease-bro)] focus-within:border-soft">
      {items.map((w) => (
        <span
          key={w}
          className="inline-flex items-center gap-1.5 rounded-bro bg-surface px-2.5 py-1 text-xs text-ink"
        >
          {w}
          <button
            type="button"
            aria-label={`remove ${w}`}
            onClick={() => onChange(items.filter((x) => x !== w))}
            className="text-soft transition-colors hover:text-ink"
          >
            ✕
          </button>
        </span>
      ))}
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(v);
          } else if (e.key === "Backspace" && !v && items.length) {
            onChange(items.slice(0, -1));
          }
        }}
        placeholder={items.length ? "" : placeholder}
        className="min-w-[90px] flex-1 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-soft"
      />
    </div>
  );
}

export function SettingsForm() {
  const [prefs, setPrefs] = useSettingsPrefs();
  const set = (patch: Partial<typeof prefs>) =>
    setPrefs((p) => ({ ...p, ...patch }));

  const sample = redactFilter(
    "bet, and tell them to relax",
    prefs.filters,
  );

  return (
    <div
      data-lenis-prevent
      className="h-full overflow-y-auto"
    >
      <div className="mx-auto grid max-w-4xl gap-12 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-10">
          <Field
            eyebrow="bro's mark"
            line="the color of bro everywhere in the app."
          >
            <Swatches
              value={prefs.icon}
              onPick={(icon) => set({ icon })}
            />
          </Field>

          <Field
            eyebrow="chat skin"
            line="the surface bro talks on."
          >
            <div className="flex flex-wrap gap-2.5">
              {SKINS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => set({ skin: s.key })}
                  className={`flex items-center gap-2 rounded-bro border px-3 py-2 text-sm transition-colors duration-200 ease-[var(--ease-bro)] ${
                    prefs.skin === s.key
                      ? "border-accent text-ink"
                      : "border-line text-soft hover:text-ink"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-bro ring-1 ring-line"
                    style={{ backgroundColor: s.canvas }}
                  />
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <Field
            eyebrow="your bubble"
            line="the one color that is yours. bro's words and yours stay clear automatically, ink or cream, whichever reads."
          >
            <Swatches
              value={prefs.userBubble}
              onPick={(userBubble) => set({ userBubble })}
              disabled={(t) => bubbleDisabledForSkin(t, prefs.skin)}
            />
            <p className="text-xs text-soft">
              a swatch dims when it matches your chat skin, so your
              bubble never disappears into the canvas.
            </p>
          </Field>

          <Field
            eyebrow="custom vocabulary"
            line="the words and names that are yours. bro carries these with every message."
          >
            <Tags
              items={prefs.vocab}
              onChange={(vocab) => set({ vocab })}
              placeholder="add a word, press enter"
            />
          </Field>

          <Field
            eyebrow="filtered words"
            line="redacted from your messages client-side, before anything is sent."
          >
            <Tags
              items={prefs.filters}
              onChange={(filters) => set({ filters })}
              placeholder="add a word, press enter"
            />
          </Field>

          <div>
            <Button
              variant="ghost"
              onClick={() => setPrefs(DEFAULT_PREFS)}
            >
              reset to defaults
            </Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-0 lg:self-start">
          <div className="bro-label mb-3">live preview</div>
          <div
            style={cssVarsFor(prefs)}
            className="flex flex-col gap-4 rounded-bro border border-line p-5"
          >
            <div
              className="flex flex-col gap-4 rounded-bro p-4"
              style={{ background: "var(--chat-canvas)" }}
            >
              <div className="flex items-center gap-2">
                <BroMark className="h-6 w-6" />
                <span className="text-[11px] text-soft">bro</span>
              </div>
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: "var(--chat-bro-text)" }}
              >
                tracked. i&rsquo;ll ping you the moment $opal sets up.
              </p>
              <div className="flex justify-end">
                <div
                  className="max-w-[85%] rounded-bro px-3.5 py-2 text-[15px] leading-relaxed"
                  style={{
                    background: "var(--chat-user-bubble)",
                    color: "var(--chat-user-text)",
                  }}
                >
                  {sample}
                </div>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-soft">
              {prefs.filters.length
                ? "filtered words show as a redaction, before send."
                : "add filtered words to see them redacted here."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
