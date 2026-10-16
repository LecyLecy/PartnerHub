"use client";
import Link from "next/link";
import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { listPublicEvents } from "@/lib/public-events";
import { useResource } from "@/lib/use-resource";
import { Badge, EmptyState, EventCard, EventGrid, Notice, PageHeader, ProtectedPage, SkeletonCards, StatGrid, uiStyles, useToast } from "@/lib/ui";
import { listReceivedOffers, respondToOffer } from "./services/offer-service";
import { DetailRow } from "./detail-row";
import { OfferRow } from "./offer-row";
import { listProposals, listSponsorships } from "./services/sponsorship-service";
import styles from "./sponsorship.module.css";

const statusLabel = { SENT: "Terkirim", IN_REVIEW: "Ditinjau", ACCEPTED: "Diterima", DECLINED: "Ditolak" } as const;
export default function SponsorPage() { return <ProtectedPage><Dashboard /></ProtectedPage>; }

function ReceivedOffers() {
  const offers = useResource("received-offers", listReceivedOffers);
  const [busyId, setBusyId] = useState("");
  const [failure, setFailure] = useState("");
  const toast = useToast();
  async function answer(id: string, status: "ACCEPTED" | "DECLINED"): Promise<void> {
    if (busyId) return;
    setBusyId(id); setFailure("");
    try { await respondToOffer(id, status); toast(status === "ACCEPTED" ? "Permintaan diterima." : "Permintaan ditolak."); offers.reload(); }
    catch (error) { setFailure(errorMessage(error)); toast(errorMessage(error), "error"); }
    finally { setBusyId(""); }
  }
  return <section className={styles.section} aria-labelledby="received-title">
    <h2 id="received-title">Permintaan dari penyelenggara</h2>
    {failure && <Notice error>{failure}</Notice>}
    {offers.status === "loading" ? <SkeletonCards label="Memuat permintaan…" count={2} />
      : offers.status === "error" ? <Notice error>{errorMessage(offers.error)} <button className={uiStyles.secondary} onClick={offers.reload}>Muat ulang</button></Notice>
      : !offers.data?.length ? <EmptyState title="Belum ada permintaan.">Permintaan dari penyelenggara muncul di sini dan di notifikasi.</EmptyState>
      : <ul className={styles.received} tabIndex={0} aria-label="Daftar permintaan">{offers.data.map((item) => <OfferRow key={item.id} item={item} busy={Boolean(busyId)} onAnswer={answer} />)}</ul>}
  </section>;
}

function Dashboard() {
  const proposals = useResource("proposals", listProposals);
  const sponsorships = useResource("sponsorships", listSponsorships);
  const events = useResource("public-events", listPublicEvents);
  return <>
    <PageHeader title="Temukan acara. Bangun dukungan." action={<Link className={uiStyles.primary} href="/sponsor/proposals/new">Kirim proposal baru</Link>}>Kenali acara kampus dan komunitas, lihat siapa penyelenggaranya, lalu tawarkan dukungan yang sesuai.</PageHeader>
    {events.data && proposals.data && sponsorships.data && <StatGrid items={[{ label: "acara terbuka", value: events.data.length }, { label: "proposal terkirim", value: proposals.data.length }, { label: "komitmen aktif", value: sponsorships.data.length }]} />}
    <div className={styles.dash}>
    <section className={styles.catalog} aria-labelledby="catalog-title">
      <div className={uiStyles.sectionHeading}><h2 id="catalog-title">Acara untuk kamu dukung</h2><p>Acara terbuka dan penyelenggaranya.</p></div>
      {events.status === "loading" ? <SkeletonCards label="Memuat acara…" count={3} />
        : events.status === "error" ? <Notice error>{errorMessage(events.error)} <button className={uiStyles.secondary} onClick={events.reload}>Muat ulang acara</button></Notice>
        : !events.data?.length ? <EmptyState title="Belum ada acara terbuka.">Acara akan muncul di sini setelah tercatat sebagai terpublikasi.</EmptyState>
        : <EventGrid>{events.data.map((item, index) => <EventCard key={item.id} event={item} tone={index}
          actions={() => <Link className={uiStyles.primary} href={`/sponsor/proposals/new?eventId=${encodeURIComponent(item.id)}`}>Ajukan dukungan</Link>} />)}</EventGrid>}
    </section>
    <div className={styles.side}>
    <ReceivedOffers />
    <section className={styles.section} aria-labelledby="sponsorships-title">
      <h2 id="sponsorships-title">Manfaat sponsor</h2><p className={styles.sectionHint}>Komitmen yang dicatat untuk perusahaanmu setelah proposal diterima.</p>
      {sponsorships.status === "loading" ? <SkeletonCards label="Memuat komitmen…" count={2} />
        : sponsorships.status === "error" ? <Notice error>{errorMessage(sponsorships.error)} <button className={uiStyles.secondary} onClick={sponsorships.reload}>Muat ulang</button></Notice>
        : !sponsorships.data?.length ? <EmptyState title="Belum ada komitmen.">Komitmen muncul setelah penyelenggara menerima proposalmu.</EmptyState>
        : <ul className={styles.commitments} tabIndex={0} aria-label="Daftar komitmen">{sponsorships.data.map((item) => <li key={item.id}><h3>{item.eventTitle}</h3><p>{item.packageName}</p><ul className={styles.benefits}>{item.benefits.map((benefit) => <li key={benefit.id}>{benefit.label}: <Badge tone={benefit.status === "VERIFIED" ? "success" : "warning"}>{benefit.status === "VERIFIED" ? "terverifikasi" : "direncanakan"}</Badge>{benefit.evidenceUrl?.startsWith("https://") && <p><a href={benefit.evidenceUrl} target="_blank" rel="noopener noreferrer">Lihat bukti pemenuhan</a></p>}</li>)}</ul></li>)}</ul>}
    </section>
    <section className={styles.section} aria-labelledby="proposals-title">
      <h2 id="proposals-title">Proposal perusahaanmu</h2><p className={styles.sectionHint}>Status dan detail penawaran untuk setiap acara.</p>
      {proposals.status === "loading" ? <SkeletonCards label="Memuat proposal…" count={2} />
        : proposals.status === "error" ? <Notice error>{errorMessage(proposals.error)} <button className={uiStyles.secondary} onClick={proposals.reload}>Muat ulang</button></Notice>
        : !proposals.data?.length ? <EmptyState title="Belum ada proposal.">Pilih acara yang sesuai melalui tombol Kirim proposal baru, lalu jelaskan dukungan yang kamu tawarkan.</EmptyState>
        : <ul className={styles.proposals} tabIndex={0} aria-label="Daftar proposal">{proposals.data.map((item) => <DetailRow key={item.id} title={item.eventTitle} label={`Detail proposal ${item.eventTitle}`} badge={<Badge tone={item.status === "ACCEPTED" ? "success" : item.status === "DECLINED" ? "danger" : item.status === "IN_REVIEW" ? "warning" : "info"}>{statusLabel[item.status]}</Badge>}>
          {(close) => <>
            <p>{item.category}{item.amountLabel ? ` · ${item.amountLabel}` : ""}</p>
            <p>{item.offer}</p>
            <div className={styles.receivedActions}><button type="button" className={uiStyles.secondary} onClick={close}>Tutup</button></div>
          </>}
        </DetailRow>)}</ul>}
    </section>
    </div>
    </div>
  </>;
}

