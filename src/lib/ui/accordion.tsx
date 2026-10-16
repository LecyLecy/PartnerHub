"use client";
import { useId, useState, type ReactNode } from "react";
import styles from "./components.module.css";

export type AccordionItem = { key: string; question: string; answer: ReactNode };

/** One item open at a time. Headings are h3, so place it under an h2. */
export function Accordion({ items }: { items: readonly AccordionItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const base = useId().replace(/:/g, "");
  return <ul className={styles.accordion}>{items.map((item) => {
    const expanded = open === item.key;
    return <li key={item.key}>
      <h3><button type="button" id={`${base}-${item.key}`} className={styles.trigger} aria-expanded={expanded} aria-controls={`${base}-${item.key}-body`} onClick={() => setOpen(expanded ? null : item.key)}>
        {item.question}
        <svg className={styles.chevron} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
      </button></h3>
      <div id={`${base}-${item.key}-body`} role="region" aria-labelledby={`${base}-${item.key}`} className={styles.answer} data-open={expanded} inert={!expanded}><div><p>{item.answer}</p></div></div>
    </li>;
  })}</ul>;
}
