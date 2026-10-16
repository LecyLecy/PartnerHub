"use client";
import { useRef } from "react";
import { errorMessage } from "@/lib/api-client";
import { downloadXlsx, exportTime, fileSlug } from "@/lib/export";
import { useResource } from "@/lib/use-resource";
import { Breadcrumb, EmptyState, Notice, PageHeader, ProtectedPage, SkeletonCards, StatGrid, uiStyles, useToast } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import type { ApplicantView } from "@/contracts/committee";
import { Applicant } from "./applicant-card";
import { getCommitteeWorkspace } from "./services/committee-service";
import { applicationLabel, selectionPath } from "./selection-path";
import styles from "./committee.module.css";

import type { ApplicantsView } from "./applicants-views";
const views: Record<ApplicantsView, { title: string; lead: string; empty: string; keep: (item: ApplicantView) => boolean }> = {
  pelamar: { title: "Semua pelamar.", lead: "Setiap lamaran yang masuk, apa pun tahapnya. Pindahkan pelamar ke tahap berikutnya dari sini.", empty: "Lamaran muncul di sini setelah lowongan dibuka dan user melamar.", keep: () => true },
  seleksi: { title: "Pelamar dalam seleksi.", lead: "Pelamar yang sedang berada di salah satu tahapan buatanmu.", empty: "Belum ada pelamar di tahapan seleksi.", keep: (item) => item.status === "IN_SELECTION" },
  diterima: { title: "Pelamar yang diterima.", lead: "Panitia yang sudah menerima catatan langkah berikutnya darimu.", empty: "Belum ada pelamar yang diterima.", keep: (item) => item.status === "ACCEPTED" },
};

/** Export of the applicants in view. The spreadsheet is built in the browser from data the organizer already sees. */
function exportApplicants(title: string, label: string, items: ApplicantView[]) {
  const stageName = (item: ApplicantView) => selectionPath(item).find((step) => step.state === "current" || step.state === "stopped")?.label ?? (item.status === "ACCEPTED" ? "Diterima" : "");
  downloadXlsx(`panitia-${label}-${fileSlug(title)}.xlsx`, [{ name: "Panitia", rows: [
    ["No", "Nama", "Divisi pilihan", "Status", "Tahap", "Waktu melamar", "Motivasi", "Pertanyaan khusus", "Jawaban", "Catatan penyelenggara"],
    ...items.map((item, index) => [index + 1, item.applicantName, item.divisions.join(", "), applicationLabel[item.status], stageName(item), exportTime(item.createdAt), item.motivation, item.question ?? "", item.answer ?? "", item.note ?? ""]),
  ] }]);
}

export default function ApplicantsPage({ id, view }: { id: string; view: ApplicantsView }) { return <ProtectedPage><Screen id={id} view={view} /></ProtectedPage>; }

function Screen({ id, view }: { id: string; view: ApplicantsView }) {
  const resource = useResource(id, getCommitteeWorkspace);
  const toast = useToast();
  const config = views[view];
  const busy = useRef(false);
  if (resource.status === "loading") return <SkeletonCards label="Memuat pelamar…" count={2} />;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button></Notice>;
  const data = resource.data;
  if (!data) return null;
  const shown = data.applications.filter(config.keep);
  function run() {
    if (busy.current || !data) return;
    exportApplicants(data.eventTitle, view, shown);
    toast(`${shown.length} pelamar diekspor ke Excel.`);
  }
  return <>
    <Breadcrumb href={`/events/${id}/committee`} parent="Panitia" current={config.title.replace(/\.$/, "")} />
    <PageHeader title={config.title} action={<button type="button" className={uiStyles.secondary} onClick={run} disabled={!shown.length}><Icon name="download" size={18} />Ekspor Excel</button>}>{config.lead}</PageHeader>
    <StatGrid label="Ringkasan" items={[{ label: "pelamar di layar ini", value: shown.length }, { label: "semua lamaran", value: data.applications.length }]} />
    {!shown.length ? <EmptyState title="Belum ada pelamar.">{config.empty}</EmptyState>
      : <ul className={styles.applicants}>{shown.map((item) => <Applicant key={item.id} eventId={id} item={item} onDone={resource.reload} />)}</ul>}
  </>;
}