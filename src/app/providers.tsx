"use client";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { sessionApi } from "@/features/account/services/account-service";
import { SessionProvider } from "@/lib/session";
import { ToastProvider } from "@/lib/ui/toast";

// Imported only when the build enables demo mode, so normal bundles contain no demo code or data.
const DemoBanner = process.env.NEXT_PUBLIC_PARTNERHUB_DEMO === "1"
  ? dynamic(() => import("@/mocks/demo/banner"), { ssr: false })
  : null;

export default function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider api={sessionApi}><ToastProvider>{DemoBanner && <DemoBanner />}{children}</ToastProvider></SessionProvider>;
}
