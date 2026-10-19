"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { packageTiers } from "@/contracts/billing";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useConfirm } from "@/lib/ui/confirmation";
import { useResource } from "@/lib/use-resource";
import { errorMessage } from "@/lib/api-client";
import { Badge, Breadcrumb, ProtectedPage, PageTitle, Notice, Loading, uiStyles } from "@/lib/ui";
import { getEvent, transitionEvent } from "./services/event-service";
import { publicationErrors, type EventAction } from "./lifecycle";
import styles from "./event-detail.module.css";
import { getEventPackage } from "./event-package-panel";

const EventEditorPage = dynamic(() => import("./event-editor-page"));
const publicationLabels: Record<string, string> = {
  "Isi nama acara minimal 3 karakter.": "Nama acara",
  "Lengkapi jadwal mulai dan selesai yang valid di masa mendatang.": "Jadwal acara",
  "Isi lokasi atau tautan pelaksanaan online.": "Lokasi acara",
  "Isi nama organisasi penyelenggara.": "Nama penyelenggara",
  "Tentukan kapasitas peserta.": "Kapasitas peserta",
  "Lengkapi periode pendaftaran; penutupan harus setelah pembukaan dan paling lambat saat acara dimulai.": "Periode pendaftaran",
  "Aktifkan pendaftaran sebelum menggunakan presensi.": "Pendaftaran untuk presensi",
};
export default function EventDetailPage({ id }: { id: string }) {
  const search = useSearchParams();
  return search.get("edit") === "1" ? <EventEditorPage id={id} /> : <ProtectedPage><Detail id={id} /></ProtectedPage>;
}
function Detail({ id }: { id: string }) {
  const confirm = useConfirm();
  const resource=useResource(id,getEvent); const search=useSearchParams();
  const packageResource = useResource(id, getEventPackage);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  if(resource.status === "loading") return <Loading>Memuat event…</Loading>;
  if(resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button> <Link href="/organizer">Daftar event</Link></Notice>;
  const event=resource.data; if(!event) return null;
  const errors = event.status === "DRAFT" ? publicationErrors(event) : [];
  async function change(action: EventAction) {
    if (!event || busy) return;
    if (action !== "publish" && !await confirm({ title: action === "close" ? "Tutup acara?" : "Arsipkan acara?", description: action === "close" ? "Pendaftaran baru akan dihentikan. Data peserta dan laporan tetap tersimpan." : "Acara akan dipindahkan ke arsip. Data dan laporan tetap tersimpan.", confirmLabel: action === "close" ? "Tutup acara" : "Arsipkan acara", destructive: true })) return;
    setBusy(true); setFailure("");
    try { await transitionEvent(id, event.revision, action); resource.reload(); packageResource.reload(); }
    catch (error) { setFailure(errorMessage(error)); }
    finally { setBusy(false); }
  }
  const time=(value:string|null)=>value ? `${new Date(value).toLocaleString("id-ID",{timeZone:"Asia/Jakarta",dateStyle:"long",timeStyle:"short"})} WIB` : "Belum ditentukan";
  return <>
    <Breadcrumb href={event.status === "DRAFT" ? "/organizer/archive" : "/organizer"} parent={event.status === "DRAFT" ? "Arsip acara" : "Acara kamu"} current="Ringkasan acara"/>
    <div className={styles.heading}>
      <div className={styles.headingIdentity}>
        <p className={styles.status} data-state={event.status} data-incomplete={errors.length > 0}>{event.status === "DRAFT" ? errors.length ? "Perlu dilengkapi" : "Siap diunggah" : event.status === "PUBLISHED" ? "Terpublikasi" : event.status === "CLOSED" ? "Selesai" : "Arsip"}</p>
        <PageTitle title={event.title}>{event.branding.organizationName || "Penyelenggara belum diisi"}</PageTitle>
      </div>
      {event.status === "DRAFT" && <Link className={uiStyles.secondary} href={`/events/${id}?edit=1`}>Edit detail acara</Link>}
    </div>
    {search.get("saved") === "1" && <Notice>Acara tersimpan.</Notice>}
    {failure && <Notice error>{failure}</Notice>}
    <div className={styles.overview}>
    {event.status === "DRAFT" && <section className={styles.publication} aria-labelledby="publication-title">
      <h2 id="publication-title">Unggah acara</h2>
      {errors.length ? <>
        <p>Lengkapi {errors.length} bagian berikut sebelum mengunggah.</p>
        <ul className={styles.checklist} aria-label="Bagian yang perlu dilengkapi">{errors.map(error => <li key={error}>{publicationLabels[error] ?? error}</li>)}</ul>
      </> : <p>Detail sudah lengkap. Unggah agar acara dapat ditemukan peserta dan sponsor.</p>}
      <div className={styles.publishActions}>
        {errors.length > 0 && <Link className={uiStyles.primary} href={`/events/${id}?edit=1`}>Lengkapi detail</Link>}
        {!errors.length && packageResource.status === "success" && !packageResource.data?.canPublish
          ? <Link className={uiStyles.primary} href={`/events/${id}/package`}>Bayar & unggah</Link>
          : <button aria-describedby="publish-reason" className={errors.length ? uiStyles.secondary : uiStyles.primary} disabled={busy || errors.length > 0 || packageResource.status !== "success" || !packageResource.data?.canPublish} onClick={() => void change("publish")}>{busy ? "Memproses…" : "Unggah acara"}</button>}
      </div>
      <p id="publish-reason" className={styles.hint}>{packageResource.status === "loading" ? "Memeriksa pembayaran…" : packageResource.status === "error" ? "Pembayaran belum dapat diperiksa. Coba muat ulang." : errors.length ? "Acara belum dapat diunggah." : !packageResource.data?.canPublish ? "Bayar per event atau gunakan subscription yang sesuai." : "Siap diunggah tanpa pembayaran tambahan."}</p>
    </section>}
    <div className={styles.information}>
      <section className={styles.overviewSection} aria-labelledby="event-story-title">
        <h2 id="event-story-title">Detail acara</h2>
        <p className={styles.description}>{event.summary || "Deskripsi belum diisi."}</p>
      </section>
      <section className={styles.overviewSection} aria-labelledby="event-schedule-title">
        <h2 id="event-schedule-title">Jadwal dan lokasi</h2>
        <dl className={styles.facts}><div><dt>Mulai</dt><dd>{time(event.startsAt)}</dd></div><div><dt>Selesai</dt><dd>{time(event.endsAt)}</dd></div><div><dt>Lokasi</dt><dd>{event.venue || "Belum diisi"}</dd></div></dl>
      </section>
      <section className={styles.overviewSection} aria-labelledby="registration-detail-title">
        <h2 id="registration-detail-title">Pendaftaran</h2>
        <dl className={styles.facts}><div><dt>Kapasitas peserta</dt><dd>{event.capacity ?? "Belum ditentukan"}</dd></div><div><dt>Registrasi dibuka</dt><dd>{time(event.registrationOpensAt)}</dd></div><div><dt>Registrasi ditutup</dt><dd>{time(event.registrationClosesAt)}</dd></div></dl>
      </section>
    </div>
    {packageResource.data && <section className={styles.overviewSection} aria-labelledby="package-info-title"><h2 id="package-info-title">{packageResource.data.coverage ? `Paket ${packageTiers[packageResource.data.coverage.tier].name}` : "Pembayaran event"}</h2><p>{packageResource.data.message}</p><Link className={uiStyles.secondary} href={`/events/${id}/package`}>{packageResource.data.coverage ? "Kelola pembayaran" : "Pilih paket"}</Link></section>}
    {packageResource.status === "error" && <Notice error>{errorMessage(packageResource.error)} <button className={uiStyles.secondary} onClick={packageResource.reload}>Muat ulang pembayaran</button></Notice>}
    <section className={styles.overviewSection} aria-labelledby="event-identity-title"><h2 id="event-identity-title">Identitas visual</h2><ul className={styles.identities}>{[{name:"Logo acara",asset:event.branding.eventLogo},{name:"Logo organisasi",asset:event.branding.organizationLogo},...event.branding.sponsors.map(s=>({name:s.name,asset:s.logo}))].map((item,index)=><li key={`${index}:${item.name}`}>{item.asset ? <RemoteLogo url={item.asset.url} name={item.name}/> : <span className={styles.noLogo} aria-hidden="true">Belum ada logo</span>}<span>{item.name}</span></li>)}</ul></section>
    <section className={styles.overviewSection} aria-labelledby="event-modules-title"><h2 id="event-modules-title">Konfigurasi modul</h2><p className={styles.modules}>{Object.entries(event.modules).filter(([,enabled])=>enabled).map(([key])=><Badge key={key} tone="neutral">{({registration:"Pendaftaran",committee:"Panitia",attendance:"Kehadiran",sponsorship:"Sponsorship"})[key]}</Badge>)}{!Object.values(event.modules).some(Boolean) && "Tidak ada modul dipilih"}</p></section>
    {event.status === "PUBLISHED" && <section className={styles.overviewSection} aria-labelledby="close-event-title"><h2 id="close-event-title">Tutup acara</h2><p>Pendaftaran baru akan dihentikan. Data acara tetap tersimpan.</p><button className={uiStyles.destructive} disabled={busy || packageResource.status !== "success" || packageResource.data?.readOnly} onClick={() => void change("close")}>Tutup acara</button>{packageResource.data?.readOnly && <p>Akses acara hanya baca.</p>}</section>}
    {event.status === "CLOSED" && <section className={styles.overviewSection} aria-labelledby="archive-event-title"><h2 id="archive-event-title">Arsipkan acara</h2><p>Simpan acara yang sudah selesai sebagai arsip.</p><button className={uiStyles.secondary} disabled={busy || packageResource.status !== "success" || packageResource.data?.readOnly} onClick={() => void change("archive")}>Arsipkan acara</button>{packageResource.data?.readOnly && <p>Akses acara hanya baca.</p>}</section>}
    </div>
  </>;
}
function RemoteLogo({url,name}:{url:string;name:string}) {
  // Server-approved image URLs cannot be optimized without the separately approved storage configuration.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={name} width={160} height={96} loading="lazy" className={styles.logo}/>;
}
