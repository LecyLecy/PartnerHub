"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Session, SessionApi } from "@/contracts/account";
import { errorMessage } from "./api-client";
import { canAccess, destinationAfterAuth, homeFor, safeDestination } from "./navigation";

type SessionState = { status: "checking" | "guest" | "authenticated" | "error"; session: Session | null; error: string; expired: boolean; loggedOut?: boolean };
type SessionContext = SessionState & { refresh: () => Promise<void>; accept: (session: Session) => void; logout: () => Promise<void> };
const Context = createContext<SessionContext | null>(null);

export function SessionProvider({ api, children }: { api: SessionApi; children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "checking", session: null, error: "", expired: false });
  const generation = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setState((previous) => ({ ...previous, status: previous.session ? previous.status : "checking", error: "" }));
    try {
      const session = await api.getSession();
      if (current === generation.current) setState((previous) => ({ status: session ? "authenticated" : "guest", session, error: "", expired: !session && previous.expired, loggedOut: !session && previous.loggedOut }));
    } catch (error) { if (current === generation.current) setState((previous) => ({ ...previous, status: previous.session && new Date(previous.session.expiresAt).getTime() > Date.now() ? "authenticated" : "error", error: errorMessage(error) })); }
  }, [api]);
  useEffect(() => {
    const requests = generation;
    const expire = () => { requests.current++; setState({ status: "guest", session: null, error: "", expired: true }); channel.current?.postMessage("session-changed"); };
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = setTimeout(() => void refresh(), 0);
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel("partnerhub-session");
      channel.current.onmessage = () => void refresh();
    }
    window.addEventListener("partnerhub:session-expired", expire);
    document.addEventListener("visibilitychange", visible);
    return () => { clearTimeout(timer); requests.current++; channel.current?.close(); window.removeEventListener("partnerhub:session-expired", expire); document.removeEventListener("visibilitychange", visible); };
  }, [refresh]);
  useEffect(() => {
    if (!state.session || state.status !== "authenticated") return;
    const remaining = new Date(state.session.expiresAt).getTime() - Date.now();
    const timer = setTimeout(() => void refresh(), Math.max(0, Math.min(remaining, 2147483647)));
    return () => clearTimeout(timer);
  }, [state.session, state.status, refresh]);
  function accept(session: Session) { generation.current++; setState({ status: "authenticated", session, error: "", expired: false }); channel.current?.postMessage("session-changed"); }
  async function logout() { await api.logout(); generation.current++; setState({ status: "guest", session: null, error: "", expired: false, loggedOut: true }); channel.current?.postMessage("session-changed"); }
  return <Context.Provider value={{ ...state, refresh, accept, logout }}>{children}</Context.Provider>;
}

export function useSession() { const value = useContext(Context); if (!value) throw new Error("SessionProvider is required"); return value; }

/**
 * Frontend route guard. It only steers navigation (login, verification, onboarding, role area).
 * Every API must still authorize independently.
 */
export function SessionGate({ children, guest = false, allowOnboarding = false, allowUnverified = false }: { children: ReactNode; guest?: boolean; allowOnboarding?: boolean; allowUnverified?: boolean }) {
  const auth = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const here = safeDestination(`${pathname}${search.size ? `?${search}` : ""}`);
  let destination: string | null = null;
  if (auth.status === "authenticated") {
    const session = auth.session!;
    if (guest) destination = destinationAfterAuth(session, search.get("next"));
    else if (!session.emailVerified && !allowUnverified) destination = `/verify-email?next=${encodeURIComponent(here)}`;
    else if (session.emailVerified && !session.onboardingComplete && !allowOnboarding) destination = `/onboarding?next=${encodeURIComponent(here)}`;
    else if (!allowOnboarding && !allowUnverified && session.emailVerified && session.onboardingComplete && !canAccess(session, pathname)) destination = homeFor(session);
  } else if (auth.status === "guest" && !guest && !auth.loggedOut) {
    destination = `/login?next=${encodeURIComponent(here)}${auth.expired ? "&reason=expired" : ""}`;
  }
  // After an explicit logout the sign-out button performs one full-page redirect to /login?reason=logout.
  // Redirecting here as well would race with it, so the gate only shows a placeholder meanwhile.
  const leaving = auth.status === "guest" && !guest && Boolean(auth.loggedOut);
  useEffect(() => { if (destination) router.replace(destination); }, [destination, router]);
  if (auth.status === "checking" || destination || leaving) return <div className="route-state" role="status">Memeriksa akses…</div>;
  if (auth.status === "error" && !guest) return <div className="route-state"><h1>Akses belum dapat diperiksa.</h1><p role="alert">{auth.error}</p><button onClick={() => void auth.refresh()}>Coba lagi</button><a href="/login">Ke halaman masuk</a></div>;
  return <>{auth.status === "error" && guest && <div className="notice" role="alert">Sesi belum dapat diperiksa. {auth.error} <button onClick={() => void auth.refresh()}>Periksa lagi</button></div>}{children}</>;
}
