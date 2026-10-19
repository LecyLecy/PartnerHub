import type { Role } from "@/contracts/account";
import type { IconName } from "./ui/icons";

export type WorkspaceLink = { href: string; label: string; icon: IconName };
export type WorkspaceGroup = { title: string; items: readonly WorkspaceLink[] };
const groups: Record<Role, readonly WorkspaceGroup[]> = {
  organizer: [
    { title: "Event", items: [{ href: "/organizer", label: "Daftar event", icon: "calendar" }, { href: "/organizer/archive", label: "Arsip acara", icon: "calendar" }, { href: "/events/new", label: "Buat event", icon: "plus" }] },
    { title: "Sponsorship", items: [{ href: "/organizer/sponsorship", label: "Proposal masuk", icon: "briefcase" }, { href: "/organizer/sponsorship/requests", label: "Ajakan sponsor", icon: "users" }, { href: "/organizer/sponsors", label: "Jelajahi sponsor", icon: "briefcase" }] },
    { title: "Pembayaran", items: [{ href: "/organizer/subscription", label: "Subscription", icon: "ticket" }] },
  ],
  sponsor: [
    { title: "Jelajahi event", items: [{ href: "/sponsor", label: "Rekomendasi", icon: "calendar" }, { href: "/sponsor/events", label: "Semua event", icon: "calendar" }] },
    { title: "Kerja sama", items: [{ href: "/sponsor/progress", label: "Permintaan masuk", icon: "users" }, { href: "/sponsor/progress/proposals", label: "Proposal saya", icon: "briefcase" }, { href: "/sponsor/progress/benefits", label: "Benefit & bukti", icon: "ticket" }] },
    { title: "Akun", items: [{ href: "/sponsor/preferences", label: "Bidang & minat", icon: "settings" }] },
  ],
  user: [
    { title: "Event", items: [{ href: "/me", label: "Jelajahi event", icon: "calendar" }, { href: "/me/events", label: "Tiket saya", icon: "ticket" }] },
    { title: "Panitia", items: [{ href: "/committee", label: "Lowongan", icon: "users" }, { href: "/me/applications", label: "Lamaran saya", icon: "briefcase" }] },
  ],
};

/** Role-level destinations remain identical across pages. */
export function workspaceGroups(role: Role): readonly WorkspaceGroup[] {
  return groups[role];
}

/** Selected-event destinations belong above content, never inside the role sidebar. */
export function eventWorkspaceGroup(role: Role, pathname: string): WorkspaceGroup | undefined {
  const match = role === "organizer" ? pathname.match(/^\/events\/([^/]+)(?:\/|$)/) : null;
  if (!match || match[1] === "new") return undefined;
  const root = `/events/${encodeURIComponent(match[1])}`;
  const event: WorkspaceGroup = { title: "Acara terpilih", items: [
    { href: root, label: "Ringkasan acara", icon: "calendar" }, { href: `${root}/registration`, label: "Pendaftaran", icon: "users" },
    { href: `${root}/committee`, label: "Kelola panitia", icon: "users" }, { href: `${root}/qr`, label: "QR tiket", icon: "ticket" },
    { href: `${root}/scan`, label: "Presensi", icon: "calendar" }, { href: `${root}/sponsors`, label: "Ajak sponsor", icon: "briefcase" },
    { href: `${root}/team`, label: "Pengelola", icon: "settings" },
  ] };
  return event;
}

export function activeWorkspaceLink(items: readonly WorkspaceGroup[], pathname: string): WorkspaceLink | undefined {
  if (pathname === "/organizer/transactions") return undefined;
  if (/^\/me\/committee\/[^/]+\/scan$/.test(pathname)) return groups.user[1].items[1];
  if (pathname.startsWith("/sponsor/proposals/new")) return groups.sponsor[1].items[1];
  const all = items.flatMap(group => group.items);
  return all.filter(item => pathname === item.href || pathname.startsWith(`${item.href}/`)).sort((a, b) => b.href.length - a.href.length)[0]
    ?? (pathname.startsWith("/events/") ? all.find(item => item.href === "/organizer") : undefined);
}
