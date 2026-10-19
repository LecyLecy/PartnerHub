import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "../ui.module.css";
import { BackLink } from "./header-back";
export { BackLink };

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
