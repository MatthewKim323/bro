"use client";

// bro's voice. ink on cream, no bubble (it is the room talking, it does
// not need a container). text arrives token by token with no layout
// jump: newlines are preserved, the measure is stable, and a soft caret
// trails the text only while it is still streaming. see BRO_PLAN.md
// §3.6 / §8.1.
//
// it does not own the stream. the chat panel accumulates SSE chunks
// into `text` and flips `streaming` off on done; this just renders the
// current value calmly.

type StreamingTextProps = {
  text: string;
  streaming?: boolean;
};

export function StreamingText({ text, streaming = false }: StreamingTextProps) {
  return (
    <div className="bro-body whitespace-pre-wrap break-words text-[17px] leading-[1.7] text-[var(--chat-bro-text,var(--color-ink))]">
      {text}
      {streaming && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-pulse bg-accent/70"
        />
      )}
    </div>
  );
}
