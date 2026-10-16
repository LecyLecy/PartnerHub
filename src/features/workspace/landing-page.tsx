"use client";
import Link from "next/link";
import { useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Reveal } from "@/lib/motion";
import { useSession } from "@/lib/session";
import { homeFor } from "@/lib/navigation";
import { Loading, Marquee, Notice } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import { ActivityFeed, IdeaRails, Journey, ModuleToggles, TypedNote, Workflow } from "./landing/bento";
import { Compare } from "./landing/compare";
import { DashboardPreview } from "./landing/dashboard-preview";
import { Faq } from "./landing/faq";
import { LandingFooter } from "./landing/landing-footer";
import { organizations, roleRows } from "./landing/landing-data";
import { LandingNav } from "./landing/landing-nav";
import { Scenarios } from "./landing/scenarios";
import styles from "./landing.module.css";

export default function LandingPage() {
  const auth = useSession(); const router = useRouter();
  const destination = auth.status === "authenticated" ? homeFor(auth.session) : null;
  useEffect(() => { if (destination) router.replace(destination); }, [destination, router]);
  if (auth.status === "checking" || destination) return <Loading>Memeriksa sesi…</Loading>;
  return <div className={styles.page}>
    <LandingNav />
    <main id="main-content" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="landing-title">
        <a className={`${styles.pill} ${styles.enter}`} href="#fitur" style={{ "--enter-delay": "0ms" } as CSSProperties}>Panitia dan sponsor kini terhubung<Icon name="arrow" size={14} /></a>
        <h1 id="landing-title" className={styles.enter} style={{ "--enter-delay": "80ms" } as CSSProperties}>Satu ruang kerja untuk acara, panitia, dan sponsor.</h1>
        <p className={`${styles.lede} ${styles.enter}`} style={{ "--enter-delay": "160ms" } as CSSProperties}>PartnerHub membantu tim kampus dan komunitas menyiapkan acara, membuka pendaftaran, merekrut panitia, dan mengelola dukungan sponsor tanpa pindah-pindah spreadsheet.</p>
        <div className={`${styles.ctas} ${styles.enter}`} style={{ "--enter-delay": "240ms" } as CSSProperties}>
          <Link className={styles.cta} href="/register?role=organizer">Daftar sebagai penyelenggara</Link>
          <a className={styles.ctaGhost} href="#fitur">Lihat cara kerja</a>
        </div>
        <p className={`${styles.heroNote} ${styles.enter}`} style={{ "--enter-delay": "300ms" } as CSSProperties}>Penyelenggara dan sponsor memerlukan verifikasi email dan pemeriksaan admin.</p>
      </section>
      {auth.status === "error" && <div className={styles.sessionNotice}><Notice error>Pemeriksaan sesi belum berhasil. {auth.error} <button className={styles.retry} onClick={() => void auth.refresh()}>Periksa lagi</button></Notice></div>}
      <Reveal always className={styles.previewWrap}>
        <DashboardPreview />
        <p className={styles.caption}>Contoh tampilan ruang kerja penyelenggara. Angka di atas hanya ilustrasi.</p>
      </Reveal>

      <section className={styles.cloud} aria-label="Untuk tim seperti">
        <p className={styles.cloudTitle}>Dibuat untuk tim seperti</p>
        <Marquee duration={36} gap="0.75rem" label="Jenis organisasi pengguna">{organizations.map((name) => <span key={name} className={styles.chip}>{name}</span>)}</Marquee>
      </section>

      <section id="fitur" className={styles.section} aria-labelledby="fitur-title">
        <Reveal className={styles.head}><h2 id="fitur-title">Semua langkah persiapan, dalam satu alur.</h2><p>Dari draft acara sampai tanggapan sponsor. Setiap kartu di bawah adalah contoh yang bisa kamu coba.</p></Reveal>
        <div className={styles.bento}>
          <Reveal as="article" className={`${styles.cell} ${styles.cellFeed}`}><h3>Aktivitas terbaru</h3><p>Pendaftar, lamaran, dan tanggapan sponsor masuk ke satu daftar.</p><ActivityFeed /></Reveal>
          <Reveal as="article" delay={80} className={`${styles.cell} ${styles.cellToggles}`}><h3>Atur modul acara</h3><p>Nyalakan hanya yang kamu perlukan.</p><ModuleToggles /></Reveal>
          <Reveal as="article" delay={160} className={`${styles.cell} ${styles.cellNote}`}><h3>Kabari yang diterima</h3><p>Tulis langkah berikutnya, misalnya masuk grup WhatsApp panitia.</p><TypedNote /></Reveal>
          <Reveal as="article" className={`${styles.cell} ${styles.cellFlow}`}><h3>Seleksi panitia bertahap</h3><p>Status berpindah hanya lewat urutan yang diizinkan.</p><Workflow /></Reveal>
          <Reveal as="article" delay={80} className={`${styles.cell} ${styles.cellRails}`}><h3>Saran isian</h3><p>Contoh pertanyaan untuk pelamar dan catatan untuk yang diterima.</p><IdeaRails /></Reveal>
          <Reveal as="article" delay={160} className={`${styles.cell} ${styles.cellJourney}`}><h3>Perjalanan sebuah acara</h3><p>Bagian terakhir masih dalam pengembangan.</p><Journey /></Reveal>
        </div>
      </section>

      <section id="keunggulan" className={styles.section} aria-labelledby="keunggulan-title">
        <Reveal className={styles.head}><h2 id="keunggulan-title">Kenapa tidak cukup dengan spreadsheet dan chat.</h2><p>Pilih satu bagian untuk melihat bedanya.</p></Reveal>
        <Reveal><Compare /></Reveal>
      </section>

      <section className={styles.section} aria-labelledby="peran-title">
        <Reveal className={styles.head}><h2 id="peran-title">Tiga peran, satu acara.</h2><p>Satu akun memiliki satu peran. Pilih pintu masukmu.</p></Reveal>
        <ul className={styles.roles}>{roleRows.map((row, index) => <Reveal as="li" key={row.title} delay={index * 80}>
          <h3>{row.title}</h3><p>{row.body}</p><Link href={row.href}>{row.action}<Icon name="arrow" size={16} /></Link>
        </Reveal>)}</ul>
      </section>

      <section id="contoh" className={styles.section} aria-labelledby="contoh-title">
        <Reveal className={styles.head}><h2 id="contoh-title">Bagaimana tim bisa memakainya.</h2><p>Skenario contoh, bukan testimoni pengguna. PartnerHub belum mengumpulkan testimoni.</p></Reveal>
        <Scenarios />
      </section>

      <section id="faq" className={styles.section} aria-labelledby="faq-title">
        <Reveal className={styles.head}><h2 id="faq-title">Pertanyaan yang sering muncul.</h2></Reveal>
        <Faq />
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <Reveal><h2 id="closing-title">Sudah punya ide acara?</h2><p>Mulai dari draft. Panitia dan sponsor bisa menyusul.</p>
          <div className={styles.closingActions}><Link className={styles.cta} href="/register">Pilih peranmu</Link><Link className={styles.ctaGhost} href="/login">Sudah punya akun? Masuk</Link></div></Reveal>
      </section>
    </main>
    <LandingFooter />
  </div>;
}

