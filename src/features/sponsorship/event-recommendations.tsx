"use client";
import Link from "next/link";
import type { PublicEvent } from "@/contracts/participation";
import { errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { Badge, EventCard, EventGrid, Loading, Notice, uiStyles } from "@/lib/ui";
import { getEventMatches, getMatchingProfile } from "./services/matching-service";
import styles from "./matching.module.css";

export function EventRecommendations({ events }: { events: PublicEvent[] | null }) {
  const profile = useResource("matching-profile", getMatchingProfile);
  const matches = useResource("event-matches", getEventMatches);
  const recommended = (matches.data?.items ?? []).flatMap(match => { const event = events?.find(item => item.id === match.eventId); return event ? [{ event, sharedFields: match.sharedFields }] : []; });
  return <section className={styles.panel} aria-labelledby="event-recommendations-title">
    <Badge>Smart Matching</Badge><h2 id="event-recommendations-title">Rekomendasi event untuk perusahaanmu</h2>
    <p>Berdasarkan bidang industri dan minat perusahaanmu.</p>
    {profile.status === "loading" ? <Loading>Memuat bidang perusahaan…</Loading> : profile.status === "error" ? <Notice error>{errorMessage(profile.error)} <button onClick={profile.reload}>Coba lagi</button></Notice> : profile.data && <>
      <p>Bidang perusahaan: <strong>{profile.data.profile?.industry || profile.data.industry || "Belum tercatat"}</strong></p>
    </>}
    {matches.status === "loading" ? <Loading>Menyesuaikan rekomendasi…</Loading> : matches.status === "error" ? <Notice error>{errorMessage(matches.error)} <button onClick={matches.reload}>Coba lagi</button></Notice> : !matches.data?.complete ? <p>Bidang perusahaan belum tercatat untuk rekomendasi. Kamu tetap bisa <Link href="/sponsor/events">menjelajahi semua event</Link>.</p> : !events ? <p>Katalog acara sedang dimuat.</p> : !recommended.length ? <p>Belum ada acara dengan bidang yang sama. <Link href="/sponsor/events">Jelajahi semua event</Link>.</p> : <EventGrid label="Rekomendasi event">{recommended.map(({ event, sharedFields }, index) => <EventCard key={event.id} event={event} tone={index} badge={<Badge tone="success">Sesuai bidang: {sharedFields.join(", ")}</Badge>} actions={() => <><Link className={uiStyles.primary} href={`/sponsor/proposals/new?eventId=${encodeURIComponent(event.id)}`}>Ajukan dukungan</Link><Link className={uiStyles.secondary} href={`/explore/${event.id}`}>Detail event</Link></>} />)}</EventGrid>}
  </section>;
}
