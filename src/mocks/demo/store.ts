import { seed, type DemoDb } from "./seed";
import { upgradeFixtures } from "./upgrade-fixtures";

const key = "partnerhub:demo:v3";
let cache: DemoDb | null = null;
/** Passwords of accounts created through Register in this demo session. Memory only, never persisted. */
export const sessionPasswords = new Map<string, string>();

export function loadDb(): DemoDb {
  if (cache) return cache;
  try {
    const raw = sessionStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as DemoDb) : null;
    if (parsed && parsed.version === 3 && Array.isArray(parsed.accounts) && Array.isArray(parsed.openings)) {
      // Backfill prices for existing demo tabs without replacing saved organizer forms or event data.
      const defaults = seed();
      for (const [id, form] of Object.entries(defaults.forms)) {
        if (!parsed.forms[id] && parsed.events.some(event => event.id === id)) parsed.forms[id] = form;
      }
      for (const account of defaults.accounts) {
        if (!parsed.accounts.some(item => item.id === account.id)) parsed.accounts.push(account);
      }
      parsed.eventMatchingFields = { ...defaults.eventMatchingFields, ...parsed.eventMatchingFields };
      parsed.sponsorMatchingProfiles = { ...defaults.sponsorMatchingProfiles, ...parsed.sponsorMatchingProfiles };
      upgradeFixtures(parsed, defaults);
      cache = parsed; return cache;
    }
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
