"use client";
import { useState, type FormEvent } from "react";
import type { SponsorOffer } from "@/contracts/sponsor-offer";
import { errorMessage } from "@/lib/api-client";
import { Notice, uiStyles } from "@/lib/ui";
import { saveFollowUp } from "./services/offer-service";

export function FollowUpForm({ item }: { item: SponsorOffer }) {
  const [date, setDate] = useState(item.nextFollowUpAt || "");
  const [note, setNote] = useState(item.followUpNote || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try { await saveFollowUp(item.eventId, item.id, date, note); setMessage("Tindak lanjut tersimpan."); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <form className={uiStyles.form} onSubmit={submit}><h3>Tindak lanjut sponsor</h3><label>Tanggal berikutnya<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Catatan<textarea maxLength={500} rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: konfirmasi kebutuhan publikasi dan benefit yang ditawarkan" /></label><button className={uiStyles.secondary} disabled={busy}>{busy ? "Menyimpan…" : "Simpan tindak lanjut"}</button>{message && <p role="status">{message}</p>}{error && <Notice error>{error}</Notice>}</form>;
}
