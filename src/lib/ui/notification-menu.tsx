"use client";
import { useEffect, useId, useRef, useState } from "react";
import { errorMessage } from "../api-client";
import { listNotifications } from "../notification-service";
import { useResource } from "../use-resource";
import { Icon } from "./icons";
import { Loading, Notice } from "./primitives";
import styles from "./role-shell.module.css";

const when = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long" });

/** Bell with a short popover of the latest notifications. Uses the same service as the dashboard list. */
export function NotificationMenu() {
  const resource = useResource("notifications", listNotifications);
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
  const unread = resource.data?.filter((item) => !item.read).length ?? 0;
  return <div ref={root} className={styles.menu}>
    <button ref={button} type="button" className={styles.iconButton} aria-label={unread ? `Notifikasi, ${unread} baru` : "Notifikasi"} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
      <Icon name="bell" />{unread > 0 && <span className={styles.unreadDot} aria-hidden="true" />}
    </button>
    {open && <div id={panelId} className={styles.popover} role="region" aria-label="Notifikasi terbaru">
      {resource.status === "loading" ? <Loading>Memuat notifikasi…</Loading>
        : resource.status === "error" ? <Notice error>{errorMessage(resource.error)} <button type="button" className={styles.inlineButton} onClick={resource.reload}>Muat ulang</button></Notice>
        : !resource.data?.length ? <p className={styles.popoverEmpty}>Belum ada notifikasi.</p>
        : <ul className={styles.popoverList}>{resource.data.slice(0, 5).map((item) => <li key={item.id}><strong>{item.title}{!item.read && <span className={styles.newTag}>Baru</span>}</strong><p>{item.body}</p><time dateTime={item.createdAt}>{when(item.createdAt)}</time></li>)}</ul>}
    </div>}
  </div>;
}
