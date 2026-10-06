import Link from "next/link";
import type { Metadata } from "next";
import { Notice, PageTitle, SiteFrame } from "@/lib/ui";
import uiStyles from "@/lib/ui.module.css";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default function Page() {
  return <SiteFrame><section className={uiStyles.readingPage}>
    <PageTitle title="Kebijakan Privasi">Status kebijakan penanganan data PartnerHub.</PageTitle>
    <Notice><strong>Belum final.</strong> Kebijakan privasi belum ditulis dan belum ditinjau.</Notice>
    <h2>Keputusan yang masih terbuka</h2>
    <p>Periode penyimpanan, penghapusan akun, dan penanganan dokumen verifikasi masih perlu ditetapkan di dokumen produk.</p>
    <p>Halaman ini tidak membuat klaim keamanan atau penanganan data yang belum dapat dibuktikan. Kebijakan perlu diselesaikan sebelum layanan digunakan dengan data nyata.</p>
    <div className={uiStyles.actions}><Link className={uiStyles.primary} href="/">Kembali ke beranda</Link></div>
  </section></SiteFrame>;
}
