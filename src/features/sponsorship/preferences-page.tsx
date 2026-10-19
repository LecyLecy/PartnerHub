"use client";
import { errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { Loading, Notice, PageHeader, ProtectedPage, uiStyles } from "@/lib/ui";
import { getMatchingProfile } from "./services/matching-service";
import styles from "./matching.module.css";

export default function PreferencesPage() { return <ProtectedPage><Preferences /></ProtectedPage>; }
function Preferences() {
  const resource = useResource("matching-profile", getMatchingProfile);
  return <><PageHeader title="Bidang & minat">Bidang perusahaan ditetapkan saat registrasi dan tidak dapat diubah.</PageHeader>
    {resource.status === "loading" ? <Loading>Memuat bidang perusahaan…</Loading> : resource.status === "error" ? <Notice error>{errorMessage(resource.error)} <button className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button></Notice> : resource.data && <section className={styles.panel} aria-labelledby="company-fields-title">
      <h2 id="company-fields-title">Bidang perusahaan</h2>
      <p>{resource.data.profile?.industry || resource.data.industry || "Belum tercatat"}</p>
      {Boolean(resource.data.profile?.fields.length) && <><h3>Bidang rekomendasi</h3><p>{resource.data.profile!.fields.join(", ")}</p></>}
      {!resource.data.profile && <p>Bidang akun ini belum tercatat untuk rekomendasi. Kamu tetap bisa menjelajahi semua event.</p>}
    </section>}
  </>;
}
