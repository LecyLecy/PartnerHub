"use client";
import { useRef, useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { focusFirstError, TextAreaField } from "@/lib/form/fields";
import { Badge, Notice, SelectionSteps, uiStyles } from "@/lib/ui";
import type { ApplicantView } from "@/contracts/committee";
import { decideApplication } from "./services/committee-service";
import { applicationLabel, applicationTone, selectionPath } from "./selection-path";
import styles from "./committee.module.css";

export function Applicant({ eventId, item, onDone }: { eventId: string; item: ApplicantView; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [noteError, setNoteError] = useState("");
  const [busy, setBusy] = useState(false);
  const field = useRef<HTMLDivElement>(null);
  async function decide(to: string) {
    if (busy) return;
    if (to === "ACCEPTED" && note.trim().length < 10) { setNoteError("Tulis langkah berikutnya untuk panitia yang diterima, minimal 10 karakter."); focusFirstError(field.current, [`note-${item.id}`], { [`note-${item.id}`]: "x" }); return; }
    setBusy(true); setError(""); setNoteError("");
    try { await decideApplication(eventId, item.id, { to, note: note.trim() || null }); setNote(""); onDone(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  const canAccept = item.allowed.some((move) => move.to === "ACCEPTED");
  return <li>
    <div className={styles.row}><h3>{item.applicantName}</h3><Badge tone={applicationTone(item.status)}>{applicationLabel[item.status]}</Badge></div>
    <p>Divisi pilihan: {item.divisions.join(", ")}</p>
    <SelectionSteps steps={selectionPath(item)} label={`Proses seleksi ${item.applicantName}`} />
    <details className={styles.answers}><summary>Lihat jawaban</summary><dl><dt>Motivasi</dt><dd>{item.motivation}</dd>{item.question && <><dt>{item.question}</dt><dd>{item.answer}</dd></>}</dl></details>
    {item.note && <p>Catatan terkirim: {item.note}</p>}
    {item.allowed.length > 0 && <div className={styles.decide} ref={field}>
      <TextAreaField name={`note-${item.id}`} label="Catatan untuk pelamar" optional={!canAccept} value={note} onChange={(value) => { setNote(value); setNoteError(""); }} maxLength={300} rows={3} error={noteError} hint="Wajib saat menerima: tulis langkah berikutnya, misalnya bergabung ke grup WhatsApp panitia, jadwal rapat, atau tautan." disabled={busy} />
      {error && <Notice error>{error}</Notice>}
      <div className={styles.decideActions}>{item.allowed.map((move) => <button key={move.to} type="button" className={move.to === "ACCEPTED" ? uiStyles.primary : uiStyles.secondary} onClick={() => void decide(move.to)} disabled={busy}>{move.label}</button>)}</div>
    </div>}
  </li>;
}
