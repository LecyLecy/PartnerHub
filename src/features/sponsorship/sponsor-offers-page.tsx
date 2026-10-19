"use client";
import { useSearchParams } from "next/navigation";
import { errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { Badge, Breadcrumb, Loading, Notice, PageTitle, ProtectedPage, uiStyles } from "@/lib/ui";
import { getOfferBoard } from "./services/offer-service";
import { getSponsorMatches } from "./services/matching-service";
import { SponsorDirectory, SponsorPhoto } from "./sponsor-directory";
import { DetailRow } from "./detail-row";
import { FollowUpForm } from "./follow-up-form";
import { offerLabel, offerTone } from "./offer-status";
import styles from "./matching.module.css";

export default function SponsorOffersPage({ id }: { id: string }) {
  return <ProtectedPage><Offers id={id} /></ProtectedPage>;
}
function Offers({ id }: { id: string }) {
  const board = useResource(id, getOfferBoard);
  const sponsors = useResource(id, getSponsorMatches);
  const sent = useSearchParams().get("sent") === "1";
  return <>
    <Breadcrumb href={`/events/${encodeURIComponent(id)}`} parent="Ringkasan acara" current="Ajak sponsor" />
    <PageTitle title="Ajak sponsor">Temukan sponsor yang sesuai, lalu siapkan ajakan untuk acaramu.</PageTitle>
    {sent && <Notice>Permintaan terkirim. Sponsor menerima notifikasi.</Notice>}
    {sponsors.status === "loading" ? <Loading>Memuat rekomendasi sponsor…</Loading> : sponsors.status === "error" ? <Notice error>{errorMessage(sponsors.error)} <button className={uiStyles.secondary} onClick={sponsors.reload}>Coba lagi</button></Notice> : sponsors.data && <>
      {!sponsors.data.eventPublished && <Notice>Ajakan dapat dikirim setelah acara dipublikasikan.</Notice>}
      <SponsorDirectory data={sponsors.data} eventId={id} />
    </>}
    <section className={styles.sentSection} aria-labelledby="sent-offers-title">
      <header className={styles.sectionHead}><div><h2 id="sent-offers-title">Permintaan terkirim</h2><p>Ajakan dan tanggapan sponsor untuk acara ini.</p></div></header>
      {board.status === "loading" ? <Loading>Memuat permintaan…</Loading> : board.status === "error" ? <Notice error>{errorMessage(board.error)} <button className={uiStyles.secondary} onClick={board.reload}>Coba lagi</button></Notice> : board.data && (!board.data.items.length ? <div className={styles.emptyRequests}><h3>Belum ada permintaan</h3><p>Pilih sponsor dari rekomendasi di atas untuk mengirim ajakan pertama.</p></div> : <ul className={styles.sentCards} aria-label="Permintaan sponsor terkirim">{board.data.items.map(item => {
        const sponsor = sponsors.data?.items.find(sponsor => sponsor.id === item.sponsorId);
        return <DetailRow key={item.id} title={item.sponsorName} label={`Lihat permintaan untuk ${item.sponsorName}`} image={sponsor && <SponsorPhoto sponsor={sponsor} />} badge={<><Badge tone={offerTone(item.status)}>{offerLabel[item.status]}</Badge><span>{item.category}{item.amountLabel ? ` · ${item.amountLabel}` : ""}</span></>}>
          {close => <>
            <p>{item.message}</p>
            <p>Dikirim {new Date(item.createdAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long" })}</p>
            {item.proposalUrl && <p><a href={item.proposalUrl} target="_blank" rel="noopener noreferrer">Buka dokumen proposal</a></p>}
            <FollowUpForm item={item} />
            <button className={uiStyles.secondary} onClick={close}>Tutup</button>
          </>}
        </DetailRow>;
      })}</ul>)}
    </section>
  </>;
}
