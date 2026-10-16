"use client";
import Link from "next/link";
import { useState } from "react";
// The import boundary glob also matches this shared transport contract's filename.
// eslint-disable-next-line no-restricted-imports
import type { EventList } from "@/contracts/event";
import { errorMessage } from "@/lib/api-client";
import { exportTime } from "@/lib/export";
import { useResource } from "@/lib/use-resource";
import { Badge, EmptyState, Notice, PageHeader, ProtectedPage, SkeletonCards, uiStyles } from "@/lib/ui";
import { DetailRow } from "./detail-row";
import { FollowUpForm } from "./follow-up-form";
import { offerLabel, offerTone } from "./offer-status";
import { getOfferBoard } from "./services/offer-service";
import { decideProposal, listEventProposals } from "./services/sponsorship-service";
import styles from "./organizer-sponsorship.module.css";

type LoadEvents = (key: string, signal: AbortSignal) => Promise<EventList>;
const proposalLabel = { SENT: "Terkirim", IN_REVIEW: "Ditinjau", ACCEPTED: "Diterima", DECLINED: "Ditolak" } as const;
const proposalTone = { SENT: "info", IN_REVIEW: "warning", ACCEPTED: "success", DECLINED: "danger" } as const;
const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);

// The key holds ids from the validated event list, not user input or a second event-service implementation.
async function loadOutgoing(key: string, signal: AbortSignal) {
  const ids: string[] = JSON.parse(key);
  const boards = await Promise.all(ids.map((id) => getOfferBoard(id, signal)));
  return boards.flatMap((board) => board.items).sort(newestFirst);
}
async function loadIncoming(key: string, signal: AbortSignal) {
  const ids: string[] = JSON.parse(key);
  const lists = await Promise.all(ids.map((id) => listEventProposals(id, signal)));
  return lists.flat().sort(newestFirst);
}

export default function OrganizerSponsorshipPage({ loadEvents }: { loadEvents: LoadEvents }) {
  return <ProtectedPage><Page loadEvents={loadEvents} /></ProtectedPage>;
}

function Page({ loadEvents }: { loadEvents: LoadEvents }) {
  const events = useResource("sponsorship-events", loadEvents);
  return <>
    <PageHeader title="Status sponsor.">Pantau permintaan dukungan yang kamu kirim dan proposal yang masuk untuk seluruh acaramu.</PageHeader>
    {events.status === "loading" ? <SkeletonCards label="Memuat status sponsor…" count={2} />
      : events.status === "error" ? <Notice error>{errorMessage(events.error)} <button type="button" className={uiStyles.secondary} onClick={events.reload}>Muat ulang acara</button></Notice>
      : events.data && <Boards eventKey={JSON.stringify(events.data.items.map((event) => event.id))} />}
  </>;
}

