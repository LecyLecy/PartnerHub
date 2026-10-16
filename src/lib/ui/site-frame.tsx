"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { errorMessage } from "../api-client";
import { homeFor, roleLabel } from "../navigation";
import { useSession } from "../session";
import { AccountMenu } from "./account-menu";
import { CommandPalette, useShortcutLabel, type PaletteItem } from "./command-palette";
import { NotificationMenu } from "./notification-menu";
import { Icon } from "./icons";
import { OrganizerShell } from "./organizer-shell";
import { Notice } from "./primitives";
import { SiteHeader, headerStyles } from "./site-header";
import styles from "../ui.module.css";

const roleLinks = {
  user: [{ href: "/me", label: "Acara" }, { href: "/committee", label: "Panitia" }],
  organizer: [{ href: "/organizer", label: "Event kamu" }, { href: "/organizer/sponsorship", label: "Status sponsor" }],
  sponsor: [{ href: "/sponsor", label: "Sponsorship" }, { href: "/sponsor/proposals/new", label: "Kirim proposal" }],
} as const;
const linkIcons = { "/me": "ticket", "/me/events": "calendar", "/committee": "users", "/organizer": "calendar", "/organizer/sponsorship": "briefcase", "/events/new": "plus", "/sponsor": "briefcase", "/sponsor/proposals/new": "plus", "/account/verification": "shield" } as const;

export function SiteFrame({ children }: { children: ReactNode }) {
  const auth = useSession();
  const pathname = usePathname();
  const shortcut = useShortcutLabel();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const session = auth.status === "authenticated" ? auth.session : null;
  const signedIn = Boolean(session);
  const underReview = Boolean(session && session.emailVerified && session.account.status !== "active");
  const links = !session ? [] : underReview ? [{ href: "/account/verification", label: "Status verifikasi" }] : session.emailVerified ? roleLinks[session.account.role] : [];
  const canSearch = Boolean(session && session.emailVerified);
  async function leave() {
    if (!window.dispatchEvent(new Event("partnerhub:before-leave", { cancelable: true }))) return;
    setBusy(true); setError("");
    try { await auth.logout(); window.location.replace("/login?reason=logout"); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  const current = (href: string) => (pathname === href || (href !== "/events/new" && href !== "/me" && href !== "/organizer" && pathname.startsWith(`${href}/`)) || (href === "/organizer" && pathname.startsWith("/events/"))) ? "page" : undefined;
  useEffect(() => {
    if (!canSearch) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((open) => !open); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [canSearch]);
  const items = useMemo<PaletteItem[]>(() => {
    if (!canSearch) return [];
    const pages = links.map((link) => ({ id: link.href, label: link.label, group: "Halaman", icon: linkIcons[link.href as keyof typeof linkIcons], href: link.href }));
    return [...pages,
      ...(session?.account.role === "organizer" ? [{ id: "new-event", label: "Susun event baru", group: "Aksi", icon: "plus" as const, href: "/events/new" }] : []),
      ...(session?.account.role === "user" ? [{ id: "my-events", label: "Acara saya", group: "Akun", icon: "calendar" as const, href: "/me/events", keywords: "tiket qr lamaran panitia terdaftar" }] : []),
      { id: "settings", label: "Profil & pengaturan", group: "Akun", icon: "settings", href: "/settings", keywords: "settings akun profil" },
      { id: "logout", label: "Keluar", group: "Akun", icon: "logout", run: () => void leave(), keywords: "logout keluar" }];
    // leave is recreated each render but only reads the latest auth; links derive from the session role.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSearch, session?.account.role, underReview]);
  const organizerShell = session?.account.role === "organizer" && session.emailVerified && !underReview && (pathname === "/organizer" || pathname.startsWith("/organizer/") || pathname.startsWith("/events/") || pathname === "/settings");
  const palette = canSearch ? <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={items} /> : null;
  if (organizerShell && session) return <>
    <OrganizerShell session={session} pathname={pathname} isCurrent={current} busy={busy} error={error} onLeave={() => void leave()} onSearch={() => setPaletteOpen(true)} shortcut={shortcut}>{children}</OrganizerShell>
    {palette}
  </>;
  const isParticipant = session?.account.role === "user";
  const myEventsItem = [{ href: "/me/events", label: "Acara saya", icon: "calendar" as const }];
  const label = session ? session.account.displayName?.trim() || roleLabel[session.account.role] : "";
  // Sponsors reach their pages through the logo, dashboard buttons and the command palette, so the header stays clear.
  const signedInLinks = session?.account.role === "sponsor" && !underReview ? [] : links.map((link) => ({ ...link, current: current(link.href) === "page" }));
  const header = session
    ? <SiteHeader
        brandHref={homeFor(session)}
        links={signedInLinks}
        actions={canSearch ? <>
          <button type="button" className={headerStyles.search} onClick={() => setPaletteOpen(true)} aria-label="Pencarian cepat"><Icon name="search" size={18} /><span className={headerStyles.searchText}>Cari</span><kbd>{shortcut}</kbd></button>
          <NotificationMenu />
        </> : null}
        desktopActions={<AccountMenu name={label} placement="down" busy={busy} onLeave={() => void leave()} items={isParticipant ? myEventsItem : []} />}
        menuExtra={<>
          {isParticipant && <Link href="/me/events">Acara saya</Link>}
          <Link href="/settings" aria-label="Profil & pengaturan">Pengaturan ({label})</Link>
          <button type="button" onClick={() => void leave()} disabled={busy}>{busy ? "Keluar…" : "Keluar"}</button>
        </>}
      />
    : <SiteHeader
        brandHref="/"
        links={[{ href: "/explore", label: "Jelajahi event", current: pathname.startsWith("/explore") }, { href: "/#fitur", label: "Tentang PartnerHub" }]}
        actions={auth.status === "checking" ? <span role="status">Memeriksa sesi…</span> : <>
          <Link className={`${headerStyles.login} ${headerStyles.loginWide}`} href="/login">Masuk</Link>
          <Link className={`${headerStyles.signup} ${headerStyles.compact}`} href="/register">Daftar</Link>
        </>}
        menuExtra={auth.status === "checking" ? null : <><Link href="/login">Masuk</Link><Link href="/register">Daftar</Link></>}
      />;
  return <div>
    <a className={styles.skip} href="#main-content">Langsung ke konten</a>
    {header}
    {error && <div className={styles.container}><Notice error>{error}</Notice></div>}
    {underReview && pathname !== "/account/verification" && <div className={styles.container}><Notice>Akunmu sedang diverifikasi admin, jadi akses masih terbatas. <Link href="/account/verification">Lihat status verifikasi</Link></Notice></div>}
    <main id="main-content" className={styles.container} tabIndex={-1}>{children}</main>
    <footer className={styles.footer}><Link href={session ? homeFor(session) : "/"}>PartnerHub</Link><p>Persiapan acara dan komitmen sponsor dalam satu ruang kerja.</p><span className={styles.footerLinks}><Link href="/terms">Syarat & Ketentuan</Link><Link href="/privacy">Kebijakan Privasi</Link>{signedIn ? <Link href="/settings">Profil & pengaturan</Link> : <Link href="/login">Masuk ke akun</Link>}</span></footer>
    {palette}
  </div>;
}
