"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "./sponsorship.module.css";
import { Icon } from "@/lib/ui/icons";

/** One list row that is a single button with a right chevron. The details open in a modal dialog. */
export function DetailRow({ title, label, badge, children }: { title: string; label: string; badge: ReactNode; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  const close = () => setOpen(false);
  return <li className={styles.offerRow}>
    <button type="button" className={styles.offerRowButton} aria-haspopup="dialog" aria-label={label} onClick={() => setOpen(true)}>
      <span className={styles.offerRowText}><strong className={styles.offerRowTitle}>{title}</strong>{badge}</span>
      <svg className={styles.offerChevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6" /></svg>
    </button>
    <dialog ref={dialog} className={styles.offerDialog} aria-labelledby={titleId} onClose={close} onClick={(click) => { if (click.target === dialog.current) close(); }}>
      {open && <div className={styles.offerDialogBody}>
        <header className={styles.dialogHeader}><div><h2 id={titleId}>{title}</h2><div className={styles.dialogMeta}>{badge}</div></div><button type="button" className={styles.dialogClose} onClick={close} aria-label="Tutup detail sponsor"><Icon name="close" size={20} /></button></header>
        {children(close)}
      </div>}
    </dialog>
  </li>;
}
