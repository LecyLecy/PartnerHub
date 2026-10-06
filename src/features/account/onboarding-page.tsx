"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { safeDestination } from "@/lib/navigation";
import { errorMessage } from "@/lib/api-client";
import { ProtectedPage, PageTitle, Notice, uiStyles } from "@/lib/ui";
import { completeOnboarding } from "./services/account-service";
import styles from "./account.module.css";

const guide = {
  user: { title: "Temukan acara yang ingin kamu ikuti.", description: "Lihat acara terbuka dan ikuti status pendaftaran dari halaman peserta.", steps: [["Pilih acara", "Baca ringkasan, jadwal, lokasi, dan kapasitas sebelum mendaftar."], ["Ikuti pendaftaranmu", "Referensi tiket dan status pendaftaran muncul di halaman tiket. Pengiriman QR masih dalam pengembangan."], ["Periksa pembaruan", "Lihat notifikasi terkait acara dan pendaftaranmu."]] },
  organizer: { title: "Siapkan acara pertamamu.", description: "Mulai dari draft. Jadwal dan identitas bisa dilengkapi sambil persiapan berjalan.", steps: [["Susun dasar acara", "Tulis judul, deskripsi, jadwal, dan kebutuhan pendaftaran. Jadwal boleh menyusul saat menyimpan draft ke server."], ["Tambahkan identitas", "Gunakan logo acara, organisasi, dan sponsor yang kamu berhak tampilkan. Periksa hasilnya di preview."], ["Lanjutkan dari daftar acara", "Buka kembali draft dan pantau jumlah pendaftar dari acara yang tercatat. Publikasi masih dalam pengembangan."]] },
  sponsor: { title: "Mulai dukungan untuk acara.", description: "Kelola penawaran perusahaan dan ikuti manfaat sponsor yang tercatat.", steps: [["Pilih acara yang sesuai", "Periksa penyelenggara, jadwal, dan ringkasan acara sebelum mengirim penawaran."], ["Jelaskan dukunganmu", "Pilih bentuk dukungan, jelaskan penawaran, dan isi nilai dukungan bila diperlukan."], ["Pantau proposal dan manfaat", "Lihat status proposal serta komitmen manfaat yang sudah dicatat untuk perusahaanmu."]] },
} as const;
export default function OnboardingPage() {
  const auth = useSession(); const router = useRouter(); const search = useSearchParams(); const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  async function complete() { setBusy(true); setError(""); try { auth.accept(await completeOnboarding()); router.replace(safeDestination(search.get("next"))); } catch(error) { setError(errorMessage(error)); } finally { setBusy(false); } }
  const content = guide[auth.session?.account.role ?? "organizer"];
  return <ProtectedPage onboarding><section className={styles.onboarding}><PageTitle title={content.title}>{content.description}</PageTitle><ol>{content.steps.map(([heading, description]) => <li key={heading}><h2>{heading}</h2><p>{description}</p></li>)}</ol>{auth.session?.account.role !== "user" && <p className={styles.accountHint}>Akses penuh penyelenggara dan sponsor dibuka setelah pemeriksaan admin.</p>}{error && <Notice error>{error}</Notice>}<button className={uiStyles.primary} onClick={() => void complete()} disabled={busy}>{busy ? "Menyimpan…" : "Buka halaman kerja"}</button></section></ProtectedPage>;
}
