"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@/contracts/account";
import { AccountMenu } from "./account-menu";
import { Icon, LogoMark, type IconName } from "./icons";
import { NotificationMenu } from "./notification-menu";
import { Notice } from "./primitives";
import styles from "../ui.module.css";
import shell from "./role-shell.module.css";

const groups: readonly { title: string; items: readonly { href: string; label: string; icon: IconName }[] }[] = [
  { title: "Menu utama", items: [{ href: "/organizer", label: "Event kamu", icon: "calendar" }, { href: "/organizer/sponsorship", label: "Status sponsor", icon: "briefcase" }] },
];

/** Sidebar and top bar for organizer work routes. All data shown comes from the session the caller already holds. */
export function OrganizerShell({ session, pathname, isCurrent, busy, error, onLeave, onSearch, shortcut, children }: {
  session: Session; pathname: string; isCurrent: (href: string) => "page" | undefined; busy: boolean; error: string; onLeave: () => void; onSearch: () => void; shortcut: string; children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!drawer) return;
    firstLink.current?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setDrawer(false); menuButton.current?.focus(); } };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [drawer]);
  const name = session.account.displayName || "Penyelenggara";
  const section = pathname === "/settings" ? "Pengaturan akun" : pathname.startsWith("/organizer/sponsorship") ? "Status sponsor" : pathname.startsWith("/events/") ? "Persiapan acara" : "Overview acara";
  return <div className={shell.workspace}>
    <a className={styles.skip} href="#main-content">Langsung ke konten</a>
    <div className={shell.scrim} data-open={drawer} aria-hidden="true" onClick={() => setDrawer(false)} />
    <aside id="organizer-sidebar" className={shell.sidebar} data-open={drawer} aria-label="Ruang kerja penyelenggara">
      <div className={shell.sidebarTop}>
        <Link className={styles.brand} href="/organizer" aria-label="PartnerHub, Event kamu"><LogoMark /><span className={shell.label}>PartnerHub.</span></Link>
        <button type="button" className={`${shell.iconButton} ${shell.mobileOnly}`} aria-label="Tutup menu" onClick={() => { setDrawer(false); menuButton.current?.focus(); }}><Icon name="close" /></button>
      </div>
      <nav aria-label="Navigasi utama">
        {groups.map((group, groupIndex) => <div key={group.title} className={shell.group}>
          <h2>{group.title}</h2>
          {group.items.map((item, index) => <Link key={item.href} ref={groupIndex === 0 && index === 0 ? firstLink : undefined} href={item.href} aria-current={isCurrent(item.href)} onClick={() => setDrawer(false)}><Icon name={item.icon} /><span className={shell.label}>{item.label}</span></Link>)}
        </div>)}
      </nav>
      <div className={shell.sidebarFoot}>
        <AccountMenu name={name} detail={session.account.email} placement="up" busy={busy} onLeave={onLeave} onNavigate={() => setDrawer(false)} />
        <div className={shell.legal}><Link href="/terms">Syarat & Ketentuan</Link><Link href="/privacy">Kebijakan Privasi</Link></div>
      </div>
    </aside>
    <div className={shell.workArea}>
      <header className={shell.topbar}>
        <div className={shell.topbarStart}>
          <button ref={menuButton} type="button" className={`${shell.iconButton} ${shell.mobileOnly}`} aria-label="Buka menu" aria-expanded={drawer} aria-controls="organizer-sidebar" onClick={() => setDrawer(true)}><Icon name="menu" /></button>
          <span className={shell.section}>{section}</span>
        </div>
        <div className={shell.topbarEnd}>
          <button type="button" className={shell.searchTrigger} onClick={onSearch} aria-label="Pencarian cepat"><Icon name="search" size={18} /><span className={shell.searchText}>Cari</span><kbd>{shortcut}</kbd></button>
          <NotificationMenu />
        </div>
      </header>
      {error && <div className={shell.content}><Notice error>{error}</Notice></div>}
      <main id="main-content" className={`${shell.content} ${shell.page}`} tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
