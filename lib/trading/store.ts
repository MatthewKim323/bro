// the sim wallet ledger, SERVER-SIDE now. it used to live in the
// browser's localStorage, but jabby is a separate daemon and cannot
// reach that. moving it to a server file makes it ONE shared wallet:
// the desk UI and jabby write through the same engine + guardrails.
// "one engine, two front doors" (BRO_PLAN.md §8.6 / §10.4).
//
// still paper: a JSON file of a seed number + fills. no keypair, no
// RPC, no real funds. lives outside the repo (~/.bro), never deployed.

import { homedir } from "os";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { join } from "path";
import { EMPTY_LEDGER, type Ledger } from "./engine";

const DIR = process.env.BRO_DATA_DIR || join(homedir(), ".bro");
const FILE = join(DIR, "ledger.json");

export async function readLedger(): Promise<Ledger> {
  try {
    const raw = await readFile(FILE, "utf8");
    const l = JSON.parse(raw) as Ledger;
    if (typeof l?.seedSol === "number" && Array.isArray(l?.fills)) return l;
    return EMPTY_LEDGER;
  } catch {
    return EMPTY_LEDGER;
  }
}

async function persist(l: Ledger): Promise<void> {
  await mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(l), "utf8");
  await rename(tmp, FILE); // atomic-ish: no half-written ledger
}

// single-process in-memory lock so a UI order and a jabby order cannot
// interleave a read-modify-write and lose one. low volume, single user;
// this is enough.
let chain: Promise<unknown> = Promise.resolve();

export function withLedger<T>(
  fn: (l: Ledger) => Promise<{ next?: Ledger; result: T }>,
): Promise<T> {
  const run = chain.then(async () => {
    const l = await readLedger();
    const { next, result } = await fn(l);
    if (next) await persist(next);
    return result;
  });
  // keep the chain alive even if this op rejects
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function resetLedger(): Promise<Ledger> {
  return withLedger(async () => ({
    next: EMPTY_LEDGER,
    result: EMPTY_LEDGER,
  }));
}
