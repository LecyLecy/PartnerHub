"use client";
import Link from "next/link";
import { ApiError, errorMessage } from "@/lib/api-client";
import { getPublicEvent, publicEventStatus } from "@/lib/public-events";
import { useResource } from "@/lib/use-resource";
import { BackLink, Badge, EmptyState, Loading, Notice, PageHeader, SiteFrame, uiStyles } from "@/lib/ui";
import { EventDetails } from "@/lib/ui/event-card";
import cardStyles from "@/lib/ui/event-card.module.css";
import styles from "./public-events.module.css";

const labels = { ongoing: "Sedang berlangsung", upcoming: "Akan datang", ended: "Selesai", unscheduled: "Jadwal belum tersedia" };
export default function PublicEventPage({ id }: { id: string }) {
  const resource = useResource(id, getPublicEvent);
  const event = resource.data;
  return <SiteFrame><BackLink href="/explore">Semua event</BackLink>
    {resource.status === "loading" ? <Loading>Memuat detail acara…</Loading> : resource.status === "error" ? resource.error instanceof ApiError && resource.error.status === 404
      ? <EmptyState title="Acara tidak tersedia." href="/explore" action="Jelajahi event lain">Acara belum diterbitkan, sudah ditutup, atau tautannya tidak ditemukan.</EmptyState>
      : <Notice error>{errorMessage(resource.error)} <button onClick={resource.reload}>Coba lagi</button></Notice>
      : event && <article className={styles.detail}>
        <PageHeader title={event.title}>Kenali acara dan penyelenggaranya sebelum menawarkan dukungan.</PageHeader>
        <div><Badge tone={publicEventStatus(event) === "ongoing" ? "success" : "info"}>{labels[publicEventStatus(event)]}</Badge></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {event.eventLogoUrl && <img className={styles.cover} src={event.eventLogoUrl} alt={`Visual acara ${event.title}`} />}
        <div className={`${cardStyles.dialogBody} ${styles.content}`}><EventDetails event={event} /></div>
        {publicEventStatus(event) !== "ended" && <aside className={styles.sponsorCallout}><h2>Tertarik mendukung acara ini?</h2><p>Lihat detail terlebih dahulu. Login sebagai sponsor hanya diperlukan saat mengirim proposal. Pengajuan tidak menjamin kerja sama.</p><Link className={uiStyles.primary} href={`/sponsor/proposals/new?eventId=${encodeURIComponent(event.id)}`}>Ajukan sponsorship</Link></aside>}
      </article>}
  </SiteFrame>;
}
