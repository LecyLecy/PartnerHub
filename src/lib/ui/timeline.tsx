import type { ReactNode } from "react";
import styles from "./components.module.css";

export type TimelineItem = { key: string; title: string; detail?: ReactNode; tone?: "success" | "active" | "neutral"; added?: boolean };

export function Timeline({ items, label }: { items: readonly TimelineItem[]; label: string }) {
  return <ol className={styles.timeline} aria-label={label}>{items.map((item) => <li key={item.key} data-added={item.added}>
    <span className={styles.dot} data-tone={item.tone ?? "neutral"} aria-hidden="true" />
    <div><h3>{item.title}</h3>{item.detail && <p>{item.detail}</p>}</div>
  </li>)}</ol>;
}
