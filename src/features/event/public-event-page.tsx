"use client";
import Link from "next/link";
import { ApiError, errorMessage } from "@/lib/api-client";
import { getPublicEvent, publicEventStatus } from "@/lib/public-events";
import { useResource } from "@/lib/use-resource";
import { useSession } from "@/lib/session";
import { BackLink, Badge, EmptyState, Loading, Notice, PageHeader, SiteFrame, uiStyles } from "@/lib/ui";
import { EventDetails } from "@/lib/ui/event-card";
import cardStyles from "@/lib/ui/event-card.module.css";
import styles from "./public-events.module.css";

const labels = { ongoing: "Sedang berlangsung", upcoming: "Akan datang", ended: "Selesai", unscheduled: "Jadwal belum tersedia" };
export default function PublicEventPage({ id }: { id: string }) {
  const auth = useSession();
  const role = auth.status === "authenticated" ? auth.session?.account.role : null;
  const resource = useResource(id, getPublicEvent);
  const event = resource.data;
  return <SiteFrame><BackLink href="/explore">Semua event</BackLink>
    {resource.status === "loading" ? <Loading>Memuat detail acara…</Loading> : resource.status === "error" ? resource.error instanceof ApiError && resource.error.status === 404
      ? <EmptyState title="Acara tidak tersedia." href="/explore" action="Jelajahi event lain">Acara belum diterbitkan, sudah ditutup, atau tautannya tidak ditemukan.</EmptyState>
      : <Notice error>{errorMessage(resource.error)} <button onClick={resource.reload}>Coba lagi</button></Notice>
      : event && <article className={styles.detail}>
        <PageHeader title={event.title}>Lihat informasi acara, pendaftaran, dan dukungan sponsor.</PageHeader>
        <div><Badge tone={publicEventStatus(event) === "ongoing" ? "success" : "info"}>{labels[publicEventStatus(event)]}</Badge></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {event.eventLogoUrl && <img className={styles.cover} src={event.eventLogoUrl} alt={`Visual acara ${event.title}`} />}
        <div className={`${cardStyles.dialogBody} ${styles.content}`}><EventDetails event={event} /></div>
        {publicEventStatus(event) !== "ended" && <>
          {(!role || role === "user") && <aside className={styles.content}><h2>Ikuti acara ini</h2><p>Periksa form dan petunjuk pembayaran sebelum mengirim pendaftaran.</p><Link className={uiStyles.primary} href={`/me/register/${encodeURIComponent(event.id)}`}>Daftar peserta</Link></aside>}
          {(!role || role === "sponsor") && <aside className={styles.sponsorCallout}><h2>Tertarik mendukung acara ini?</h2><p>Login sebagai sponsor untuk mengirim proposal. Pengajuan tidak menjamin kerja sama.</p><Link className={uiStyles.secondary} href={`/sponsor/proposals/new?eventId=${encodeURIComponent(event.id)}`}>Ajukan sponsorship</Link></aside>}
        </>}
      </article>}
  </SiteFrame>;
}
