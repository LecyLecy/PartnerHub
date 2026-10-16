import { seed, type DemoDb } from "./seed";

const key = "partnerhub:demo:v3";
let cache: DemoDb | null = null;
/** Passwords of accounts created through Register in this demo session. Memory only, never persisted. */
export const sessionPasswords = new Map<string, string>();

export function loadDb(): DemoDb {
  if (cache) return cache;
  try {
    const raw = sessionStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as DemoDb) : null;
    if (parsed && parsed.version === 3 && Array.isArray(parsed.accounts) && Array.isArray(parsed.openings)) { cache = parsed; return cache; }
  } catch { /* A broken or blocked store falls back to fresh seed data. */ }
  cache = seed();
  return cache;
}

export function saveDb(): void {
  if (!cache) return;
  try { sessionStorage.setItem(key, JSON.stringify(cache)); }
  catch { /* Quota or blocked storage: the demo keeps working from memory for this page load. */ }
}

/** Drops every change made in this demo session and restores the seeded data. The person is signed out. */
export function resetDb(): void {
  cache = null;
  sessionPasswords.clear();
  try { sessionStorage.removeItem(key); } catch { /* Nothing to remove. */ }
}
