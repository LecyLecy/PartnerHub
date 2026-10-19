"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
// eslint-disable-next-line no-restricted-imports -- Shared event transport, not event feature internals.
import type { EventList } from "@/contracts/event";
import { errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { SelectField } from "@/lib/form/fields";
import { Breadcrumb, EmptyState, Loading, Notice, PageTitle, ProtectedPage, uiStyles } from "@/lib/ui";
import { getSponsorDirectory } from "./services/matching-service";
import { SponsorCards, inviteHref } from "./sponsor-directory";
import { sponsorCatalog } from "./sponsor-catalog";
import styles from "./matching.module.css";

type LoadEvents = (key: string, signal: AbortSignal) => Promise<EventList>;
export default function SponsorExplorePage({ loadEvents }: { loadEvents: LoadEvents }) {
  return <ProtectedPage><Catalog loadEvents={loadEvents} /></ProtectedPage>;
}
function Catalog({ loadEvents }: { loadEvents: LoadEvents }) {
  const router = useRouter();
  const query = useSearchParams();
  const eventId = query.get("eventId") || "";
  const sponsorId = query.get("sponsorId") || "";
  const search = query.get("q") || "";
  const sponsors = useResource("sponsor-directory", getSponsorDirectory);
  const events = useResource("invitation-events", loadEvents);
  const [chosenEvent, setChosenEvent] = useState("");
  const eligibleEvents = events.data?.items.filter(event => event.status === "PUBLISHED") ?? [];
  const event = eligibleEvents.find(event => event.id === eventId);
  const sponsor = sponsors.data?.find(sponsor => sponsor.id === sponsorId);
  const page = sponsorCatalog(sponsors.data ?? [], search, Number(query.get("page") || 1));
  return <>
    <Breadcrumb href={eventId ? `/events/${encodeURIComponent(eventId)}/sponsors` : sponsorId ? "/organizer/sponsors" : "/organizer"} parent={eventId ? "Ajak sponsor" : "Sponsorship"} current={sponsorId ? "Pilih acara" : "Jelajahi sponsor"} />
    <PageTitle title={sponsorId ? "Pilih acara untuk ajakan" : "Jelajahi sponsor"}>{sponsorId ? "Tentukan acara sebelum menyiapkan permintaan dukungan." : "Cari perusahaan sponsor berdasarkan nama atau bidang usaha."}</PageTitle>
    {sponsors.status === "loading" || events.status === "loading" ? <Loading>Memuat katalog sponsor…</Loading> : sponsors.status === "error" || events.status === "error" ? <Notice error>{errorMessage(sponsors.error || events.error)} <button className={uiStyles.secondary} onClick={() => { sponsors.reload(); events.reload(); }}>Coba lagi</button></Notice> : sponsorId ? !sponsor ? <EmptyState title="Sponsor tidak tersedia" href="/organizer/sponsors" action="Jelajahi sponsor">Pilih sponsor terverifikasi dari katalog.</EmptyState> : <section className={styles.formPanel} aria-labelledby="event-choice-title">
      <h2 id="event-choice-title">{sponsor.companyName}</h2><p>{sponsor.industry}</p>
      {!eligibleEvents.length ? <EmptyState title="Belum ada acara terpublikasi" href="/organizer" action="Lihat acara">Publikasikan acara terlebih dahulu sebelum mengirim ajakan.</EmptyState> : <form className={uiStyles.form} onSubmit={event => { event.preventDefault(); if (eligibleEvents.some(item => item.id === chosenEvent)) router.push(inviteHref(sponsor.id, chosenEvent)); }}>
        <SelectField name="eventId" label="Acara" value={chosenEvent} onChange={setChosenEvent} placeholder="Pilih acara" options={eligibleEvents.map(event => ({ value: event.id, label: event.title }))} />
        <button className={uiStyles.primary} disabled={!chosenEvent}>Lanjutkan ajakan</button>
      </form>}
    </section> : <>
      {eventId && <Notice>{event ? <>Ajakan untuk <strong>{event.title}</strong>.</> : "Acara tidak tersedia untuk ajakan. Buka katalog dari acara yang sudah dipublikasikan."}</Notice>}
      <section className={styles.catalog} aria-labelledby="catalog-title"><h2 id="catalog-title">Semua sponsor</h2>
        <form className={styles.searchForm} action="/organizer/sponsors" method="get">{eventId && <input type="hidden" name="eventId" value={eventId} />}<label>Cari sponsor<input key={search} className={styles.search} name="q" type="search" defaultValue={search} maxLength={150} placeholder="Nama perusahaan atau bidang" /></label><button className={uiStyles.primary}>Cari</button></form>
        <p role="status">{page.total} sponsor{search ? ` untuk “${search}”` : ""}</p>
        {!page.total ? <><EmptyState title={search ? "Sponsor tidak ditemukan" : "Belum ada sponsor terverifikasi"}>{search ? "Coba nama perusahaan atau bidang lain." : "Sponsor tampil setelah akunnya disetujui."}</EmptyState>{search && <form action="/organizer/sponsors" method="get">{eventId && <input type="hidden" name="eventId" value={eventId} />}<button className={uiStyles.secondary}>Hapus pencarian</button></form>}</> : <SponsorCards items={page.items} label="Semua sponsor" eventId={event?.id} canInvite={!eventId || Boolean(event)} />}
        {page.pages > 1 && <nav className={styles.pagination} aria-label="Halaman sponsor">
          <CatalogPageButton label="Sebelumnya" page={page.page - 1} eventId={eventId} search={search} disabled={page.page <= 1} />
          <span aria-current="page">Halaman {page.page} dari {page.pages}</span>
          <CatalogPageButton label="Berikutnya" page={page.page + 1} eventId={eventId} search={search} disabled={page.page >= page.pages} />
        </nav>}
      </section>
    </>}
  </>;
}
function CatalogPageButton({ label, page, eventId, search, disabled }: { label: string; page: number; eventId: string; search: string; disabled: boolean }) {
  return <form action="/organizer/sponsors" method="get">
    {eventId && <input type="hidden" name="eventId" value={eventId} />}
    {search && <input type="hidden" name="q" value={search} />}
    <input type="hidden" name="page" value={page} />
    <button className={uiStyles.secondary} disabled={disabled}>{label}</button>
  </form>;
}
