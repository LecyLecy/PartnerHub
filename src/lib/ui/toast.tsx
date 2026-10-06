"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./components.module.css";

type Toast = { id: number; message: string; tone: "info" | "error" };
type Push = (message: string, tone?: Toast["tone"]) => void;
const ToastContext = createContext<Push>(() => undefined);

/** Short feedback for an action that just finished. Auto-dismisses after 5 seconds; errors stay for 8. */
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);
  const push = useCallback<Push>((message, tone = "info") => {
    const id = ++counter.current;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    timers.current.set(id, setTimeout(() => dismiss(id), tone === "error" ? 8000 : 5000));
  }, [dismiss]);
  useEffect(() => { const map = timers.current; return () => map.forEach(clearTimeout); }, []);
  const value = useMemo(() => push, [push]);
  return <ToastContext.Provider value={value}>
    {children}
    <div className={styles.toasts} role="region" aria-label="Pemberitahuan">
      {toasts.map((item) => <div key={item.id} className={styles.toast} data-tone={item.tone} role={item.tone === "error" ? "alert" : "status"}><p>{item.message}</p><button type="button" onClick={() => dismiss(item.id)}>Tutup</button></div>)}
    </div>
  </ToastContext.Provider>;
}
