"use client";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

const query = "(prefers-reduced-motion: reduce)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
/** True when the visitor asked for reduced motion. Animated content must have a static equivalent. */
export const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);

/** Reports whether an element intersects the viewport. With `once`, stays true after the first hit. */
export function useInView<T extends Element>({ once = false, margin = "0px" }: { once?: boolean; margin?: string } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      const timer = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting && once) observer.disconnect();
    }, { rootMargin: margin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [once, margin]);
  return [ref, inView] as const;
}

type Tag = "div" | "section" | "article" | "li" | "p" | "h2" | "h3" | "ul";

/** True while the tab is in the foreground. Loops pause when it is not. */
export function useTabVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

/**
 * Calls `onTick` every `intervalMs` while the returned ref's element is on screen and the tab is visible.
 * Never ticks under reduced motion, so callers must render a meaningful static state.
 */
export function useTicker<T extends Element>(intervalMs: number, onTick: () => void, enabled = true) {
  const [ref, inView] = useInView<T>();
  const reduced = useReducedMotion();
  const tabVisible = useTabVisible();
  const latest = useRef(onTick);
  useEffect(() => { latest.current = onTick; });
  useEffect(() => {
    if (!enabled || !inView || !tabVisible || reduced) return;
    const id = setInterval(() => latest.current(), intervalMs);
    return () => clearInterval(id);
  }, [enabled, inView, tabVisible, reduced, intervalMs]);
  return ref;
}

/**
 * Fades an element up the first time it scrolls into view. Elements already on screen at mount are left alone
 * unless `always` is set (for example a hero preview that should still animate in).
 */
export function Reveal({ as = "div", delay = 0, always = false, className, children }: { as?: Tag; delay?: number; always?: boolean; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Layout effect so the hidden state is applied before first paint; otherwise content would flash, vanish, then fade in.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || reduced || !("IntersectionObserver" in window)) return;
    if (!always && element.getBoundingClientRect().top < window.innerHeight) return;
    element.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.reveal = "shown";
      observer.disconnect();
    }, { rootMargin: "0px 0px -10% 0px" });
    observer.observe(element);
    return () => { observer.disconnect(); delete element.dataset.reveal; };
  }, [reduced, always]);
  // Every supported tag accepts the same ref and style props; the cast keeps the union from fighting the ref type.
  const Component = as as "div";
  return <Component ref={ref} className={className} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>{children}</Component>;
}

/** Eases a number from 0 to `target` once `active` is true. Returns the target directly under reduced motion. */
export function useCountUp(target: number, active: boolean, duration = 900) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced, target, duration]);
  return reduced ? target : value;
}

const idNumber = new Intl.NumberFormat("id-ID");

/** Number that counts up when first seen. Assistive technology reads the final value only. */
export function CountUp({ value, duration, format = idNumber.format }: { value: number; duration?: number; format?: (value: number) => string }) {
  const [ref, inView] = useInView<HTMLSpanElement>({ once: true });
  const shown = useCountUp(value, inView, duration);
  return <span ref={ref}><span aria-hidden="true">{format(shown)}</span><span className="sr-only">{format(value)}</span></span>;
}
