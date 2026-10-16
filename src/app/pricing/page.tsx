import Link from "next/link";
import type { Metadata } from "next";
import { Notice, SiteFrame } from "@/lib/ui";
import styles from "@/features/workspace/landing.module.css";

export const metadata: Metadata = { title: "Harga" };

export default function Page() {
  return <SiteFrame><article className={styles.info}>
    <h1>Harga</h1>
    <Notice><strong>Model harga belum ditetapkan.</strong> Belum ada paket, angka, atau masa percobaan yang berlaku.</Notice>
    <p>PartnerHub masih dalam pengembangan, dan keputusan harga belum diambil. Halaman ini akan diperbarui setelah ada keputusan resmi.</p>
    <p><Link href="/about">Baca status produk</Link></p>
  </article></SiteFrame>;
}
