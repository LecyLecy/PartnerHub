"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeader, headerStyles } from "./site-header";

export const publicLinks = [
  { href: "/explore", label: "Jelajahi event" }, { href: "/#fitur", label: "Cara kerja" },
  { href: "/pricing", label: "Harga" }, { href: "/about", label: "Tentang" },
] as const;

/** Identical navigation and destinations on every guest page, including the landing page. */
export function PublicHeader() {
  const pathname = usePathname();
  return <SiteHeader wide brandHref="/" links={publicLinks.map(link => ({ ...link, current: !link.href.includes("#") && (pathname === link.href || pathname.startsWith(`${link.href}/`)) }))}
    actions={<><Link className={`${headerStyles.login} ${headerStyles.loginWide}`} href="/login">Masuk</Link><Link className={`${headerStyles.signup} ${headerStyles.compact}`} href="/register">Daftar</Link></>}
    menuExtra={<><Link href="/login">Masuk</Link><Link href="/register">Daftar</Link></>} />;
}
