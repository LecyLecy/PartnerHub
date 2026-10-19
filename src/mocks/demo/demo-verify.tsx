"use client";
import Link from "next/link";

/** Demo builds send no email, so this link stands in for the one in the message. */
export default function DemoVerify({ registered }: { registered: string | null }) {
  const query = new URLSearchParams({ token: "demo-token", ...(registered ? { registered } : {}) });
  return <p><Link href={`/verify-email?${query}`}>Buka tautan verifikasi</Link></p>;
}
