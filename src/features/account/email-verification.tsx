"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { destinationAfterAuth } from "@/lib/navigation";
import { errorMessage } from "@/lib/api-client";
import { Notice, uiStyles } from "@/lib/ui";
import { verifyEmail } from "./services/account-service";
import AccountForm from "./account-form";
import styles from "./account.module.css";

// Demo builds send no email; this stand-in link is absent from normal bundles.
const DemoVerify = process.env.NEXT_PUBLIC_PARTNERHUB_DEMO === "1"
  ? dynamic(() => import("@/mocks/demo/demo-verify"), { ssr: false })
  : null;

export default function EmailVerification() {
  const search = useSearchParams(); const router = useRouter(); const auth = useSession(); const token = search.get("token");
  const registered = search.get("registered");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function verify() {
    if (!token || busy) return;
    setBusy(true); setError("");
    try { const session = await verifyEmail(token); auth.accept(session); router.replace(destinationAfterAuth(session, search.get("next"))); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  const review = registered === "organizer" || registered === "sponsor";
  if (!token) return <>
    {registered && <Notice>Akun berhasil dibuat. Kami mengirim tautan verifikasi ke emailmu.{review ? " Setelah email terverifikasi, admin memeriksa data dan dokumenmu sebelum akses penuh dibuka. Kamu bisa melihat statusnya setelah masuk." : ""}</Notice>}
    <section className={styles.verificationGuide} aria-labelledby="inbox-title"><h2 id="inbox-title">Periksa emailmu</h2><p>Buka tautan verifikasi dari kotak masuk atau folder spam, lalu konfirmasikan alamat email di halaman yang terbuka.</p></section>
    {DemoVerify && <DemoVerify registered={registered} />}
    <section className={styles.resend} aria-labelledby="resend-title"><h2 id="resend-title">Belum menerima email?</h2><p>Masukkan email akunmu untuk meminta pengiriman ulang.</p><AccountForm mode="verify" /></section>
  </>;
  return <div className={styles.verificationActions}><p>Tautan verifikasi sudah dibuka. Konfirmasikan email untuk melanjutkan.</p>{error && <Notice error>{error} <Link href="/verify-email">Minta email verifikasi baru</Link></Notice>}<button className={uiStyles.primary} onClick={() => void verify()} disabled={busy || token.length > 2048}>{busy ? "Memverifikasi…" : "Verifikasi email"}</button>{token.length > 2048 && <Notice error>Tautan tidak valid. <Link href="/verify-email">Minta tautan baru</Link></Notice>}<p><Link href="/login">Kembali ke halaman masuk</Link></p></div>;
}
