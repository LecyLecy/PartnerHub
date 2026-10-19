"use client";
import Link from "next/link";
import { useState } from "react";
import { Notice, PageHeader, SiteFrame, uiStyles } from "@/lib/ui";
import { PlanCards } from "./plan-cards";
import styles from "./subscription.module.css";

export default function PricingPage() {
  const [cycle, setCycle] = useState<"SINGLE" | "ANNUAL">("SINGLE");
  return <SiteFrame><div className={styles.publicPage}>
    <PageHeader title="Paket penyelenggara">Bayar per event, atau pilih subscription jika rutin membuat acara. Keduanya pilihan alternatif, bukan dua biaya wajib.</PageHeader>
    <div className={styles.switcher} role="group" aria-label="Cara pembayaran"><button className={cycle === "SINGLE" ? uiStyles.primary : uiStyles.secondary} aria-pressed={cycle === "SINGLE"} onClick={() => setCycle("SINGLE")}>Per event</button><button className={cycle === "ANNUAL" ? uiStyles.primary : uiStyles.secondary} aria-pressed={cycle === "ANNUAL"} onClick={() => setCycle("ANNUAL")}>Subscription tahunan</button></div>
    <PlanCards cycle={cycle} />
    <p><Link className={uiStyles.primary} href={cycle === "ANNUAL" ? "/organizer/subscription" : "/organizer/archive"}>{cycle === "ANNUAL" ? "Pilih subscription" : "Pilih acara untuk diunggah"}</Link></p>
    <Notice>Peserta, calon panitia, dan sponsor tidak membeli paket penyelenggara. Melihat acara tidak perlu login; pendaftaran dan pengajuan sponsorship perlu akun.</Notice>
  </div></SiteFrame>;
}
