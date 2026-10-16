"use client";
import Link from "next/link";
import { PageTitle, uiStyles } from "@/lib/ui";
export default function ErrorPage({ reset }: { reset:()=>void }) { return <main className={uiStyles.container}><section className={uiStyles.readingPage}><PageTitle title="Halaman belum dapat dibuka."/><p role="alert">Terjadi kesalahan saat menyiapkan halaman. Coba lagi atau kembali ke beranda.</p><div className={uiStyles.actions}><button className={uiStyles.primary} onClick={reset}>Coba lagi</button><Link className={uiStyles.secondary} href="/">Kembali ke beranda</Link></div></section></main>; }
