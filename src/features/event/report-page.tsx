"use client";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { BackLink, Badge, EmptyState, Loading, Notice, PageHeader, ProtectedPage, StatGrid, uiStyles } from "@/lib/ui";
import type { EventReport } from "@/contracts/event-report";
import { addBenefit, getEventReport, saveEvidence } from "./services/report-service";
import styles from "./event-detail.module.css";

type Benefit = EventReport["sponsorships"][number]["benefits"][number];
function Evidence({ eventId, benefit, reload }: { eventId: string; benefit: Benefit; reload: () => void }) {
  const [url, setUrl] = useState(benefit.evidenceUrl || "");
  const [verified, setVerified] = useState(benefit.status === "VERIFIED");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { await saveEvidence(eventId, benefit.id, url, verified); reload(); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className={uiStyles.form}>
    <h3>{benefit.label} <Badge tone={benefit.status === "VERIFIED" ? "success" : "warning"}>{benefit.status === "VERIFIED" ? "Terverifikasi" : "Belum terverifikasi"}</Badge></h3>
    <label>Tautan bukti<input required type="url" pattern="https://.*" maxLength={2000} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" /></label>
    <label><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} /> Saya sudah meninjau bukti pemenuhan benefit ini</label>
    {error && <Notice error>{error}</Notice>}
    <button className={uiStyles.secondary} disabled={busy}>{busy ? "Menyimpan…" : "Simpan bukti"}</button>
  </form>;
}
export default function ReportPage({ id }: { id: string }) { return <ProtectedPage><Report id={id} /></ProtectedPage>; }
function Report({ id }: { id: string }) {
  const resource = useResource(id, getEventReport);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (resource.status === "loading") return <Loading>Memuat laporan…</Loading>;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button onClick={resource.reload}>Coba lagi</button></Notice>;
  const data = resource.data; if (!data) return null;
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); setBusy(true); setError("");
    try { await addBenefit(id, String(values.get("sponsorshipId")), String(values.get("label"))); form.reset(); resource.reload(); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <><BackLink href={`/events/${id}`} /><PageHeader title="Laporan & bukti sponsor">{data.eventTitle}. Evaluasi acara dan tinjau bukti sebelum menandai benefit terpenuhi.</PageHeader>
    <button className={uiStyles.secondary} onClick={() => window.print()}>Cetak / simpan PDF</button>
    <StatGrid items={[{ label: "peserta terdaftar", value: data.registered }, { label: "menunggu konfirmasi", value: data.pending }, { label: "lamaran panitia", value: data.applications }, { label: "presensi tercatat", value: data.attended }]} />
    <p className={styles.hint}>Presensi menghitung tiket yang benar-benar dipindai di demo ini. Angka peserta contoh lainnya adalah data fiktif.</p>
    <section className={styles.section}><h2>Komitmen dan bukti pemenuhan</h2>
      {!data.sponsorships.length ? <EmptyState title="Belum ada komitmen sponsor.">Terima proposal atau tunggu sponsor menyetujui permintaan sebelum mencatat benefit.</EmptyState> : <>
        {data.sponsorships.map((item) => <section key={item.id} className={styles.registration} style={{ marginBottom: 24 }}><h2>{item.sponsorName}</h2><p>{item.packageName}</p>{!item.benefits.length && <p>Tambahkan benefit yang benar-benar disepakati di bawah.</p>}{item.benefits.map((benefit) => <Evidence key={`${benefit.id}:${benefit.status}:${benefit.evidenceUrl}`} eventId={id} benefit={benefit} reload={resource.reload} />)}</section>)}
        <form className={uiStyles.form} onSubmit={create}><h3>Catat benefit yang dijanjikan</h3><label>Komitmen sponsor<select name="sponsorshipId" required>{data.sponsorships.map((item) => <option key={item.id} value={item.id}>{item.sponsorName} · {item.packageName}</option>)}</select></label><label>Benefit<input name="label" required maxLength={200} placeholder="Contoh: logo di poster acara" /></label>{error && <Notice error>{error}</Notice>}<button className={uiStyles.primary} disabled={busy}>{busy ? "Menyimpan…" : "Tambahkan benefit"}</button></form>
      </>}
    </section></>;
}
