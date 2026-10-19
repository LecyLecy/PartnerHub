"use client";
import { useEffect, useId, useRef, useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { exportTime } from "@/lib/export";
import { useResource } from "@/lib/use-resource";
import { Badge, Loading, Notice, uiStyles } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import { getMyRegistration } from "./services/registration-service";
import { statusLabel, statusTone } from "./registration-status";
import styles from "./organizer-registration.module.css";

export function RegistrationReceipt({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return <>
    <button type="button" className={uiStyles.secondary} aria-haspopup="dialog" aria-label={`Detail pendaftaran ${title}`} onClick={() => setOpen(true)}>Detail pendaftaran</button>
    <dialog ref={dialog} className={styles.reviewDialog} aria-labelledby={heading} onClose={() => setOpen(false)} onClick={event => { if (event.target === dialog.current) setOpen(false); }}>
      {open && <div className={styles.reviewBody}>
        <div className={styles.reviewHead}><h2 id={heading}>Detail pendaftaran</h2><button className={styles.reviewClose} type="button" aria-label="Tutup detail pendaftaran" onClick={() => setOpen(false)}><Icon name="close" /></button></div>
        <Receipt id={id} />
      </div>}
    </dialog>
  </>;
}
function Receipt({ id }: { id: string }) {
  const resource = useResource(id, getMyRegistration);
  if (resource.status === "loading") return <Loading>Memuat detail pendaftaran…</Loading>;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button onClick={resource.reload}>Coba lagi</button></Notice>;
  const item = resource.data;
  if (!item) return null;
  return <>
    <p><strong>{item.event.title}</strong></p>
    <p className={styles.reviewMeta}><Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge><span>{item.ticketReference}</span><span>Daftar {exportTime(item.createdAt)}</span></p>
    {item.note && <p>Catatan penyelenggara: {item.note}</p>}
    {!item.answers.length && <p>Tidak ada jawaban tambahan yang tersimpan.</p>}
    <dl className={styles.reviewFacts}>{item.answers.filter(answer => answer.type !== "image").map(answer => <div key={answer.fieldId}><dt>{answer.label}</dt><dd>{answer.value}</dd></div>)}</dl>
    {item.answers.filter(answer => answer.type === "image").map(answer => <figure key={answer.fieldId} className={styles.proof}>
      {/* Proofs stay in the scoped receipt, never public event pages. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={answer.value} alt={answer.label} />
      <figcaption>{answer.label}</figcaption>
    </figure>)}
  </>;
}
