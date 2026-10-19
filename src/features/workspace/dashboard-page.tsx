"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useResource } from "@/lib/use-resource";
import { errorMessage } from "@/lib/api-client";
import { useSession } from "@/lib/session";
import { Badge, DataTable, EmptyState, Meter, Notice, PageHeader, ProtectedPage, SkeletonCards, StatGrid, uiStyles, type Column } from "@/lib/ui";
// Shared transport contract, not another feature's implementation (the boundary glob also matches its filename).
// eslint-disable-next-line no-restricted-imports
import type { EventList, EventRecord } from "@/contracts/event";
import styles from "./dashboard.module.css";
import type { OrganizerSummary } from "@/contracts/participation";
import { Icon } from "@/lib/ui/icons";

type Loaders = { loadEvents: (key:string,signal:AbortSignal)=>Promise<EventList>; loadSummary: (key:string,signal:AbortSignal)=>Promise<OrganizerSummary>; archive?: boolean; isReady?: (event: EventRecord) => boolean };
type Row = EventRecord & { registered: number | null; applications: number | null; sponsors: number | null; ready?: boolean };
const statusLabel = { DRAFT: "Siap diunggah", PUBLISHED: "Terpublikasi", CLOSED: "Selesai", ARCHIVED: "Acara selesai diarsipkan" } as const;
const when = (iso: string | null) => iso ? `${new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" })} WIB` : "Jadwal belum ditentukan";
const count = (value: number | null) => value === null ? "-" : value;
const rowStatus = (row: Row) => row.status === "DRAFT" && row.ready === false ? "Perlu dilengkapi" : statusLabel[row.status];

export default function DashboardPage(props: Loaders) { return <ProtectedPage><Dashboard {...props}/></ProtectedPage>; }

const columns: readonly Column<Row>[] = [
  { key: "title", header: "Acara", sortValue: (row) => row.title, render: (row) => <div className={styles.titleCell}>
    <h2 className={styles.rowTitle}><Link href={`/events/${row.id}`}>{row.title}</Link></h2>
    <span>{when(row.startsAt)}{row.venue ? ` · ${row.venue}` : ""}</span>
    <span>{row.branding.organizationName}</span>
  </div> },
  { key: "status", header: "Status", sortValue: rowStatus, render: (row) => <span className={styles.rowStatus}><Badge tone={row.status === "PUBLISHED" ? "success" : "neutral"}>{rowStatus(row)}</Badge></span> },
  { key: "registered", header: "Pendaftar", sortValue: (row) => row.registered ?? -1, render: (row) => row.registered === null ? "-" : <span className={styles.fill}>
    {row.capacity ? <Meter value={row.registered} max={row.capacity} label={`Kapasitas terisi ${row.title}`} /> : null}
    <span>{row.capacity ? `${row.registered}/${row.capacity}` : row.registered}</span>
  </span> },
  { key: "applications", header: "Lamaran", sortValue: (row) => row.applications ?? -1, render: (row) => count(row.applications) },
  { key: "sponsors", header: "Sponsor", sortValue: (row) => row.sponsors ?? -1, render: (row) => count(row.sponsors) },
  { key: "actions", header: "Kelola", render: (row) => <Link className={uiStyles.secondary} href={`/events/${row.id}`} aria-label={`Kelola acara: ${row.title}`}>Kelola acara</Link> },
];

function Dashboard({ loadEvents, loadSummary, archive = false, isReady }: Loaders) {
  const resource = useResource("events", loadEvents);
  const summary = useResource("organizer-summary", loadSummary);
  const auth = useSession();
  const router = useRouter();
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all");
  const name = auth.session?.account.displayName?.trim();
  const rows = useMemo<Row[]>(() => (resource.data?.items ?? []).filter(item => archive ? item.status === "DRAFT" : item.status !== "DRAFT").map((item) => {
    const line = summary.data?.events.find((entry) => entry.eventId === item.id);
    return { ...item, ready: isReady?.(item), registered: line ? line.registered : null, applications: line ? line.applications : null, sponsors: line ? line.sponsors : null };
  }), [resource.data, summary.data, archive, isReady]);
  const shown = rows.filter((item) => item.title.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")) && (status === "all" || item.status === status));
  const total = (pick: (entry: OrganizerSummary["events"][number]) => number) => summary.data?.events.reduce((sum, entry) => sum + pick(entry), 0);
  const registered = total((entry) => entry.registered), applications = total((entry) => entry.applications), sponsors = total((entry) => entry.sponsors);
  return <div className={styles.dashboard}>
    <PageHeader title={archive ? "Arsip acara" : "Event kamu"} action={<Link className={uiStyles.primary} href="/events/new"><Icon name="plus" size={20} />Susun event baru</Link>}>
      {archive ? "Acara yang selesai disusun belum terlihat publik. Pilih acara untuk mengunggahnya." : name ? `Halo, ${name}. Kelola acara yang sudah dipublikasikan.` : "Kelola acara yang sudah dipublikasikan."}
    </PageHeader>
    {!archive && <div className={styles.summary}>{registered !== undefined && applications !== undefined && sponsors !== undefined && <StatGrid items={[{ label: "pendaftar", value: registered }, { label: "lamaran panitia", value: applications }, { label: "sponsor", value: sponsors }]} />}</div>}
    {summary.status === "error" && <Notice error>{errorMessage(summary.error)} <button className={uiStyles.secondary} onClick={summary.reload}>Muat ulang ringkasan</button></Notice>}
    <section aria-label="Daftar acara" className={styles.eventList}>
    {resource.status === "loading" ? <SkeletonCards label="Memuat event kamu…" count={3} />
      : resource.status === "error" ? <Notice error>{errorMessage(resource.error)} <button className={uiStyles.secondary} onClick={resource.reload}>Muat ulang event</button></Notice>
      : !rows.length ? <div className={styles.empty}><EmptyState title={archive ? "Belum ada acara siap diunggah." : "Belum ada acara terpublikasi."} href={archive ? "/events/new" : "/organizer/archive"} action={archive ? "Susun event pertama" : "Buka Arsip acara"}>Selesaikan susunan acara, lalu unggah dari Arsip acara.</EmptyState></div>
      : <>
      <div className={styles.filters}><label>Cari event<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nama event"/></label>{!archive && <label>Status<select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">Semua</option><option value="PUBLISHED">Terpublikasi</option><option value="CLOSED">Selesai</option><option value="ARCHIVED">Acara selesai diarsipkan</option></select></label>}</div>
      {shown.length > 0 && <DataTable caption={archive ? "Acara siap diunggah" : "Acara yang kamu kelola"} columns={archive ? columns.filter(column => ["title", "status", "actions"].includes(column.key)) : columns} rows={shown} rowKey={(row) => row.id} onRowClick={(row) => router.push(`/events/${row.id}`)} />}
      {!shown.length && <section className={styles.noResults} role="status"><h2>Tidak ada event yang cocok.</h2><button className={uiStyles.secondary} onClick={()=>{setQuery("");setStatus("all");}}>Reset pencarian</button></section>}
    </>}
    </section>
  </div>;
}
