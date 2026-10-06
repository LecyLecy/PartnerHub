"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useInView, useReducedMotion } from "../motion";
import styles from "./components.module.css";

/**
 * Endless scroller. It runs only while on screen and while the tab is visible, pauses on hover and focus,
 * and becomes a static wrapped list under reduced motion. The duplicate group is hidden from assistive technology.
 */
export function Marquee({ children, direction = "horizontal", reverse = false, duration = 40, gap, label, className = "" }: { children: ReactNode; direction?: "horizontal" | "vertical"; reverse?: boolean; duration?: number; gap?: string; label?: string; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    const update = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const style = { "--marquee-duration": `${duration}s`, ...(gap ? { "--marquee-gap": gap } : {}) } as CSSProperties;
  return <div ref={ref} className={`${styles.marquee} ${direction === "vertical" ? styles.marqueeVertical : ""} ${className}`} data-running={inView && tabVisible && !reduced} data-reverse={reverse} data-static={reduced} style={style} role="group" aria-label={label}>
    <div className={styles.track}>
      <div className={styles.group}>{children}</div>
      <div className={styles.group} aria-hidden="true" inert>{children}</div>
    </div>
  </div>;
}
