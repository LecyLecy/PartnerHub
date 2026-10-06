import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "../ui.module.css";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";
export function Button({ variant = "primary", children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={`${styles[variant]} ${className}`}>{children}</button>;
}
export function Badge({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "warning" | "danger" | "neutral" }) {
  return <span className={`${styles.badge} ${tone === "info" ? "" : styles[tone]}`}>{children}</span>;
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}
/** Back button for any page that is reached from another page. It always goes to a fixed parent, so the destination is predictable. */
export function BackLink({ href, children = "Kembali" }: { href: string; children?: ReactNode }) {
  return <Link className={styles.back} href={href}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>{children}</Link>;
}
export function Breadcrumb({ href, parent, current }: { href: string; parent: string; current: string }) {
  return <div className={styles.crumbs}>
    <BackLink href={href} />
    <nav className={styles.breadcrumb} aria-label="Jejak halaman"><Link href={href}>{parent}</Link><span aria-hidden="true">/</span><span aria-current="page">{current}</span></nav>
  </div>;
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={`${styles.notice} ${error ? styles.error : ""}`} role={error ? "alert" : "status"}>{children}</div>;
}
export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return <div className={styles.title}><h1>{title}</h1>{children && <p>{children}</p>}</div>;
}
export function EmptyState({ title, children, href, action }: { title: string; children: ReactNode; href?: string; action?: string }) {
  return <section className={styles.empty}><h2>{title}</h2><p>{children}</p>{href && action && <Link className={styles.primary} href={href}>{action}</Link>}</section>;
}
export function Loading({ children = "Memuat data…" }: { children?: ReactNode }) {
  return <p className={styles.loading} role="status">{children}</p>;
}
export function Skeleton({ label }: { label: string }) {
  return <div className={styles.skeleton} role="status"><span className="sr-only">{label}</span><span aria-hidden="true"/><span aria-hidden="true"/><span aria-hidden="true"/></div>;
}
