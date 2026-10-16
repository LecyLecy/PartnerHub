import type { Metadata } from "next";
import { MyApplications } from "@/features/committee/my-applications";
import { MyTickets } from "@/features/registration/my-tickets";
import { BackLink, PageHeader, ProtectedPage } from "@/lib/ui";

export const metadata: Metadata = { title: "Acara saya" };

/** Composes the two participant views: tickets (registration) and committee applications (committee). */
export default function Page() {
  return <ProtectedPage>
    <BackLink href="/me" />
    <PageHeader title="Acara saya">Tiket acara yang kamu ikuti dan lamaran kepanitiaan yang sudah kamu kirim, di satu tempat.</PageHeader>
    <MyTickets />
    <MyApplications />
  </ProtectedPage>;
}