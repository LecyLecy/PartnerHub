"use client";
import type { ReactNode } from "react";
import { CountUp } from "../motion";
import styles from "./components.module.css";

export type Stat = { label: string; value: number; suffix?: string };

/** Row of metric cards. Numbers count up when first seen; assistive technology reads the final value. */
export function StatGrid({ items, label = "Ringkasan" }: { items: readonly Stat[]; label?: string }) {
  return <ul className={styles.statGrid} aria-label={label}>
    {items.map((item) => <li key={item.label}><strong><CountUp value={item.value} />{item.suffix}</strong><span>{item.label}</span></li>)}
  </ul>;
}

/** Page opener used by every role dashboard: title, one supporting line, and the primary action. */
export function PageHeader({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className={styles.pageHeader}><div><h1>{title}</h1>{children && <p>{children}</p>}</div>{action && <div className={styles.pageHeaderAction}>{action}</div>}</div>;
}

/** Placeholder cards that keep layout steady while a list loads. The pulse only changes opacity. */
export function SkeletonCards({ label, count = 3 }: { label: string; count?: number }) {
  return <div className={styles.skeletonCards} role="status"><span className="sr-only">{label}</span>
    {Array.from({ length: count }, (_, index) => <div key={index} className={styles.skeletonCard} aria-hidden="true"><span /><span /><span /></div>)}
  </div>;
}

/** Thin capacity bar. Width is a transform so it animates without layout. */
export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  return <span className={styles.meter} role="img" aria-label={label}><i style={{ transform: `scaleX(${ratio})` }} /></span>;
}
