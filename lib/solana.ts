// real Solana mainnet read. SERVER ONLY.
//
// one JSON-RPC call (getEpochInfo) to a public Solana RPC. no key, no
// wallet, no signing: a genuine on-chain read, surfaced as a live
// "powered by Solana" pulse on the landing. hella minimal, fully real.
// the product narrative (bro paper-trades Solana memecoins) is the
// reason Solana is in the stack; this is the honest live proof of it.

const RPC =
  process.env.SOLANA_RPC_URL?.replace(/\/$/, "") ||
  "https://api.mainnet-beta.solana.com";

export type SolanaPulse = {
  ok: boolean;
  slot: number | null;
  epoch: number | null;
  /** host only, for display (never leak a keyed RPC url to the client) */
  host: string;
};

export async function getSolanaPulse(): Promise<SolanaPulse> {
  const host = (() => {
    try {
      return new URL(RPC).host;
    } catch {
      return "solana";
    }
  })();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getEpochInfo" }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return { ok: false, slot: null, epoch: null, host };
    const json = (await res.json()) as {
      result?: { absoluteSlot?: number; epoch?: number };
    };
    const r = json?.result;
    return {
      ok: Boolean(r),
      slot: r?.absoluteSlot ?? null,
      epoch: r?.epoch ?? null,
      host,
    };
  } catch {
    return { ok: false, slot: null, epoch: null, host };
  }
}
