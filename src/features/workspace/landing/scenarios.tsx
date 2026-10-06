"use client";
import { useReducedMotion } from "@/lib/motion";
import { Marquee } from "@/lib/ui";
import { scenarios } from "./landing-data";
import styles from "../landing.module.css";

const card = (item: (typeof scenarios)[number]) => <article key={item.title} className={styles.scenario}><h3>{item.title}</h3><p>{item.body}</p></article>;

/**
 * Three slow rails moving in alternating directions. The rails repeat one list, so only the first is exposed to
 * assistive technology. Under reduced motion the list is a plain grid instead of a scroller.
 */
export function Scenarios() {
  const reduced = useReducedMotion();
  if (reduced) return <div className={styles.scenarioGrid}>{scenarios.map(card)}</div>;
  return <div className={styles.rails3}>
    {[0, 1, 2].map((rail) => {
      const ordered = [...scenarios.slice(rail * 2), ...scenarios.slice(0, rail * 2)];
      const content = <Marquee direction="vertical" reverse={rail === 1} duration={60 + rail * 8} gap="1rem" className={styles.scenarioRail} label={rail === 0 ? "Skenario penggunaan" : undefined}>{ordered.map(card)}</Marquee>;
      return rail === 0 ? <div key={rail}>{content}</div> : <div key={rail} className={rail === 2 ? styles.railLast : undefined} aria-hidden="true" inert>{content}</div>;
    })}
  </div>;
}
