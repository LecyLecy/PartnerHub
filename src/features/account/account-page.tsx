"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { SessionGate } from "@/lib/session";
import { BackLink, SiteFrame } from "@/lib/ui";
import AccountForm from "./account-form";
import EmailVerification from "./email-verification";
import type { AccountFormMode } from "./validation";
import styles from "./account.module.css";

// The demo panel is only imported when the build enables demo mode, so it is absent from normal bundles.
const DemoAccounts = process.env.NEXT_PUBLIC_PARTNERHUB_DEMO === "1"
  ? dynamic(() => import("@/mocks/demo/demo-accounts"), { ssr: false })
  : null;

const copy = {
  login: ["Masuk ke PartnerHub", "Lanjutkan pendaftaran acara, persiapan acara, atau proposal sponsormu."],
  forgot: ["Pulihkan akses akun", "Masukkan email yang kamu gunakan saat mendaftar untuk meminta tautan pemulihan password."],
  reset: ["Buat password baru", "Gunakan password yang berbeda dari akun lain. Setelah diperbarui, masuk kembali dengan password baru."],
  verify: ["Verifikasi email akunmu", "Konfirmasikan alamat email untuk melanjutkan ke langkah berikutnya."],
} as const;

function Login() {
  const [prefill, setPrefill] = useState<{ email: string; password: string } | null>(null);
  return <>
    {DemoAccounts && <DemoAccounts onPick={setPrefill} />}
    {/* The key remounts the form so its initial state picks up the chosen demo credential. */}
    <AccountForm key={prefill ? prefill.email : "manual"} mode="login" prefill={prefill} />
  </>;
}

export default function AccountPage({ mode }: { mode: AccountFormMode }) {
  const content = <SiteFrame><div className={styles.layout}><section className={styles.intro}><BackLink href="/">Beranda</BackLink><h1>{copy[mode][0]}</h1><p>{copy[mode][1]}</p></section><section className={styles.formColumn} aria-label={mode === "login" ? "Masuk akun" : "Form akun"}>{mode === "verify" ? <EmailVerification/> : mode === "login" ? <Login/> : <AccountForm mode={mode}/>}</section></div></SiteFrame>;
  return mode === "login" ? <SessionGate guest>{content}</SessionGate> : content;
}
