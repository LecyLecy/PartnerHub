"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { homeFor } from "@/lib/navigation";
import { Loading, Notice } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import { DashboardPreview } from "./landing/dashboard-preview";
import { Faq } from "./landing/faq";
import { LandingFooter } from "./landing/landing-footer";
import { roleRows } from "./landing/landing-data";
import { LandingNav } from "./landing/landing-nav";
import styles from "./landing.module.css";

const steps = [
  { title: "Siapkan acara", body: "Tentukan jadwal, lokasi, dan kebutuhan acaramu." },
  { title: "Hubungkan orangnya", body: "Buka pendaftaran, rekrut panitia, dan ajak sponsor." },
  { title: "Pantau pelaksanaan", body: "Kelola tiket, presensi opsional, dan bukti benefit sponsor." },
] as const;

export default function LandingPage() {
  const auth = useSession(); const router = useRouter();
  const destination = auth.status === "authenticated" ? homeFor(auth.session) : null;
  useEffect(() => { if (destination) router.replace(destination); }, [destination, router]);
  if (auth.status === "checking" || destination) return <Loading>Memeriksa sesi…</Loading>;
  return <div className={styles.page}>
    <LandingNav />
    <main id="main-content" tabIndex={-1}>
      <section className={styles.intro} aria-labelledby="landing-title">
        <div className={styles.hero}>
          <h1 id="landing-title">Satu ruang kerja untuk acara, panitia, dan sponsor.</h1>
          <p className={styles.lede}>Siapkan acara kampus dan komunitas, dari pendaftaran sampai kerja sama sponsor.</p>
          <div className={styles.ctas}>
            <Link className={styles.cta} href="/register?role=organizer">Buat acara</Link>
            <Link className={styles.ctaGhost} href="/explore">Jelajahi event</Link>
          </div>
        </div>
        {auth.status === "error" && <div className={styles.sessionNotice}><Notice error>Pemeriksaan sesi belum berhasil. {auth.error} <button className={styles.retry} onClick={() => void auth.refresh()}>Periksa lagi</button></Notice></div>}
        <div className={styles.previewWrap}>
          <DashboardPreview />
          <p className={styles.caption}>Satu tempat untuk mengelola acaramu.</p>
        </div>
      </section>

      <section id="fitur" className={styles.band} aria-labelledby="fitur-title">
        <div className={styles.section}>
          <div className={styles.head}><h2 id="fitur-title">Dari rencana ke hari acara.</h2><p>Tiga langkah, tanpa data yang terpencar.</p></div>
          <ol className={styles.steps} aria-label="Cara kerja PartnerHub">{steps.map((step, index) => <li key={step.title}>
            <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
            <h3>{step.title}</h3><p>{step.body}</p>
          </li>)}</ol>
        </div>
      </section>

      <section id="peran" className={`${styles.band} ${styles.roleBand}`} aria-labelledby="peran-title">
        <div className={styles.section}>
          <div className={styles.head}><h2 id="peran-title">Mulai dari peranmu.</h2></div>
          <ul className={styles.roles}>{roleRows.map(row => <li key={row.title}>
            <h3>{row.title}</h3><p>{row.body}</p><Link href={row.href}>{row.action}<Icon name="arrow" size={16} /></Link>
          </li>)}</ul>
        </div>
      </section>

      <section id="faq" className={styles.band} aria-labelledby="faq-title">
        <div className={`${styles.section} ${styles.faqLayout}`}>
          <div className={styles.head}><h2 id="faq-title">Masih ingin tahu?</h2><p><Link href="/guide">Baca panduan PartnerHub</Link></p></div>
          <Faq />
        </div>
      </section>
    </main>
    <LandingFooter />
  </div>;
}

