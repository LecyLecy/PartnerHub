"use client";
import { errorMessage } from "@/lib/api-client";
import Link from "next/link";
import { useResource } from "@/lib/use-resource";
import { Badge, Loading, Notice, PageTitle, ProtectedPage, uiStyles } from "@/lib/ui";
import { getVerificationInfo } from "./services/account-service";
import styles from "./account.module.css";

const copy = {
  pending_verification: ["Akunmu sedang diverifikasi.", "Admin memeriksa data dan dokumenmu. Sampai disetujui, kamu hanya dapat melihat halaman ini dan mengubah profil. Membuat acara, mengirim proposal, dan fitur lain belum tersedia."],
  rejected: ["Verifikasi belum disetujui.", "Admin belum dapat menyetujui akunmu. Periksa catatan dan data yang dikirim. Perbaikan dokumen dan pengajuan ulang belum tersedia dari halaman ini."],
  active: ["Akunmu sudah aktif.", "Verifikasi selesai. Muat ulang halaman atau masuk kembali untuk membuka dashboardmu."],
} as const;

export default function VerificationPage() { return <ProtectedPage><Status/></ProtectedPage>; }

function Status() {
  const resource = useResource("verification", (_key, signal) => getVerificationInfo(signal));
  if (resource.status === "loading") return <Loading>Memuat status verifikasi…</Loading>;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button></Notice>;
  const info = resource.data!;
  const [title, text] = copy[info.status];
  return <div className={styles.onboarding}>
    <Badge tone={info.status === "active" ? "success" : info.status === "rejected" ? "danger" : "warning"}>{info.status === "active" ? "Aktif" : info.status === "rejected" ? "Belum disetujui" : "Menunggu pemeriksaan"}</Badge>
    <PageTitle title={title}>{text}</PageTitle>
    <p className={styles.accountHint}>Dikirim pada {new Date(info.submittedAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long" })}.</p>
    {info.reviewNote && <Notice error>{info.reviewNote}</Notice>}
    <div className={styles.statusActions}><button className={uiStyles.primary} onClick={resource.reload}>Periksa status lagi</button><Link className={uiStyles.tertiary} href="/settings">Lihat profil akun</Link></div>
    <section className={styles.accountSection}><h2>Data yang dikirim</h2><dl className={styles.detailList}>{info.summary.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></section>
    <section className={styles.accountSection}><h2>Dokumen</h2>{info.documents.length ? <ul className={styles.documentList}>{info.documents.map((doc) => <li key={doc.label}><strong>{doc.label}</strong><span>{doc.name}</span></li>)}</ul> : <p className={styles.accountHint}>Belum ada dokumen tercatat.</p>}</section>
  </div>;
}
