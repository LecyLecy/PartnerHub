import Link from "next/link";
import type { Metadata } from "next";
import { SiteFrame } from "@/lib/ui";
import styles from "@/features/workspace/landing.module.css";

export const metadata: Metadata = { title: "Kontak" };

export default function Page() {
  return <SiteFrame><article className={styles.info}>
    <h1>Kontak</h1>
    <p>Temukan petunjuk untuk menyiapkan acara, mendaftar sebagai peserta atau panitia, dan mengelola kerja sama sponsor.</p>
    <h2>Panduan penggunaan</h2>
    <p><Link href="/guide">Buka panduan PartnerHub</Link> untuk mengikuti alur dari pembuatan acara sampai laporan.</p>
    <h2>Akun dan profil</h2>
    <p><Link href="/settings">Buka pengaturan akun</Link> untuk memeriksa profil, atau <Link href="/login">masuk ke akun</Link> untuk melanjutkan pekerjaanmu.</p>
    <p><Link href="/">Kembali ke beranda</Link></p>
  </article></SiteFrame>;
}
