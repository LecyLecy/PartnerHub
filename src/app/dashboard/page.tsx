"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionGate, useSession } from "@/lib/session";
import { homeFor } from "@/lib/navigation";
import { Loading } from "@/lib/ui";

/** /dashboard is only a router: each role has its own dashboard. */
function Redirect() {
  const auth = useSession();
  const router = useRouter();
  const home = auth.session ? homeFor(auth.session) : null;
  useEffect(() => { if (home && home !== "/dashboard") router.replace(home); }, [home, router]);
  return <Loading>Membuka halaman kerja…</Loading>;
}
export default function Page() { return <SessionGate><Redirect/></SessionGate>; }
