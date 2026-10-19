"use client";

import Link from "next/link";
import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import styles from "../ui.module.css";

type HeaderBack = { target: HTMLElement | null; setTarget: Dispatch<SetStateAction<HTMLElement | null>> };
const HeaderBackContext = createContext<HeaderBack | null>(null);

/** Preserve each page's explicit parent destination while rendering its link in the shared header. */
export function HeaderBackProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  return <HeaderBackContext.Provider value={{ target, setTarget }}>{children}</HeaderBackContext.Provider>;
}

export function HeaderBackSlot() {
  const context = useContext(HeaderBackContext);
  if (!context) throw new Error("HeaderBackSlot requires HeaderBackProvider");
  const { setTarget } = context;
  return <span ref={setTarget} className={styles.headerBackSlot} data-header-back />;
}

export function BackLink({ href, children = "Kembali" }: { href: string; children?: ReactNode }) {
  const context = useContext(HeaderBackContext);
  if (!context) throw new Error("BackLink requires HeaderBackProvider");
  const label = typeof children === "string" && children !== "Kembali" ? `Kembali ke ${children}` : "Kembali";
  return context.target ? createPortal(
    <Link className={styles.back} href={href} aria-label={label} title={label}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
    </Link>,
    context.target,
  ) : null;
}
