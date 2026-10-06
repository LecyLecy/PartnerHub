import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { headingFont, bodyFont } from "@/lib/fonts";
import Providers from "./providers";
import "./globals.css";
export const metadata: Metadata = { title: { default: "PartnerHub", template: "%s · PartnerHub" }, description: "Ruang kerja penyelenggara acara: dari detail event dan identitas visual hingga komitmen sponsor." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="id"><body className={`${headingFont.variable} ${bodyFont.variable}`}><Suspense fallback={<div className="route-state" role="status">Menyiapkan halaman…</div>}><Providers>{children}</Providers></Suspense></body></html>;
}
