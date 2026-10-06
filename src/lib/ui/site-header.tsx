"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, LogoMark } from "./icons";
import styles from "./site-header.module.css";

export type HeaderLink = { href: string; label: string; current?: boolean };

/**
 * Website header shared by the landing page and every signed-in page that is not the organizer workspace.
 * It turns translucent once the page scrolls. Below 48rem the links and secondary actions move into a disclosure menu.
 * - `actions` stay visible at every width (search, bell, sign up).
 * - `desktopActions` show from 48rem (profile, sign out, log in).
 * - `menuExtra` renders inside the small-screen menu after the links.
 */
export function SiteHeader({ brandHref, links, actions, desktopActions, menuExtra, wide = false }: {
  brandHref: string; wide?: boolean; links: readonly HeaderLink[]; actions?: ReactNode; desktopActions?: ReactNode; menuExtra?: ReactNode;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  const item = (link: HeaderLink, onClick?: () => void) => link.href.startsWith("#")
    ? <a key={link.href} href={link.href} onClick={onClick}>{link.label}</a>
    : <Link key={link.href} href={link.href} aria-current={link.current ? "page" : undefined} onClick={onClick}>{link.label}</Link>;
  return <>
    <div ref={sentinel} className={styles.sentinel} aria-hidden="true" />
    <header className={styles.header} data-scrolled={scrolled} data-open={open} data-wide={wide}>
      <div className={styles.inner}>
        <Link className={styles.brand} href={brandHref}><LogoMark />PartnerHub.</Link>
        {links.length > 0 && <nav className={styles.links} aria-label="Navigasi utama">{links.map((link) => item(link))}</nav>}
        <div className={styles.actions}>
          {actions}
          {desktopActions && <div className={styles.desktopOnly}>{desktopActions}</div>}
          <button ref={button} type="button" className={styles.menuButton} aria-label={open ? "Tutup menu" : "Buka menu"} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} /></button>
        </div>
      </div>
      {open && <nav id="site-menu" className={styles.panel} aria-label="Menu" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}>
        {links.map((link) => item(link))}
        {menuExtra}
      </nav>}
    </header>
  </>;
}

export { styles as headerStyles };
