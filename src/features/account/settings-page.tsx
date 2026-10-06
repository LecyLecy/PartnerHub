"use client";
import { useState, type FormEvent } from "react";
import { useSession } from "@/lib/session";
import { errorMessage } from "@/lib/api-client";
import { homeFor } from "@/lib/navigation";
import { BackLink, ProtectedPage, PageTitle, Notice, Badge, uiStyles } from "@/lib/ui";
import { updateProfile } from "./services/account-service";
import styles from "./account.module.css";
function ProfileForm() {
  const auth = useSession(); const [name,setName] = useState(auth.session?.account.displayName || ""); const [busy,setBusy] = useState(false); const [error,setError] = useState(""); const [success,setSuccess] = useState(false);
  async function submit(event:FormEvent) { event.preventDefault(); setError(""); setSuccess(false); if(name.trim().length > 100) { setError("Nama tampilan maksimal 100 karakter."); return; } setBusy(true); try { auth.accept(await updateProfile({displayName:name.trim() || null})); setSuccess(true); } catch(error) { setError(errorMessage(error)); } finally { setBusy(false); } }
  return <div className={styles.profile}><BackLink href={homeFor(auth.session)} /><PageTitle title="Profil akun">Ubah nama tampilanmu. Email dan peran akun tidak dapat diubah dari halaman ini.</PageTitle><section className={styles.accountEmail} aria-labelledby="account-info-title"><h2 id="account-info-title">Informasi akun</h2><dl className={styles.detailList}><div><dt>Email akun</dt><dd>{auth.session?.account.email}</dd></div><div><dt>Peran akun</dt><dd>{auth.session?.account.role === "user" ? "Peserta" : auth.session?.account.role === "sponsor" ? "Perusahaan sponsor" : "Penyelenggara"}</dd></div><div><dt>Status email</dt><dd><Badge tone={auth.session?.emailVerified ? "success" : "warning"}>{auth.session?.emailVerified ? "Terverifikasi" : "Belum terverifikasi"}</Badge></dd></div></dl></section><form className={uiStyles.form} onSubmit={submit}><h2 className={styles.sectionTitle}>Nama tampilan</h2><label>Nama tampilan (opsional)<input name="displayName" value={name} maxLength={100} disabled={busy} autoComplete="nickname" onChange={event=>{setName(event.target.value);setSuccess(false);setError("");}} /></label><p className={uiStyles.hint}>Peran akun dipilih saat pendaftaran. Peranmu dalam sebuah acara dapat berbeda.</p>{error && <Notice error>{error}</Notice>}{success && <Notice>Profil berhasil diperbarui.</Notice>}<button className={uiStyles.primary} disabled={busy}>{busy?"Menyimpan…":"Simpan profil"}</button></form></div>;
}
export default function SettingsPage() { return <ProtectedPage><ProfileForm/></ProtectedPage>; }
