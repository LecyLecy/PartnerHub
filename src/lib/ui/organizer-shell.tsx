"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@/contracts/account";
import { apiRequest } from "../api-client";
import { useResource } from "../use-resource";
import type { WorkspaceGroup, WorkspaceLink } from "../workspace-navigation";
import { homeFor, roleLabel } from "../navigation";
import { activeWorkspaceLink, eventWorkspaceGroup, workspaceGroups } from "../workspace-navigation";
import { AccountMenu } from "./account-menu";
import { HeaderBackSlot } from "./header-back";
import { Icon, LogoWordmark } from "./icons";
import { NotificationMenu } from "./notification-menu";
import { Notice } from "./primitives";
import styles from "../ui.module.css";
import shell from "./role-shell.module.css";


/** Shared role workspace. Navigation contains links only; authorization stays with existing guards/services. */
export function WorkspaceShell({ session, pathname, busy, error, onLeave, children }: {
  session: Session; pathname: string; busy: boolean; error: string; onLeave: () => void; children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 60.01rem)");
    const closeOnDesktop = () => { if (desktop.matches) setDrawer(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    if (!drawer) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLink.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setDrawer(false); requestAnimationFrame(() => menuButton.current?.focus()); }
      if (event.key !== "Tab") return;
      const controls = Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), [tabindex="0"]') ?? []).filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("keydown", escape); document.body.style.overflow = previousOverflow; };
  }, [drawer]);
  const name = roleLabel[session.account.role];
  const groups = workspaceGroups(session.account.role);
  const active = activeWorkspaceLink(groups, pathname);
  const eventGroup = eventWorkspaceGroup(session.account.role, pathname);
  const eventActive = eventGroup ? activeWorkspaceLink([eventGroup], pathname) : undefined;
  const section = pathname === "/settings" ? "Akun / Pengaturan" : pathname === "/organizer/transactions" ? "Pengaturan / Riwayat transaksi" : eventActive ? `Acara terpilih / ${eventActive.label}` : active ? `${groups.find(group => group.items.includes(active))?.title ?? "Ruang kerja"} / ${active.label}` : "Ruang kerja";
  return <div className={shell.workspace}>
    <a className={styles.skip} href="#main-content">Langsung ke konten</a>
    <div className={shell.scrim} data-open={drawer} aria-hidden="true" onClick={() => setDrawer(false)} />
    <aside ref={sidebar} id="workspace-sidebar" className={shell.sidebar} data-open={drawer} aria-label={`Ruang kerja ${name.toLocaleLowerCase("id-ID")}`}>
      <div className={shell.sidebarTop}>
        <Link className={styles.brand} href={homeFor(session)} aria-label={`PartnerHub, ${name}`}><LogoWordmark width={184} /></Link>
        <button type="button" className={`${shell.iconButton} ${shell.mobileOnly}`} aria-label="Tutup menu" onClick={() => { setDrawer(false); requestAnimationFrame(() => menuButton.current?.focus()); }}><Icon name="close" /></button>
      </div>
      <nav aria-label="Navigasi utama">
        {groups.map((group, groupIndex) => <div key={group.title} className={shell.group}>
          <h2>{group.title}</h2>
          {group.items.map((item, index) => <Link key={item.href} ref={groupIndex === 0 && index === 0 ? firstLink : undefined} href={item.href} aria-current={active?.href === item.href ? "page" : undefined} onClick={() => setDrawer(false)}><Icon name={item.icon} /><span className={shell.label}>{item.label}</span></Link>)}
        </div>)}
      </nav>
      <div className={shell.sidebarFoot}>
        <AccountMenu name={name} detail={session.account.email} placement="up" busy={busy} onLeave={onLeave} onNavigate={() => setDrawer(false)} />
      </div>
    </aside>
    <div className={shell.workArea} inert={drawer}>
      <header className={shell.topbar}>
        <div className={shell.topbarStart}>
          <button ref={menuButton} type="button" className={`${shell.iconButton} ${shell.mobileOnly}`} aria-label="Buka menu" aria-expanded={drawer} aria-controls="workspace-sidebar" onClick={() => setDrawer(true)}><Icon name="menu" /></button>
          <HeaderBackSlot />
          <span className={shell.section}>{section}</span>
        </div>
        <div className={shell.topbarEnd}>
          <NotificationMenu />
        </div>
      </header>
      {error && <div className={shell.content}><Notice error>{error}</Notice></div>}
      <main id="main-content" className={`${shell.content} ${shell.page}`} tabIndex={-1}>
        {eventGroup && <EventNavigation group={eventGroup} active={eventActive} />}
        {children}
      </main>
      <footer className={shell.workspaceFooter}><span>PartnerHub · Ruang kerja acara</span><nav aria-label="Informasi layanan"><Link href="/guide">Panduan</Link><Link href="/terms">Syarat & Ketentuan</Link><Link href="/privacy">Privasi</Link></nav></footer>
    </div>
  </div>;
}

const loadQrModule = async (eventId: string, signal: AbortSignal) => {
  const value = await apiRequest<{ modules?: { registration?: boolean; attendance?: boolean } }>(`/api/events/${encodeURIComponent(eventId)}`, { signal });
  return value.modules?.registration === true && value.modules?.attendance === true;
};

function EventNavigation({ group, active }: { group: WorkspaceGroup; active?: WorkspaceLink }) {
  const eventId = decodeURIComponent(group.items[0].href.split("/")[2]);
  const qr = useResource(eventId, loadQrModule);
  useEffect(() => {
    const changed = (event: Event) => { if ((event as CustomEvent<string>).detail === eventId) qr.reload(); };
    window.addEventListener("partnerhub:attendance-changed", changed);
    return () => window.removeEventListener("partnerhub:attendance-changed", changed);
  }, [eventId, qr]);
  return <nav className={shell.eventNavigation} aria-label="Navigasi acara">
    {group.items.filter(item => !item.href.endsWith("/qr") || qr.data === true).map(item => <Link key={item.href} href={item.href} aria-current={active?.href === item.href ? "page" : undefined}>{item.label}</Link>)}
  </nav>;
}
