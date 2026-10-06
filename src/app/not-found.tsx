"use client";
import Link from "next/link";
import { SiteFrame, PageTitle, uiStyles } from "@/lib/ui";
import { useSession } from "@/lib/session";
import { homeFor } from "@/lib/navigation";

export default function NotFound() {
  const auth = useSession();
  const session = auth.status === "authenticated" ? auth.session : null;
  return <SiteFrame>
    <section className={uiStyles.readingPage}>
    <PageTitle title="Halaman ini tidak ditemukan.">Tautannya mungkin berubah atau alamatnya tidak lengkap.</PageTitle>
    <p>Data tidak berubah karena halaman ini tidak ditemukan.</p>
    <div className={uiStyles.actions}><Link className={uiStyles.primary} href={session ? homeFor(session) : "/"}>{session ? "Ke dashboardmu" : "Ke beranda"}</Link></div>
    </section>
  </SiteFrame>;
}
