"use client";
import { useState } from "react";
import { DEMO_PASSWORD } from "./seed";
import styles from "./demo-accounts.module.css";

const accounts = [
  { email: "demo.user@partnerhub.test", title: "Peserta", note: "Tiket dan pendaftaran" },
  { email: "demo.penyelenggara@partnerhub.test", title: "Penyelenggara", note: "Acara dan pendaftar" },
  { email: "demo.sponsor@partnerhub.test", title: "Sponsor", note: "Proposal dan manfaat" },
];

/** Shown only in demo builds. Fills the sign-in form with a public demo credential. */
export default function DemoAccounts({ onPick }: { onPick: (value: { email: string; password: string }) => void }) {
  const [open, setOpen] = useState(false);
  return <section aria-labelledby="demo-accounts" className={styles.picker}>
    <button id="demo-accounts" type="button" className={styles.toggle} aria-expanded={open} aria-controls="demo-account-options" onClick={() => setOpen(!open)}>Pilih akun demo</button>
    <div id="demo-account-options" hidden={!open}>
    <p>Pilih peran untuk mengisi email dan password, lalu tekan Masuk. Data demo fiktif dan hanya berlaku di tab ini.</p>
    <ul className={styles.accounts}>
      {accounts.map((item) => <li key={item.email}>
        <button type="button" aria-label={`Pilih akun ${item.title}: ${item.email}`} onClick={() => onPick({ email: item.email, password: DEMO_PASSWORD })}>
          <strong>{item.title}</strong><span>{item.note}</span>
        </button>
      </li>)}
    </ul>
    </div>
  </section>;
}
