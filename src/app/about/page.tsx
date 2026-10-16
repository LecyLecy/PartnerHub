import Link from "next/link";
import type { Metadata } from "next";
import { SiteFrame } from "@/lib/ui";
import styles from "@/features/workspace/landing.module.css";

export const metadata: Metadata = { title: "Tentang PartnerHub" };

export default function Page() {
  return <SiteFrame><article className={styles.info}>
    <h1>Tentang PartnerHub</h1>
    <p>PartnerHub adalah ruang kerja untuk tim kampus dan komunitas yang menyiapkan acara: membuat dan mempublikasikan acara, membuka pendaftaran, merekrut panitia, dan mengelola dukungan sponsor.</p>
    <h2>Yang bukan PartnerHub</h2>
    <p>Bukan marketplace tiket nasional, bukan pemroses pembayaran, bukan jejaring sosial, dan bukan sistem CRM atau HR umum.</p>
    <h2>Status saat ini</h2>
    <ul>
      <li>Pendaftaran peserta, rekrutmen panitia, dan permintaan sponsor dua arah sudah tersedia di antarmuka.</li>
      <li>Demo menghubungkan publikasi acara, pendaftaran, panitia, QR masuk/keluar opsional, proposal, dan bukti sponsor dengan data fiktif di browser.</li>
      <li>Backend produksi, email, dan pembayaran nyata tidak diaktifkan pada demo kelas ini.</li>
      <li>Penyelenggara dan sponsor memerlukan verifikasi email dan pemeriksaan admin.</li>
    </ul>
    <p><Link href="/register">Pilih peranmu</Link></p>
  </article></SiteFrame>;
}
