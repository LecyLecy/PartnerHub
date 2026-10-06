"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import styles from "./components.module.css";

export type TabItem = { key: string; label: string };

/** Segmented control with a sliding indicator. The caller renders the panel for `value` inside `TabPanel`. */
export function Tabs({ items, value, onChange, label, idBase }: { items: readonly TabItem[]; value: string; onChange: (key: string) => void; label: string; idBase: string }) {
  const list = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<{ x: number; w: number } | null>(null);
  const measure = () => {
    const active = list.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (active) setGeometry({ x: active.offsetLeft, w: active.offsetWidth });
  };
  useLayoutEffect(measure, [value, items]);
  useEffect(() => {
    const element = list.current;
    if (!element || !("ResizeObserver" in window)) return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.key === value);
    const move = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const target = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + move + items.length) % items.length;
    if (!move && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    onChange(items[target].key);
    list.current?.querySelectorAll<HTMLElement>('[role="tab"]')[target]?.focus();
  }
  return <div ref={list} className={styles.tabs} role="tablist" aria-label={label} onKeyDown={onKey}>
    <span className={styles.indicator} aria-hidden="true" data-ready={geometry !== null} style={geometry ? { "--tab-x": `${geometry.x}px`, "--tab-w": `${geometry.w}px` } as CSSProperties : undefined} />
    {items.map((item) => <button key={item.key} type="button" role="tab" id={`${idBase}-tab-${item.key}`} className={styles.tab} aria-selected={item.key === value} aria-controls={`${idBase}-panel`} tabIndex={item.key === value ? 0 : -1} onClick={() => onChange(item.key)}>{item.label}</button>)}
  </div>;
}

export function TabPanel({ idBase, value, children }: { idBase: string; value: string; children: ReactNode }) {
  return <div key={value} id={`${idBase}-panel`} role="tabpanel" aria-labelledby={`${idBase}-tab-${value}`} className={styles.tabPanel} data-fresh="true" tabIndex={0}>{children}</div>;
}

/** Stable id prefix for a Tabs and TabPanel pair. */
export const useTabsId = () => useId().replace(/:/g, "");
