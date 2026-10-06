"use client";
import Link from "next/link";
import { SiteHeader, headerStyles } from "@/lib/ui/site-header";
import { navLinks } from "./landing-data";

/** The landing page uses the same header as every other public and signed-in page. */
export function LandingNav() {
  return <SiteHeader
    wide
    brandHref="/"
    links={[...navLinks, { href: "/about", label: "Tentang" }]}
    actions={<>
      <Link className={`${headerStyles.login} ${headerStyles.loginWide}`} href="/login">Masuk</Link>
      <Link className={`${headerStyles.signup} ${headerStyles.compact}`} href="/register">Daftar</Link>
    </>}
    menuExtra={<><Link href="/login">Masuk</Link><Link href="/register">Daftar</Link></>}
  />;
}
