"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Icon, type IconName } from "./icons";
import styles from "./account-menu.module.css";

/**
 * Profile button with a chevron. Settings and sign out stay hidden until it is opened.
 * `placement="up"` opens above the button (sidebar, bottom of the screen); `"down"` opens below it (header).
 */
export function AccountMenu({ name, detail, placement, busy, onLeave, onNavigate, items = [] }: {
  name: string; detail?: string; placement: "up" | "down"; busy: boolean; onLeave: () => void; onNavigate?: () => void; items?: readonly { href: string; label: string; icon: IconName }[];
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId().replace(/:/g, "");
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div ref={root} className={styles.root} data-placement={placement} data-open={open}>
    <button ref={button} type="button" className={styles.trigger} aria-expanded={open} aria-controls={panelId} aria-label={`Menu akun, ${name}`} onClick={() => setOpen(!open)}>
      <span className={styles.avatar} aria-hidden="true"><Icon name="user" /></span>
      <span className={`${styles.text} accountText`}><strong>{name}</strong>{detail && <span>{detail}</span>}</span>
      <span className={styles.chevron} aria-hidden="true"><Icon name="chevron" size={18} /></span>
    </button>
    {open && <div id={panelId} className={styles.panel} role="group" aria-label="Akun">
      {items.map((item) => <Link key={item.href} href={item.href} onClick={() => { setOpen(false); onNavigate?.(); }}><Icon name={item.icon} size={18} />{item.label}</Link>)}
      <Link href="/settings" aria-label="Profil & pengaturan" onClick={() => { setOpen(false); onNavigate?.(); }}><Icon name="settings" size={18} />Pengaturan</Link>
      <button type="button" onClick={() => { setOpen(false); onLeave(); }} disabled={busy}><Icon name="logout" size={18} />{busy ? "Keluar…" : "Keluar"}</button>
    </div>}
  </div>;
}
