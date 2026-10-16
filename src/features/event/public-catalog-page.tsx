"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { listPublicEvents, publicEventStatus } from "@/lib/public-events";
import { useResource } from "@/lib/use-resource";
import { Badge, EmptyState, Loading, Notice, PageHeader, SiteFrame, uiStyles } from "@/lib/ui";
import { EventCard, EventGrid } from "@/lib/ui/event-card";
import styles from "./public-events.module.css";

export default function PublicCatalogPage() {
  const resource = useResource("public-events", listPublicEvents);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  const events = (resource.data || []).filter((event) => {
    const status = publicEventStatus(event, now);
    return (status === "ongoing" || status === "upcoming") && (period === "all" || period === status)
      && `${event.title} ${event.organizationName} ${event.venue} ${event.category}`.toLocaleLowerCase("id-ID").includes(search.trim().toLocaleLowerCase("id-ID"));
  }).sort((a, b) => {
    const priority = (event: typeof a) => publicEventStatus(event, now) === "ongoing" ? 0 : 1;
    return priority(a) - priority(b) || Date.parse(a.startsAt!) - Date.parse(b.startsAt!);
  });
  return <SiteFrame>
    <PageHeader title="Temukan acara. Kenali peluangnya.">Jelajahi acara kampus dan komunitas, lihat penyelenggara serta sponsor pendukung. Tidak perlu login untuk melihat detail.</PageHeader>
    <div className={styles.filters}>
      <label>Cari event<input type="search" maxLength={150} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama acara, organizer, atau lokasi" /></label>
      <label>Waktu acara<select aria-label="Waktu acara" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Berlangsung & mendatang</option><option value="ongoing">Sedang berlangsung</option><option value="upcoming">Akan datang</option></select></label>
    </div>
    {resource.status === "loading" ? <Loading>Memuat acara publik…</Loading> : resource.status === "error" ? <Notice error>{errorMessage(resource.error)} <button onClick={resource.reload}>Coba lagi</button></Notice> : <>
      <p className={styles.result} role="status">{events.length} acara ditemukan</p>
      {!events.length ? <EmptyState title="Belum ada acara yang cocok.">Coba kata kunci atau waktu lain. Hanya acara yang sudah diterbitkan dan belum selesai yang ditampilkan.</EmptyState> : <EventGrid label="Acara publik">{events.map((event, index) => <EventCard key={event.id} event={event} tone={index} badge={<Badge tone={publicEventStatus(event, now) === "ongoing" ? "success" : "info"}>{publicEventStatus(event, now) === "ongoing" ? "Sedang berlangsung" : "Akan datang"}</Badge>} actions={() => <Link className={uiStyles.primary} href={`/explore/${event.id}`}>Buka halaman event</Link>} />)}</EventGrid>}
    </>}
  </SiteFrame>;
}
