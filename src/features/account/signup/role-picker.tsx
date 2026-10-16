"use client";
import Link from "next/link";
import type { Role } from "@/contracts/account";
import { roles } from "./options";
import styles from "./registration.module.css";

const icons: Record<Role, React.ReactNode> = {
  user: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><circle cx="20" cy="14" r="7" /><path d="M6 35c1.5-8 7-12 14-12s12.500 4 14 12" /></svg>,
  organizer: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><rect x="5" y="8" width="30" height="27" rx="3" /><path d="M5 17h30M13 4v8M27 4v8M12 25h6" /></svg>,
  sponsor: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M6 35V12l14-7 14 7v23M3 35h34M13 35V22h6v13M25 19h4M25 25h4" /></svg>,
};

export default function RolePicker({ onPick, next }: { onPick: (role: Role) => void; next: string }) {
  return <section className={styles.wrap} aria-labelledby="register-title">
    <div className={styles.intro}>
      <h1 id="register-title">Daftar sebagai siapa?</h1>
      <p>Pilih peran yang paling sesuai. Setiap peran punya formulir dan dashboard sendiri. Satu email hanya untuk satu peran.</p>
    </div>
    <ul className={styles.cards}>
      {roles.map((role) => <li key={role.value} className={styles.card}>
          {icons[role.value]}
          <h2 id={`role-${role.value}`}>{role.title}</h2>
          <p id={`role-description-${role.value}`}>{role.description}</p>
          <ul>{role.can.map((item) => <li key={item}>{item}</li>)}</ul>
          <button type="button" className={styles.chooseRole} aria-labelledby={`role-${role.value}`} aria-describedby={`role-description-${role.value}`} onClick={() => onPick(role.value)}>Pilih {role.title.toLocaleLowerCase("id-ID")}</button>
      </li>)}
    </ul>
    <p className={styles.approvalNote}>Penyelenggara dan sponsor perlu pemeriksaan admin setelah verifikasi email. Pada demo, persetujuan dapat disimulasikan dari halaman status akun.</p>
    <div className={styles.links}><Link href={`/login?next=${encodeURIComponent(next)}`}>Sudah punya akun? Masuk</Link><Link href="/">Kembali ke beranda</Link></div>
  </section>;
}
