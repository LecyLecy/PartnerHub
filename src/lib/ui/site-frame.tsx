"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { errorMessage } from "../api-client";
import { requestLeave, cancelLeave } from "../leave-guard";
import { homeFor, roleLabel } from "../navigation";
import { useSession } from "../session";
import { AccountMenu } from "./account-menu";
import { NotificationMenu } from "./notification-menu";
import { WorkspaceShell } from "./organizer-shell";
import { activeWorkspaceLink, workspaceGroups } from "../workspace-navigation";
import { PublicHeader } from "./public-header";
import { Notice } from "./primitives";
import { SiteHeader } from "./site-header";
import { LogoWordmark } from "./icons";
import styles from "../ui.module.css";


export function SiteFrame({ children }: { children: ReactNode }) {
  const auth = useSession();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const session = auth.status === "authenticated" ? auth.session : null;
  const signedIn = Boolean(session);
  const underReview = Boolean(session && session.emailVerified && session.account.status !== "active");
  const groups = session ? workspaceGroups(session.account.role) : [];
  const links = !session ? [] : underReview ? [{ href: "/account/verification", label: "Status verifikasi", icon: "shield" as const }] : session.emailVerified ? groups.flatMap(group => group.items) : [];
  const canNotify = Boolean(session && session.emailVerified);
  async function leave() {
    if (busy || !await requestLeave()) return;
    setBusy(true); setError("");
    try { await auth.logout(); window.location.replace("/login?reason=logout"); }
    catch (error) { cancelLeave(); setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  const workspaceShell = Boolean(session && session.emailVerified && !underReview);
  if (workspaceShell && session) return <>
    <WorkspaceShell session={session} pathname={pathname} busy={busy} error={error} onLeave={() => void leave()} >{children}</WorkspaceShell>
  </>;
  const isParticipant = session?.account.role === "user";
  const myEventsItem = [{ href: "/me/events", label: "Tiket saya", icon: "calendar" as const }];
  const label = session ? roleLabel[session.account.role] : "";
  // Restricted accounts retain only their permitted verification/profile destinations.
  const active = activeWorkspaceLink(groups, pathname);
  const signedInLinks = links.map(link => ({ ...link, current: active?.href === link.href }));
  const header = session
    ? <SiteHeader
        brandHref={homeFor(session)}
        links={signedInLinks}
        actions={canNotify ? <NotificationMenu /> : null}
        desktopActions={<AccountMenu name={label} placement="down" busy={busy} onLeave={() => void leave()} items={isParticipant ? myEventsItem : []} />}
        menuExtra={<>
          {isParticipant && <Link href="/me/events">Tiket saya</Link>}
          <Link href="/settings">Pengaturan</Link>
          <button type="button" onClick={() => void leave()} disabled={busy}>{busy ? "Keluar…" : "Keluar"}</button>
        </>}
      />
    : <PublicHeader />;
  return <div className={styles.publicFrame}>
    <a className={styles.skip} href="#main-content">Langsung ke konten</a>
    {header}
    {error && <div className={styles.container}><Notice error>{error}</Notice></div>}
    {underReview && pathname !== "/account/verification" && <div className={styles.container}><Notice>Akunmu sedang diverifikasi admin, jadi akses masih terbatas. <Link href="/account/verification">Lihat status verifikasi</Link></Notice></div>}
    <main id="main-content" className={styles.container} tabIndex={-1}>{children}</main>
    <footer className={styles.footer}><Link href={session ? homeFor(session) : "/"} aria-label="PartnerHub"><LogoWordmark width={188} /></Link><p>Persiapan acara dan komitmen sponsor dalam satu ruang kerja.</p><span className={styles.footerLinks}><Link href="/terms">Syarat & Ketentuan</Link><Link href="/privacy">Kebijakan Privasi</Link>{!signedIn && <Link href="/login">Masuk ke akun</Link>}</span></footer>
  </div>;
}
