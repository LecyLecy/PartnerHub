import type { Session } from "@/contracts/account";

const allowedNext = /^\/(dashboard|events|settings|me|committee|organizer|sponsor|account)(\/|$)/;

export function safeDestination(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/dashboard";
  try {
    const url = new URL(value, "https://partnerhub.invalid");
    if (url.origin !== "https://partnerhub.invalid" || !allowedNext.test(url.pathname)) return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/dashboard"; }
}

const roleHome = { user: "/me", organizer: "/organizer", sponsor: "/sponsor" } as const;
const roleAreas = { user: ["/me", "/committee"], organizer: ["/organizer", "/events"], sponsor: ["/sponsor"] } as const;

/** Where a session belongs right now: verification, onboarding, review status, or the role dashboard. */
export function homeFor(session: Session | null): string {
  if (!session) return "/login";
  if (!session.emailVerified) return "/verify-email";
  if (!session.onboardingComplete) return "/onboarding";
  if (session.account.status !== "active") return "/account/verification";
  return roleHome[session.account.role];
}

const inArea = (path: string, prefixes: readonly string[]) => prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

/** Frontend route guard rule. Accounts under review may only see their status page and profile settings. */
export function canAccess(session: Session, path: string): boolean {
  const name = path.split(/[?#]/)[0];
  if (inArea(name, ["/settings"])) return true;
  if (session.account.status !== "active") return inArea(name, ["/account/verification"]);
  return inArea(name, roleAreas[session.account.role]);
}

export function destinationAfterAuth(session: Session, next?: string | null): string {
  const home = homeFor(session);
  if (home === "/verify-email" || home === "/onboarding") return next ? `${home}?next=${encodeURIComponent(safeDestination(next))}` : home;
  const target = next ? safeDestination(next) : null;
  return target && !target.startsWith("/dashboard") && canAccess(session, target) ? target : home;
}

export const roleLabel = { user: "Peserta / Calon Panitia", organizer: "Penyelenggara", sponsor: "Sponsor" } as const;
