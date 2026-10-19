import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle, SiteFrame } from "@/lib/ui";
import uiStyles from "@/lib/ui.module.css";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default function Page() {
  return <SiteFrame><section className={uiStyles.readingPage}>
    <PageTitle title="Kebijakan Privasi">Informasi data yang digunakan dalam alur PartnerHub.</PageTitle>
    <h2>Profil dan pendaftaran</h2>
    <p>Data akun dan profil digunakan untuk mengenali pengguna serta mengisi pendaftaran acara. Periksa data yang dibagikan sebelum mengirim formulir.</p>
    <h2>Tiket dan akses acara</h2>
    <p>QR tiket berisi kode acak, bukan data profil. Penyelenggara menggunakan data pendaftaran untuk mengelola peserta dan mencatat kehadiran.</p>
    <h2>Informasi publik</h2>
    <p>Detail acara yang dipublikasikan dapat dilihat tanpa login. Pendaftaran, proposal dan pengelolaan acara menggunakan akses akun sesuai perannya.</p>
    <div className={uiStyles.actions}><Link className={uiStyles.primary} href="/">Kembali ke beranda</Link></div>
  </section></SiteFrame>;
}
