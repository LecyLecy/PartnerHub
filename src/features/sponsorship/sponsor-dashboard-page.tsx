"use client";
import Link from "next/link";
import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { listPublicEvents, publicEventStatus } from "@/lib/public-events";
import { useResource } from "@/lib/use-resource";
import { EmptyState, EventCard, EventGrid, Notice, PageHeader, ProtectedPage, SkeletonCards, uiStyles } from "@/lib/ui";
import { EventRecommendations } from "./event-recommendations";
import styles from "./matching.module.css";

export default function SponsorPage({ view = "recommended" }: { view?: "recommended" | "all" }) { return <ProtectedPage><Catalog view={view} /></ProtectedPage>; }

function Catalog({ view }: { view: "recommended" | "all" }) {
  const events = useResource("public-events", listPublicEvents);
  const [query, setQuery] = useState("");
  const available = events.data?.filter(item => ["ongoing", "upcoming"].includes(publicEventStatus(item))) ?? [];
  const shown = available.filter(item => item.title.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")));
  return <>
    <PageHeader title={view === "all" ? "Semua event" : "Rekomendasi event"}>Pilih acara yang sesuai untuk dukungan perusahaanmu.</PageHeader>
    {view === "recommended" && events.status === "error" && <Notice error>{errorMessage(events.error)} <button className={uiStyles.secondary} onClick={events.reload}>Muat ulang acara</button></Notice>}
    {view === "recommended" ? <EventRecommendations events={events.data} /> : <>
    <section aria-labelledby="catalog-title">
      <div className={uiStyles.sectionHeading}><h2 id="catalog-title">Acara untuk kamu dukung</h2></div>
      {events.status === "success" && available.length > 0 && <label className={styles.catalogSearch}>Cari acara<input className={styles.search} type="search" name="eventSearch" autoComplete="off" placeholder="Nama acara…" value={query} onChange={event => setQuery(event.target.value)} /></label>}
      {events.status === "loading" ? <SkeletonCards label="Memuat acara…" count={3} />
        : events.status === "error" ? <Notice error>{errorMessage(events.error)} <button className={uiStyles.secondary} onClick={events.reload}>Muat ulang acara</button></Notice>
        : !available.length ? <EmptyState title="Belum ada acara terbuka.">Acara akan muncul di sini setelah tercatat sebagai terpublikasi.</EmptyState>
        : !shown.length ? <div role="status"><p>Tidak ada acara yang cocok.</p><button className={uiStyles.secondary} onClick={() => setQuery("")}>Reset pencarian</button></div>
        : <EventGrid label="Acara untuk didukung">{shown.map((item, index) => <EventCard key={item.id} event={item} tone={index}
          actions={() => <Link className={uiStyles.primary} href={`/sponsor/proposals/new?eventId=${encodeURIComponent(item.id)}`}>Ajukan dukungan</Link>} />)}</EventGrid>}
    </section></>}
  </>;
}

