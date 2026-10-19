"use client";
import Link from "next/link";
import { errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { Badge, DetailSection, EmptyState, EventGrid, InfoCard, Notice, SelectionSteps, SkeletonCards, uiStyles } from "@/lib/ui";
import type { CommitteeApplication } from "@/contracts/committee";
import { listMyApplications } from "./services/committee-service";
import { applicationLabel, applicationTone, selectionPath } from "./selection-path";
import styles from "./committee.module.css";

const coverOf = (item: CommitteeApplication) => ({ organization: item.organizationName, organizationLogoUrl: item.organizationLogoUrl, imageUrl: item.eventLogoUrl, title: item.eventTitle });

function ApplicationCard({ item, tone }: { item: CommitteeApplication; tone: number }) {
  const path = selectionPath(item);
  const current = path.find((step) => step.state === "current" || step.state === "stopped");
  return <InfoCard cover={coverOf(item)} tone={tone} badge={<Badge tone={applicationTone(item.status)}>{applicationLabel[item.status]}</Badge>}
    summary={<>{item.status !== "ACCEPTED" && <p className={styles.cardLine}>{current ? `Tahap: ${current.label}` : "Selesai"}</p>}<p className={styles.muted}>Divisi: {item.divisions.join(", ")}</p>{item.status === "ACCEPTED" && item.canScanQr && <p><Link className={uiStyles.primary} aria-label={`Scan QR peserta ${item.eventTitle}`} href={`/me/committee/${encodeURIComponent(item.eventId)}/scan`}>Scan QR peserta</Link></p>}</>}
    detail={() => <>
      <DetailSection title="Proses seleksi"><SelectionSteps steps={path} label={`Proses seleksi ${item.eventTitle}`} /></DetailSection>
      <div className={styles.chipGroup}><span className={styles.chipLabel}>Divisi pilihan</span><ul className={styles.chips}>{item.divisions.map((name) => <li key={name}>{name}</li>)}</ul></div>
      {item.status === "ACCEPTED" && item.note && <aside className={styles.nextSteps} aria-label="Langkah berikutnya"><strong>Langkah berikutnya</strong><p>{item.note}</p></aside>}
      {item.status !== "ACCEPTED" && item.note && <p className={styles.note}>Catatan penyelenggara: {item.note}</p>}
    </>} />;
}

/** The participant's own committee applications. Used by the composed "Acara saya" page. */
export function MyApplications() {
  const applications = useResource("my-applications", listMyApplications);
  return <section className={styles.panel} aria-labelledby="my-applications-title">
    <div className={styles.panelHead}><h2 id="my-applications-title">Kepanitiaan</h2><p>Lamaran panitia yang sudah kamu kirim, lengkap dengan tahapan seleksinya.</p></div>
    {applications.status === "loading" ? <SkeletonCards label="Memuat lamaran…" count={2} />
      : applications.status === "error" ? <Notice error>{errorMessage(applications.error)} <button className={uiStyles.secondary} onClick={applications.reload}>Muat ulang</button></Notice>
      : !applications.data?.length ? <EmptyState title="Belum ada lamaran." href="/committee" action="Lihat lowongan panitia">Lamaran yang kamu kirim muncul di sini.</EmptyState>
      : <EventGrid>{applications.data.map((item, index) => <ApplicationCard key={item.id} item={item} tone={index} />)}</EventGrid>}
  </section>;
}
