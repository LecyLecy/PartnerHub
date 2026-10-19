import type { Metadata } from "next";
import { MyTickets } from "@/features/registration/my-tickets";
import { BackLink, PageHeader, ProtectedPage } from "@/lib/ui";

export const metadata: Metadata = { title: "Tiket saya" };

/** Participant ticket destination; committee applications have their own route. */
export default function Page() {
  return <ProtectedPage>
    <BackLink href="/me" />
    <PageHeader title="Tiket saya">Tiket dan QR untuk acara yang kamu ikuti.</PageHeader>
    <MyTickets />
  </ProtectedPage>;
}
