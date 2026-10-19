"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "./primitives";
import styles from "./confirmation.module.css";

type Confirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
};
type Confirm = (options: Confirmation) => Promise<boolean>;
const ConfirmationContext = createContext<Confirm | null>(null);

export function useConfirm() {
  const confirm = useContext(ConfirmationContext);
  if (!confirm) throw new Error("useConfirm requires ConfirmationProvider");
  return confirm;
}

/** Shared application confirmation. Dismissal always means cancel, never consent. */
export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<Confirmation | null>(null);
  const resolver = useRef<((accepted: boolean) => void) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const confirm = useCallback<Confirm>((next) => {
    // Ignore repeated requests while a decision is pending; never execute two actions on one consent.
    if (resolver.current) return Promise.resolve(false);
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(next);
    });
  }, []);
  const finish = useCallback((accepted: boolean) => {
    const resolve = resolver.current;
    if (!resolve) return;
    resolver.current = null;
    dialog.current?.close();
    setOptions(null);
    if (opener.current?.isConnected) opener.current.focus();
    resolve(accepted);
  }, []);
  useEffect(() => {
    if (!options) return;
    dialog.current?.showModal();
    cancel.current?.focus();
  }, [options]);
  useEffect(() => () => {
    resolver.current?.(false);
    resolver.current = null;
  }, []);
  return <ConfirmationContext.Provider value={confirm}>
    {children}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); finish(false); }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      {options && <>
        <div className={styles.content}>
          <h2 id={titleId}>{options.title}</h2>
          <p id={descriptionId}>{options.description}</p>
        </div>
        <div className={styles.actions}>
          <button ref={cancel} className={styles.cancel} type="button" onClick={() => finish(false)}>Batal</button>
          <Button variant={options.destructive ? "destructive" : "primary"} onClick={() => finish(true)}>{options.confirmLabel}</Button>
        </div>
      </>}
    </dialog>
  </ConfirmationContext.Provider>;
}
