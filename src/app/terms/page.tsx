import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle, SiteFrame } from "@/lib/ui";
import uiStyles from "@/lib/ui.module.css";

export const metadata: Metadata = { title: "Syarat & Ketentuan" };

export default function Page() {
  return <SiteFrame><section className={uiStyles.readingPage}>
    <PageTitle title="Syarat & Ketentuan">Panduan penggunaan akun, acara dan kerja sama di PartnerHub.</PageTitle>
    <h2>Akun dan akses</h2>
    <p>Gunakan informasi akun yang sesuai. Akses pengelolaan acara mengikuti peran dan penugasan pada acara tersebut.</p>
    <h2>Pendaftaran acara</h2>
    <p>Periksa jadwal, persyaratan, harga tiket dan petunjuk pendaftaran sebelum mengirim data. Untuk tiket berbayar, penyelenggara meninjau bukti pembayaran sebelum memberikan konfirmasi.</p>
    <h2>Kerja sama sponsor</h2>
    <p>Rekomendasi membantu menemukan pihak yang relevan. Proposal, benefit dan persetujuan kerja sama ditentukan oleh penyelenggara dan sponsor, bukan hasil yang dijamin otomatis.</p>
    <div className={uiStyles.actions}><Link className={uiStyles.primary} href="/">Kembali ke beranda</Link></div>
  </section></SiteFrame>;
}
