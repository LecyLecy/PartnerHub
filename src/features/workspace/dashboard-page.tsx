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

type Loaders = { loadEvents: (key:string,signal:AbortSignal)=>Promise<EventList>; loadSummary: (key:string,signal:AbortSignal)=>Promise<OrganizerSummary> };
type Row = EventRecord & { registered: number | null; applications: number | null; sponsors: number | null };
const statusLabel = { DRAFT: "Draft", PUBLISHED: "Terpublikasi", CLOSED: "Selesai", ARCHIVED: "Arsip" } as const;
const when = (iso: string | null) => iso ? `${new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" })} WIB` : "Jadwal belum ditentukan";
const count = (value: number | null) => value === null ? "-" : value;

export default function DashboardPage(props: Loaders) { return <ProtectedPage><Dashboard {...props}/></ProtectedPage>; }

const columns: readonly Column<Row>[] = [
  { key: "title", header: "Acara", sortValue: (row) => row.title, render: (row) => <div className={styles.titleCell}>
    <h2 className={styles.rowTitle}><Link href={`/events/${row.id}`}>{row.title}</Link></h2>
    <span>{when(row.startsAt)}{row.venue ? ` · ${row.venue}` : ""}</span>
    <span>{row.branding.organizationName}</span>
  </div> },
  { key: "status", header: "Status", sortValue: (row) => statusLabel[row.status], render: (row) => <Badge tone={row.status === "PUBLISHED" ? "success" : "neutral"}>{statusLabel[row.status]}</Badge> },
  { key: "registered", header: "Pendaftar", sortValue: (row) => row.registered ?? -1, render: (row) => row.registered === null ? "-" : <span className={styles.fill}>
    {row.capacity ? <Meter value={row.registered} max={row.capacity} label={`Kapasitas terisi ${row.title}`} /> : null}
    <span>{row.capacity ? `${row.registered}/${row.capacity}` : row.registered}</span>
  </span> },
  { key: "applications", header: "Lamaran", sortValue: (row) => row.applications ?? -1, render: (row) => count(row.applications) },
  { key: "sponsors", header: "Sponsor", sortValue: (row) => row.sponsors ?? -1, render: (row) => count(row.sponsors) },
  { key: "actions", header: "Aksi", render: (row) => <Link className={uiStyles.secondary} href={`/events/${row.id}/edit`} aria-label={`${row.status === "DRAFT" ? "Edit event" : "Periksa akses edit"} ${row.title}`}>{row.status === "DRAFT" ? "Edit event" : "Periksa akses edit"}</Link> },
];

function Dashboard({ loadEvents, loadSummary }: Loaders) {
  const resource = useResource("events", loadEvents);
  const summary = useResource("organizer-summary", loadSummary);
  const auth = useSession();
  const router = useRouter();
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all");
  const name = auth.session?.account.displayName?.trim();
  const rows = useMemo<Row[]>(() => (resource.data?.items ?? []).map((item) => {
    const line = summary.data?.events.find((entry) => entry.eventId === item.id);
    return { ...item, registered: line ? line.registered : null, applications: line ? line.applications : null, sponsors: line ? line.sponsors : null };
  }), [resource.data, summary.data]);
  const shown = rows.filter((item) => item.title.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")) && (status === "all" || item.status === status));
  const total = (pick: (entry: OrganizerSummary["events"][number]) => number) => summary.data?.events.reduce((sum, entry) => sum + pick(entry), 0);
  const registered = total((entry) => entry.registered), applications = total((entry) => entry.applications), sponsors = total((entry) => entry.sponsors);
  return <>
    <PageHeader title={name ? `Halo, ${name}.` : "Acara yang kamu kelola"} action={<Link className={uiStyles.primary} href="/events/new">Susun event baru</Link>}>
      {name ? "Acara yang kamu kelola. Lanjutkan draft dan pantau pendaftaran." : "Lanjutkan draft dan pantau pendaftaran acara milikmu."}
    </PageHeader>
    {registered !== undefined && applications !== undefined && sponsors !== undefined && <StatGrid items={[{ label: "pendaftar", value: registered }, { label: "lamaran panitia", value: applications }, { label: "sponsor", value: sponsors }]} />}
    {summary.status === "error" && <Notice error>{errorMessage(summary.error)} <button className={uiStyles.secondary} onClick={summary.reload}>Muat ulang ringkasan</button></Notice>}
    <section aria-label="Daftar acara">
    {resource.status === "loading" ? <SkeletonCards label="Memuat event kamu…" count={3} />
      : resource.status === "error" ? <Notice error>{errorMessage(resource.error)} <button className={uiStyles.secondary} onClick={resource.reload}>Muat ulang event</button></Notice>
      : !resource.data?.items.length ? <div className={styles.empty}><EmptyState title="Event berikutnya mulai di sini." href="/events/new" action="Susun event pertama">Buat draft, isi detail yang sudah kamu tahu, lalu lanjutkan melengkapinya ketika siap.</EmptyState></div>
      : <>
      <div className={styles.filters}><label>Cari event<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nama event"/></label><label>Status<select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">Semua</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Terpublikasi</option><option value="CLOSED">Selesai</option><option value="ARCHIVED">Arsip</option></select></label></div>
      {shown.length > 0 && <DataTable caption="Acara yang kamu kelola" columns={columns} rows={shown} rowKey={(row) => row.id} onRowClick={(row) => router.push(`/events/${row.id}`)} />}
      {!shown.length && <section className={styles.noResults} role="status"><h2>Tidak ada event yang cocok.</h2><button className={uiStyles.secondary} onClick={()=>{setQuery("");setStatus("all");}}>Reset pencarian</button></section>}
    </>}
    </section>
  </>;
}
