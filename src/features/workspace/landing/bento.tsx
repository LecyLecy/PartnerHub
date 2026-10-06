"use client";
import { useState } from "react";
import { useReducedMotion, useTicker } from "@/lib/motion";
import { Badge, Marquee, Timeline, Toggle } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import { applicantNote, feed, flowSteps, journey, modules, noteIdeas, questionIdeas } from "./landing-data";
import styles from "../landing.module.css";

const mod = (value: number, size: number) => ((value % size) + size) % size;

/** New items slide in at the top every few seconds. Runs only while visible; otherwise it shows three fixed items. */
export function ActivityFeed() {
  const [tick, setTick] = useState(2);
  const ref = useTicker<HTMLUListElement>(2600, () => setTick((value) => value + 1));
  return <ul ref={ref} className={styles.feed} aria-label="Contoh aktivitas terbaru">
    {[0, 1, 2].map((offset) => {
      const item = feed[mod(tick - offset, feed.length)];
      return <li key={tick - offset} data-new={offset === 0 && tick > 2}><span className={styles.feedDot} aria-hidden="true" /><div><strong>{item.title}</strong><span>{item.detail}</span></div></li>;
    })}
  </ul>;
}

/** Real switches. Choices live in local state only and are not saved anywhere. */
export function ModuleToggles() {
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(modules.map((item) => [item.key, item.on])));
  return <div>
    <ul className={styles.toggles}>{modules.map((item) => <li key={item.key}>
      <div><strong>{item.label}</strong><span>{item.note}</span></div>
      <Toggle label={item.label} checked={on[item.key]} onChange={(checked) => setOn({ ...on, [item.key]: checked })} />
    </li>)}</ul>
    <p className={styles.demoNote}>Contoh interaktif. Pilihan ini tidak disimpan.</p>
  </div>;
}

/** Types the organizer's note to an accepted applicant. Screen readers get the full text once; the typing is decoration. */
export function TypedNote() {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(applicantNote.length);
  const ref = useTicker<HTMLDivElement>(38, () => setCount((value) => (value >= applicantNote.length + 40 ? 0 : value + 1)));
  const text = reduced ? applicantNote : applicantNote.slice(0, count);
  return <div ref={ref} className={styles.note}>
    <div className={styles.noteMeta}><Badge tone="success">Diterima</Badge><span>Catatan untuk pelamar</span></div>
    <p aria-hidden="true">{text}{!reduced && <i className={styles.caret} />}</p>
    <p className="sr-only">{applicantNote}</p>
  </div>;
}

const stateLabel = { done: "Selesai", running: "Berjalan", waiting: "Menunggu" } as const;

/** Steps move from waiting to running to done in turn, then start over. Every state is also written as text. */
export function Workflow() {
  const [step, setStep] = useState(1);
  const ref = useTicker<HTMLOListElement>(1500, () => setStep((value) => (value >= flowSteps.length + 1 ? 0 : value + 1)));
  return <ol ref={ref} className={styles.flow} aria-label="Contoh alur seleksi panitia">
    {flowSteps.map((label, index) => {
      const state = index < step ? "done" : index === step ? "running" : "waiting";
      return <li key={label} data-state={state}>
        <span className={styles.node}>{state === "done" ? <Icon name="check" size={14} /> : index + 1}</span>
        <strong>{label}</strong>
        <span>{stateLabel[state]}</span>
      </li>;
    })}
  </ol>;
}

/** Two vertical rails drifting in opposite directions. */
export function IdeaRails() {
  return <div className={styles.rails}>
    <div><p className={styles.railTitle}>Pertanyaan untuk pelamar</p>
      <Marquee direction="vertical" duration={30} gap="0.75rem" className={styles.rail} label="Contoh pertanyaan untuk pelamar">{questionIdeas.map((text) => <p key={text} className={styles.idea}>{text}</p>)}</Marquee></div>
    <div><p className={styles.railTitle}>Catatan langkah berikutnya</p>
      <Marquee direction="vertical" reverse duration={30} gap="0.75rem" className={styles.rail} label="Contoh catatan langkah berikutnya">{noteIdeas.map((text) => <p key={text} className={styles.idea}>{text}</p>)}</Marquee></div>
  </div>;
}

/** Vertical timeline whose extra entries open with a short animation. */
export function Journey() {
  const [all, setAll] = useState(false);
  const items = journey.slice(0, all ? journey.length : 4).map((item, index) => ({ key: item.key, title: item.title, detail: item.detail, tone: item.tone, added: all && index >= 4 }));
  return <div>
    <Timeline label="Contoh perjalanan sebuah acara" items={items} />
    <button type="button" className={styles.more} aria-expanded={all} onClick={() => setAll(!all)}>{all ? "Tampilkan lebih sedikit" : "Tampilkan lebih banyak"}</button>
  </div>;
}
