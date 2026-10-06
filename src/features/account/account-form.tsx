"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, errorMessage } from "@/lib/api-client";
import { destinationAfterAuth, safeDestination } from "@/lib/navigation";
import { useSession } from "@/lib/session";
import { Notice, uiStyles } from "@/lib/ui";
import { PasswordField, TextField, focusFirstError } from "@/lib/form/fields";
import * as service from "./services/account-service";
import { validateAccountForm, type AccountFormMode } from "./validation";
import styles from "./account.module.css";

const submitLabel = { login: "Masuk", forgot: "Kirim tautan pemulihan", reset: "Perbarui password", verify: "Kirim ulang email verifikasi" } as const;

export default function AccountForm({ mode, prefill }: { mode: AccountFormMode; prefill?: { email: string; password: string } | null }) {
  const router = useRouter(); const search = useSearchParams(); const auth = useSession();
  const [values, setValues] = useState({ email: prefill?.email ?? "", password: prefill?.password ?? "", confirm: "", token: search.get("token") || "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(""); const [failure, setFailure] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const next = safeDestination(search.get("next"));
  function change(field: keyof typeof values, value: string) { setValues((previous) => ({ ...previous, [field]: value })); setErrors((previous) => ({ ...previous, [field]: "" })); setFailure(""); setMessage(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const validation = validateAccountForm(mode, values); setErrors(validation); setFailure(""); setMessage("");
    if (Object.keys(validation).length) { focusFirstError(form.current, ["email", "password", "confirm"], validation); return; }
    setBusy(true);
    try {
      if (mode === "login") { const session = await service.login({ email: values.email.trim(), password: values.password }); auth.accept(session); router.replace(destinationAfterAuth(session, search.get("next") ? next : null)); }
      if (mode === "forgot") { await service.forgotPassword(values.email.trim()); setMessage("Jika email tersebut terdaftar, tautan pemulihan akan dikirim. Periksa kotak masuk dan folder spam."); }
      if (mode === "reset") { await service.resetPassword(values.token, values.password); setValues((previous) => ({ ...previous, password: "", confirm: "", token: "" })); setMessage("Password berhasil diperbarui. Masuk menggunakan password baru."); window.history.replaceState(window.history.state, "", "/reset-password"); await auth.refresh(); }
      if (mode === "verify") { await service.resendVerification(values.email.trim()); setMessage("Jika akun tersebut menunggu verifikasi, email baru akan dikirim. Periksa kotak masuk dan folder spam."); }
    } catch (error) { setFailure(errorMessage(error)); if (error instanceof ApiError) { setErrors(error.fields); focusFirstError(form.current, ["email", "password", "confirm"], error.fields); } }
    finally { setBusy(false); }
  }
  const completed = mode === "reset" && Boolean(message);
  if (completed) return <><Notice>Password berhasil diperbarui. Masuk menggunakan password baru.</Notice><Link className={uiStyles.primary} href="/login">Masuk ke akun</Link></>;
  return <form ref={form} className={uiStyles.form} onSubmit={submit} noValidate>
    {search.get("reason") === "expired" && <Notice>Sesi berakhir. Masuk kembali untuk melanjutkan.</Notice>}
    {search.get("reason") === "logout" && <Notice>Kamu sudah keluar dari akun.</Notice>}
    {mode === "reset" && !values.token && <Notice error>Tautan pemulihan tidak lengkap. <Link href="/forgot-password">Minta tautan baru</Link></Notice>}
    {mode !== "reset" && <TextField name="email" label="Email" type="email" autoComplete="email" value={values.email} onChange={(value) => change("email", value)} disabled={busy} error={errors.email} maxLength={254} />}
    {(mode === "login" || mode === "reset") && <PasswordField name="password" label={mode === "reset" ? "Password baru" : "Password"} value={values.password} onChange={(value) => change("password", value)} disabled={busy} error={errors.password} autoComplete={mode === "login" ? "current-password" : "new-password"} showStrength={mode === "reset"} hint={mode === "login" ? "Password akun PartnerHub kamu." : "Minimal 12 karakter dengan 3 jenis karakter. Tidak disimpan di perangkat ini."} />}
    {mode === "reset" && <PasswordField name="confirm" label="Konfirmasi password" value={values.confirm} onChange={(value) => change("confirm", value)} disabled={busy} error={errors.confirm} />}
    {errors.token && <Notice error>{errors.token} <Link href="/forgot-password">Minta tautan pemulihan</Link></Notice>}
    {failure && <Notice error>{failure}</Notice>}{message && <Notice>{message}</Notice>}
    <button type="submit" className={uiStyles.primary} disabled={busy || (mode === "reset" && !values.token)}>{busy ? "Memproses…" : submitLabel[mode]}</button>
    <div className={styles.formLinks}>{mode === "login" ? <><Link href="/forgot-password">Lupa password?</Link><Link href={`/register?next=${encodeURIComponent(next)}`}>Belum punya akun? Daftar</Link></> : <Link href="/login">Kembali ke halaman masuk</Link>}</div>
  </form>;
}
