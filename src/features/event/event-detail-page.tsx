"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useResource } from "@/lib/use-resource";
import { errorMessage } from "@/lib/api-client";
import { Badge, Breadcrumb, ProtectedPage, PageTitle, Notice, Loading, uiStyles } from "@/lib/ui";
import { getEvent } from "./services/event-service";
import styles from "./event-detail.module.css";

export default function EventDetailPage({ id }: { id: string }) { return <ProtectedPage><Detail id={id}/></ProtectedPage>; }
function Detail({ id }: { id: string }) {
  const resource=useResource(id,getEvent); const search=useSearchParams();
  if(resource.status === "loading") return <Loading>Memuat event…</Loading>;
  if(resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button> <Link href="/organizer">Ke workspace</Link></Notice>;
  const event=resource.data; if(!event) return null;
  const time=(value:string|null)=>value ? `${new Date(value).toLocaleString("id-ID",{timeZone:"Asia/Jakarta",dateStyle:"long",timeStyle:"short"})} WIB` : "Belum ditentukan";
  return <>
    <Breadcrumb href="/organizer" parent="Acara kamu" current="Detail acara"/>
    <div className={styles.heading}><div><Badge tone={event.status === "PUBLISHED" ? "success" : "neutral"}>{event.status === "DRAFT" ? "Draft" : event.status === "PUBLISHED" ? "Terpublikasi" : event.status === "CLOSED" ? "Selesai" : "Arsip"}</Badge><PageTitle title={event.title}>{event.branding.organizationName || "Penyelenggara belum diisi"}</PageTitle></div>{event.status === "DRAFT" && <Link className={uiStyles.primary} href={`/events/${id}/edit`}>Lanjutkan edit draft</Link>}</div>
    {search.get("saved") === "1" && <Notice>Draft tersimpan dan dimuat kembali dari layanan event.</Notice>}
    <p className={styles.scopeNote}>Detail ini untuk penyelenggara, bukan halaman publik. Publikasi, pemindaian tiket, dan bukti pemenuhan sponsor masih dalam pengembangan.</p>
    <p className={styles.modules}><Link className={uiStyles.secondary} href={`/events/${id}/committee`}>Kelola panitia</Link> <Link className={uiStyles.secondary} href={`/events/${id}/sponsors`}>Ajak sponsor</Link> <Link className={uiStyles.secondary} href={`/events/${id}/registration`}>Pendaftaran</Link> <Link className={uiStyles.secondary} href={`/events/${id}/qr`}>QR tiket</Link></p>
    <div className={styles.layout}>
      <section className={styles.story}><h2>Detail acara</h2><p>{event.summary || "Deskripsi belum diisi."}</p><h2>Jadwal dan lokasi</h2><dl className={styles.facts}><div><dt>Mulai</dt><dd>{time(event.startsAt)}</dd></div><div><dt>Selesai</dt><dd>{time(event.endsAt)}</dd></div><div><dt>Lokasi</dt><dd>{event.venue || "Belum diisi"}</dd></div></dl></section>
      <aside className={styles.registration} aria-labelledby="registration-detail-title"><h2 id="registration-detail-title">Pendaftaran</h2><dl className={styles.facts}><div><dt>Kapasitas peserta</dt><dd>{event.capacity ?? "Belum ditentukan"}</dd></div><div><dt>Registrasi dibuka</dt><dd>{time(event.registrationOpensAt)}</dd></div><div><dt>Registrasi ditutup</dt><dd>{time(event.registrationClosesAt)}</dd></div></dl></aside>
    </div>
    <section className={styles.section}><h2>Identitas visual</h2><ul className={styles.identities}>{[{name:"Logo acara",asset:event.branding.eventLogo},{name:"Logo organisasi",asset:event.branding.organizationLogo},...event.branding.sponsors.map(s=>({name:s.name,asset:s.logo}))].map((item,index)=><li key={`${index}:${item.name}`}>{item.asset ? <RemoteLogo url={item.asset.url} name={item.name}/> : <span className={styles.noLogo} aria-hidden="true">Belum ada logo</span>}<span>{item.name}</span></li>)}</ul></section>
    <section className={styles.section}><h2>Konfigurasi modul</h2><p className={styles.hint}>Pilihan yang tersimpan pada draft, bukan tanda layanan sudah aktif.</p><p className={styles.modules}>{Object.entries(event.modules).filter(([,enabled])=>enabled).map(([key])=><Badge key={key} tone="neutral">{({registration:"Pendaftaran",committee:"Panitia",attendance:"Kehadiran",sponsorship:"Sponsorship"})[key]}</Badge>)}{!Object.values(event.modules).some(Boolean) && "Tidak ada modul dipilih"}</p></section>
  </>;
}
function RemoteLogo({url,name}:{url:string;name:string}) {
  // Server-approved image URLs cannot be optimized without the separately approved storage configuration.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={name} className={styles.logo}/>;
}
