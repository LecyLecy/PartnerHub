"use client";
import { useEffect, useState } from "react";
export function useResource<T>(key: string, load: (key: string, signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; status: "loading" | "success" | "error"; data: T | null; error: unknown }>({ key, status: "loading", data: null, error: null });
  useEffect(() => {
    const controller = new AbortController();
    load(key, controller.signal).then((data) => { if (!controller.signal.aborted) setState({ key, status: "success", data, error: null }); }).catch((error) => { if (!controller.signal.aborted) setState({ key, status: "error", data: null, error }); });
    return () => controller.abort();
  }, [key, load, attempt]);
  return { ...(state.key === key ? state : { key, status: "loading" as const, data: null, error: null }), reload: () => { setState({ key, status: "loading", data: null, error: null }); setAttempt((value) => value + 1); } };
}
