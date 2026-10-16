import Link from "next/link";
import type { Metadata } from "next";
import { Notice, SiteFrame } from "@/lib/ui";
import styles from "@/features/workspace/landing.module.css";

export const metadata: Metadata = { title: "Kontak" };

export default function Page() {
  return <SiteFrame><article className={styles.info}>
    <h1>Kontak</h1>
    <Notice><strong>Kanal kontak resmi belum ditetapkan.</strong> Alamat email dan formulir kontak akan ditambahkan setelah pemilik produk menentukannya.</Notice>
    <p>Sampai saat itu, halaman ini sengaja tidak memuat alamat email atau nomor telepon karangan. Jika kamu sudah punya akun, pengaturan profil ada di halaman Settings.</p>
    <p><Link href="/">Kembali ke beranda</Link></p>
  </article></SiteFrame>;
}
