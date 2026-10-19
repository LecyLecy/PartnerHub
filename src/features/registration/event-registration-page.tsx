"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/api-client";
import { getPublicEvent, publicEventStatus } from "@/lib/public-events";
import { useResource } from "@/lib/use-resource";
import { BackLink, Loading, Notice, PageHeader, ProtectedPage, uiStyles } from "@/lib/ui";
import { EventDetails } from "@/lib/ui/event-card";
import { RegisterForm } from "./register-form";
import { listMyRegistrations } from "./services/registration-service";

export default function EventRegistrationPage({ id }: { id: string }) { return <ProtectedPage><Registration id={id} /></ProtectedPage>; }
function Registration({ id }: { id: string }) {
  const router = useRouter();
  const event = useResource(id, getPublicEvent);
  const registrations = useResource("tickets", listMyRegistrations);
  if (event.status === "loading" || registrations.status === "loading") return <Loading>Memuat pendaftaran…</Loading>;
  if (event.status === "error") return <Notice error>{errorMessage(event.error)} <button onClick={event.reload}>Coba lagi</button> <Link href="/me">Jelajahi event</Link></Notice>;
  if (registrations.status === "error") return <Notice error>{errorMessage(registrations.error)} <button onClick={registrations.reload}>Coba lagi</button></Notice>;
  if (!event.data) return null;
  const joined = registrations.data?.some(item => item.event.id === id && (item.status === "PENDING" || item.status === "REGISTERED"));
  return <>
    <BackLink href={`/explore/${encodeURIComponent(id)}`}>Detail acara</BackLink>
    <PageHeader title="Pendaftaran peserta">{event.data.title}</PageHeader>
    {joined ? <Notice>Kamu sudah mengirim pendaftaran untuk acara ini. <Link className={uiStyles.secondary} href="/me/events">Lihat tiket saya</Link></Notice>
      : publicEventStatus(event.data) === "ended" ? <Notice>Acara sudah selesai. Pendaftaran tidak tersedia.</Notice>
        : <EventDetails event={event.data} actions={<RegisterForm event={event.data} onDone={() => router.push("/me/events")} />} />}
  </>;
}
