"use client";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { Icon, type IconName } from "./icons";
import styles from "./command-palette.module.css";

export type PaletteItem = { id: string; label: string; group: string; icon?: IconName; href?: string; run?: () => void; keywords?: string };

/** "⌘K" on Apple platforms, "Ctrl K" elsewhere. The server and first client render use "Ctrl K". */
export function useShortcutLabel() {
  return useSyncExternalStore(() => () => undefined, () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"), () => "Ctrl K");
}

/** Modal command list built on the native dialog element, so focus trapping, Escape, and focus return come from the browser. */
export function CommandPalette({ open, onOpenChange, items }: { open: boolean; onOpenChange: (open: boolean) => void; items: readonly PaletteItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  return <dialog ref={dialog} className={styles.dialog} aria-label="Pencarian cepat" onClose={() => onOpenChange(false)} onClick={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}>
    {open && <Panel items={items} onClose={() => onOpenChange(false)} />}
  </dialog>;
}

function Panel({ items, onClose }: { items: readonly PaletteItem[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const base = useId().replace(/:/g, "");
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? items.filter((item) => `${item.label} ${item.keywords ?? ""} ${item.group}`.toLowerCase().includes(needle)) : items;
  }, [items, query]);
  const current = Math.min(active, results.length - 1);
  useEffect(() => { document.getElementById(`${base}-${current}`)?.scrollIntoView({ block: "nearest" }); }, [base, current]);
  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((current + 1) % results.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((current - 1 + results.length) % results.length); }
    else if (event.key === "Enter") { event.preventDefault(); document.getElementById(`${base}-${current}`)?.click(); }
  }
  return <div className={styles.panel}>
    <div className={styles.search}>
      <Icon name="search" size={18} />
      <input className={styles.input} type="text" role="combobox" aria-expanded="true" aria-controls={`${base}-list`} aria-activedescendant={results.length ? `${base}-${current}` : undefined} aria-label="Cari halaman atau aksi" placeholder="Cari halaman atau aksi" autoComplete="off" spellCheck={false} value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={onKey} />
    </div>
    <div id={`${base}-list`} role="listbox" aria-label="Hasil" className={styles.list}>
      {results.map((item, index) => {
        const body = <>{item.icon && <Icon name={item.icon} size={18} />}<span className={styles.label}>{item.label}</span><span className={styles.group}>{item.group}</span></>;
        const shared = { id: `${base}-${index}`, role: "option" as const, "aria-selected": index === current, className: styles.option, onMouseMove: () => setActive(index) };
        return item.href
          ? <Link key={item.id} href={item.href} {...shared} onClick={onClose}>{body}</Link>
          : <button key={item.id} type="button" {...shared} onClick={() => { onClose(); item.run?.(); }}>{body}</button>;
      })}
    </div>
    {!results.length && <p className={styles.empty} role="status">Tidak ada hasil untuk “{query.trim()}”.</p>}
    <p className={styles.help}>↑ ↓ untuk memilih, Enter untuk membuka, Esc untuk menutup.</p>
  </div>;
}
