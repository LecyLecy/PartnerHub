import Link from "next/link";
import { LogoMark } from "@/lib/ui/icons";
import { uiStyles } from "@/lib/ui";
import styles from "../landing.module.css";

const columns = [
  { title: "Produk", links: [{ href: "#fitur", label: "Cara kerja" }, { href: "#keunggulan", label: "Keunggulan" }, { href: "#contoh", label: "Skenario" }, { href: "#faq", label: "Tanya jawab" }] },
  { title: "Mulai sebagai", links: [{ href: "/register?role=organizer", label: "Penyelenggara" }, { href: "/register?role=user", label: "Peserta" }, { href: "/register?role=sponsor", label: "Sponsor" }] },
  { title: "Perusahaan", links: [{ href: "/about", label: "Tentang" }, { href: "/contact", label: "Kontak" }, { href: "/pricing", label: "Harga" }] },
  { title: "Hukum", links: [{ href: "/terms", label: "Syarat & Ketentuan" }, { href: "/privacy", label: "Kebijakan Privasi" }] },
] as const;

export function LandingFooter() {
  return <footer className={styles.footer}>
    <div className={styles.footInner}>
      <div className={styles.footBrand}>
        <Link className={uiStyles.brand} href="/"><LogoMark />PartnerHub.</Link>
        <p>Ruang kerja untuk menyiapkan acara, merekrut panitia, dan mengelola sponsorship tim kampus dan komunitas.</p>
        <Link href="/contact">Hubungi kami</Link>
      </div>
      {columns.map((column) => <nav key={column.title} aria-label={column.title}>
        <h2 className={styles.footTitle}>{column.title}</h2>
        <ul>{column.links.map((link) => <li key={link.href}>{link.href.startsWith("#") ? <a href={link.href}>{link.label}</a> : <Link href={link.href}>{link.label}</Link>}</li>)}</ul>
      </nav>)}
    </div>
    <div className={styles.footBottom}><span>© 2026 PartnerHub</span><span>Beberapa fitur masih dalam pengembangan.</span></div>
  </footer>;
}