function Boards({ eventKey }: { eventKey: string }) {
  const outgoing = useResource(eventKey, loadOutgoing);
  const incoming = useResource(eventKey, loadIncoming);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  async function decide(eventId: string, proposalId: string, status: "IN_REVIEW" | "ACCEPTED" | "DECLINED") {
    setBusy(true); setFailure("");
    try { await decideProposal(eventId, proposalId, status); incoming.reload(); }
    catch (error) { setFailure(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <div className={styles.boards}>
    <section className={styles.panel} aria-labelledby="outgoing-title">
      <div className={styles.panelHead}><h2 id="outgoing-title">Permintaan terkirim</h2>{outgoing.data && <span className={styles.count} aria-label={`${outgoing.data.length} permintaan`}>{outgoing.data.length}</span>}</div>
      <p className={styles.hint}>Dukungan yang kamu ajukan ke perusahaan sponsor.</p>
      <div className={styles.scroll} role="region" aria-label="Daftar permintaan terkirim" tabIndex={0}>
        {outgoing.status === "loading" ? <SkeletonCards label="Memuat permintaan…" count={2} />
          : outgoing.status === "error" ? <Notice error>{errorMessage(outgoing.error)} <button type="button" className={uiStyles.secondary} onClick={outgoing.reload}>Muat ulang permintaan</button></Notice>
          : !outgoing.data?.length ? <EmptyState title="Belum ada permintaan." href="/organizer" action="Pilih acara">Buka Ajak sponsor pada acaramu untuk mengirim permintaan dukungan.</EmptyState>
          : <ul className={styles.list}>{outgoing.data.map((item) => <DetailRow key={item.id} title={item.sponsorName} label={`Permintaan ke ${item.sponsorName}: ${item.eventTitle}`} badge={<><Badge tone={offerTone(item.status)}>{offerLabel[item.status]}</Badge><span className={styles.eventName}>{item.eventTitle}</span></>}>
            {(close) => <>
              <dl className={styles.detailFacts}><div><dt>Jenis dukungan</dt><dd>{item.category}</dd></div><div><dt>Nilai dukungan</dt><dd>{item.amountLabel || "Tidak dicantumkan"}</dd></div><div><dt>Dikirim pada</dt><dd>{exportTime(item.createdAt)}</dd></div></dl>
              <section className={styles.message}><h3>Pesan permintaan</h3><p>{item.message}</p></section>
              {item.proposalUrl && <a href={item.proposalUrl} target="_blank" rel="noopener noreferrer">Buka dokumen proposal</a>}
              <FollowUpForm item={item} />
              <div className={styles.dialogActions}><button type="button" className={uiStyles.secondary} onClick={close}>Tutup</button><Link className={uiStyles.primary} href={`/events/${item.eventId}/sponsors`}>Buka sponsor acara</Link></div>
            </>}
          </DetailRow>)}</ul>}
      </div>
    </section>
    <section className={styles.panel} aria-labelledby="incoming-title">
      <div className={styles.panelHead}><h2 id="incoming-title">Proposal masuk</h2>{incoming.data && <span className={styles.count} aria-label={`${incoming.data.length} proposal`}>{incoming.data.length}</span>}</div>
      <p className={styles.hint}>Penawaran yang perusahaan sponsor kirim ke acaramu.</p>
      {failure && <Notice error>{failure}</Notice>}
      <div className={styles.scroll} role="region" aria-label="Daftar proposal masuk" tabIndex={0}>
        {incoming.status === "loading" ? <SkeletonCards label="Memuat proposal…" count={2} />
          : incoming.status === "error" ? <Notice error>{errorMessage(incoming.error)} <button type="button" className={uiStyles.secondary} onClick={incoming.reload}>Muat ulang proposal</button></Notice>
          : !incoming.data?.length ? <EmptyState title="Belum ada proposal.">Proposal tampil di sini ketika sponsor mengirim penawaran untuk acaramu.</EmptyState>
          : <ul className={styles.list}>{incoming.data.map((item) => <DetailRow key={item.id} title={item.sponsorName} label={`Proposal ${item.sponsorName}: ${item.eventTitle}`} badge={<><Badge tone={proposalTone[item.status]}>{proposalLabel[item.status]}</Badge><span className={styles.eventName}>{item.eventTitle}</span></>}>
            {(close) => <>
              <dl className={styles.detailFacts}><div><dt>Jenis dukungan</dt><dd>{item.category}</dd></div><div><dt>Nilai penawaran</dt><dd>{item.amountLabel || "Tidak dicantumkan"}</dd></div><div><dt>Dikirim pada</dt><dd>{exportTime(item.createdAt)}</dd></div></dl>
              <section className={styles.message}><h3>Detail penawaran</h3><p>{item.offer}</p></section>
              {(item.status === "SENT" || item.status === "IN_REVIEW") && <div className={styles.dialogActions}>{item.status === "SENT" && <button className={uiStyles.secondary} disabled={busy} onClick={() => void decide(item.eventId, item.id, "IN_REVIEW")}>Tinjau proposal</button>}<button className={uiStyles.primary} disabled={busy} onClick={() => void decide(item.eventId, item.id, "ACCEPTED")}>Terima proposal</button><button className={uiStyles.secondary} disabled={busy} onClick={() => void decide(item.eventId, item.id, "DECLINED")}>Tolak proposal</button></div>}
              {item.status === "ACCEPTED" && <Link className={uiStyles.primary} href={`/events/${item.eventId}/report`}>Catat benefit dan bukti</Link>}
              <div className={styles.dialogActions}><button type="button" className={uiStyles.secondary} onClick={close}>Tutup</button><Link className={uiStyles.primary} href={`/events/${item.eventId}`}>Buka acara</Link></div>
            </>}
          </DetailRow>)}</ul>}
      </div>
    </section>
  </div>;
}
