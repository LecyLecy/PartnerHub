"use client";
/* eslint-disable @next/next/no-img-element -- proof images are uploaded data or scoped URLs, not static assets */
import { useEffect, useId, useRef, useState } from "react";
import type { Registrant } from "@/contracts/participation";
import { errorMessage } from "@/lib/api-client";
import { exportTime } from "@/lib/export";
import { TextAreaField } from "@/lib/form/fields";
import { Badge, Notice, uiStyles, useToast } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import { decideRegistrant } from "./services/registration-service";
import { statusLabel, statusTone } from "./registration-status";
import styles from "./organizer-registration.module.css";

/** Modal where the organizer reads the answers and payment proof, then confirms or rejects a pending registrant. */
export function RegistrantReview({ eventId, item, onClose, onChanged }: { eventId: string; item: Registrant; onClose: () => void; onChanged: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);
  const proofs = item.answers.filter((answer) => answer.type === "image");
  const others = item.answers.filter((answer) => answer.type !== "image");

  async function decide(decision: "CONFIRM" | "REJECT") {
    if (busy) return;
    setBusy(true); setFailure("");
    try {
      await decideRegistrant(eventId, item.id, { decision, note: decision === "REJECT" ? note.trim() || null : null });
      toast(decision === "CONFIRM" ? `${item.name} dikonfirmasi.` : `${item.name} ditolak. Peserta diberi tahu.`);
      onChanged();
      onClose();
    } catch (error) {
      setFailure(errorMessage(error));
      setBusy(false);
    }
  }

  return <dialog ref={dialog} className={styles.reviewDialog} aria-labelledby={titleId} onClose={onClose} onClick={(click) => { if (click.target === dialog.current && !busy) onClose(); }}>
    <div className={styles.reviewBody}>
      <div className={styles.reviewHead}>
        <h2 id={titleId}>{item.name}</h2>
        <button type="button" className={styles.reviewClose} aria-label="Tutup" onClick={onClose} disabled={busy}><Icon name="close" /></button>
      </div>
      <p className={styles.reviewMeta}><Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge><span className={styles.mono}>{item.ticketReference}</span><span>Daftar {exportTime(item.createdAt)}</span></p>
      {item.status === "REJECTED" && item.note && <p>Alasan penolakan: {item.note}</p>}
      {proofs.map((answer) => <figure key={answer.fieldId} className={styles.proof}>
        <img src={answer.value} alt={`${answer.label} dari ${item.name}`} />
        <figcaption>{answer.label}</figcaption>
      </figure>)}
      {!proofs.length && item.status === "PENDING" && <Notice>Peserta belum mengunggah bukti pembayaran.</Notice>}
      {others.length > 0 && <dl className={styles.reviewFacts}>{others.map((answer) => <div key={answer.fieldId}><dt>{answer.label}</dt><dd>{answer.value}</dd></div>)}</dl>}
      {failure && <Notice error>{failure}</Notice>}
      {rejecting && <TextAreaField name="reject-note" label="Alasan penolakan" optional maxLength={200} rows={3} value={note} onChange={setNote} hint="Alasan ikut tampil di notifikasi peserta." disabled={busy} />}
      {item.status === "PENDING" && <div className={styles.reviewActions}>
        {!rejecting ? <>
          <button type="button" className={uiStyles.secondary} onClick={() => setRejecting(true)} disabled={busy}>Tolak</button>
          <button type="button" className={uiStyles.primary} onClick={() => void decide("CONFIRM")} disabled={busy}>{busy ? "Memproses…" : "Konfirmasi"}</button>
        </> : <>
          <button type="button" className={uiStyles.secondary} onClick={() => setRejecting(false)} disabled={busy}>Batal</button>
          <button type="button" className={uiStyles.primary} onClick={() => void decide("REJECT")} disabled={busy}>{busy ? "Memproses…" : "Kirim penolakan"}</button>
        </>}
      </div>}
    </div>
  </dialog>;
}
