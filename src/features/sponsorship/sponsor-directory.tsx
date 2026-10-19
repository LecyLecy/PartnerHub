"use client";
import Link from "next/link";
import type { SponsorMatch, SponsorMatchBoard } from "@/contracts/matching";
import { Badge, uiStyles } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import styles from "./matching.module.css";

export function SponsorPhoto({ sponsor }: { sponsor: Pick<SponsorMatch, "companyName" | "imageUrl"> }) {
  return sponsor.imageUrl ? <figure className={styles.companyPhoto}>
    {/* eslint-disable-next-line @next/next/no-img-element -- Bundled, provenance-documented company illustration. */}
    <img src={sponsor.imageUrl} alt={`Ilustrasi bidang usaha ${sponsor.companyName}`} width={600} height={338} loading="lazy" />
  </figure> : null;
}

export function inviteHref(sponsorId: string, eventId?: string) {
  const query = new URLSearchParams({ sponsorId });
  return eventId ? `/events/${encodeURIComponent(eventId)}/sponsors/invite?${query}` : `/organizer/sponsors?${query}`;
}

export function SponsorCards({ items, label, eventId, canInvite = true }: { items: SponsorMatch[]; label: string; eventId?: string; canInvite?: boolean }) {
  return <ul className={styles.grid} aria-label={label}>{items.map(sponsor => <li key={sponsor.id}>
    <SponsorPhoto sponsor={sponsor} />
    <h3>{sponsor.companyName}</h3><Badge tone="neutral">{sponsor.industry}</Badge>
    {sponsor.sharedFields.length > 0 && <p className={styles.reason}>Sesuai bidang: {sponsor.sharedFields.join(", ")}</p>}
    {canInvite && <Link className={uiStyles.secondary} aria-label={`Pilih sponsor ${sponsor.companyName}`} href={inviteHref(sponsor.id, eventId)}>Pilih sponsor</Link>}
  </li>)}</ul>;
}

export function SponsorDirectory({ data, eventId }: { data: SponsorMatchBoard; eventId: string }) {
  const recommended = data.items.filter(item => item.sharedFields.length > 0);
  return <section className={styles.panel} aria-labelledby="match-sponsors-title">
    <div className={styles.matchLabel}><Icon name="users" size={20} /><span>Smart Matching</span></div>
    <h2 id="match-sponsors-title">Rekomendasi untuk event ini</h2>
    <p><strong>{data.eventTitle}</strong></p>
    <p>Bidang acara: {data.fields.join(", ") || "Belum tercatat"}</p>
    {!data.fields.length ? <p>Bidang acara belum tercatat. Jelajahi katalog untuk mencari sponsor.</p> : !recommended.length ? <p>Belum ada sponsor dengan bidang yang sama. Cari pilihan lain di katalog sponsor.</p> : <SponsorCards items={recommended} label="Rekomendasi sponsor" eventId={eventId} canInvite={data.eventPublished} />}
    <div className={styles.exploreAction}><Link className={uiStyles.secondary} href={`/organizer/sponsors?eventId=${encodeURIComponent(eventId)}`}>Jelajahi sponsor lain<Icon name="arrow" size={18} /></Link></div>
  </section>;
}
