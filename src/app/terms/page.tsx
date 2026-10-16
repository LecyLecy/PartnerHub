import Link from "next/link";
import type { Metadata } from "next";
import { Notice, PageTitle, SiteFrame } from "@/lib/ui";
import uiStyles from "@/lib/ui.module.css";

export const metadata: Metadata = { title: "Syarat & Ketentuan" };

export default function Page() {
  return <SiteFrame><section className={uiStyles.readingPage}>
    <PageTitle title="Syarat & Ketentuan">Status dokumen hukum PartnerHub.</PageTitle>
    <Notice><strong>Belum final.</strong> Teks hukum PartnerHub belum ditulis dan belum ditinjau.</Notice>
    <h2>Sebelum digunakan dengan data nyata</h2>
    <p>Pemilik produk perlu melengkapi ketentuan bersama penasihat hukum. Halaman ini tidak berisi ketentuan karangan dan belum menjadi dokumen hukum final.</p>
    <div className={uiStyles.actions}><Link className={uiStyles.primary} href="/">Kembali ke beranda</Link></div>
  </section></SiteFrame>;
}
