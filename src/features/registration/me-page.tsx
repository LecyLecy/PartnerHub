"use client";
import Link from "next/link";
import { errorMessage } from "@/lib/api-client";
import { listPublicEvents } from "@/lib/public-events";
import { useResource } from "@/lib/use-resource";
import { EmptyState, EventCard, EventGrid, Notice, PageHeader, ProtectedPage, SkeletonCards, StatGrid, uiStyles, useToast } from "@/lib/ui";
import { RegisterForm } from "./register-form";
import { listMyRegistrations } from "./services/registration-service";
import styles from "./me.module.css";

export default function MePage() { return <ProtectedPage><Me /></ProtectedPage>; }

function Me() {
  const tickets = useResource("tickets", listMyRegistrations);
  const events = useResource("public-events", listPublicEvents);
  const toast = useToast();
  const registeredIds = new Set((tickets.data ?? []).filter((item) => item.status === "REGISTERED" || item.status === "PENDING").map((item) => item.event.id));
  // Events the participant already joined live under "Acara saya", so they leave this catalog.
  const open = (events.data ?? []).filter((item) => !registeredIds.has(item.id));
  const ready = events.status === "success" && tickets.status === "success";
  return <>
    <PageHeader title="Temukan acara." action={<Link className={uiStyles.secondary} href="/me/events">Tiket saya</Link>}>Pilih acara untuk melihat detail dan mendaftar.</PageHeader>
    {ready && <StatGrid items={[{ label: "acara bisa diikuti", value: open.length }, { label: "acara saya", value: registeredIds.size }]} />}
    <section className={styles.panel} aria-labelledby="events-title">
      <div className={styles.panelHead}><h2 id="events-title">Acara yang dibuka</h2><p>Harga dan form pendaftaran ditetapkan penyelenggara.</p></div>
      {events.status === "error" ? <Notice error>{errorMessage(events.error)} <button className={uiStyles.secondary} onClick={events.reload}>Muat ulang</button></Notice>
        : tickets.status === "error" ? <Notice error>{errorMessage(tickets.error)} <button className={uiStyles.secondary} onClick={tickets.reload}>Muat ulang</button></Notice>
        : !ready ? <SkeletonCards label="Memuat acara…" count={3} />
        : !open.length ? <EmptyState title={events.data?.length ? "Kamu sudah mengikuti semua acara yang dibuka." : "Belum ada acara terbuka."} href="/me/events" action="Lihat tiket saya">{events.data?.length ? "Buka Tiket saya untuk melihat acara yang kamu ikuti." : "Acara yang dipublikasikan penyelenggara akan muncul di sini."}</EmptyState>
        : <EventGrid>{open.map((item, index) => <EventCard key={item.id} event={item} tone={index}
          actions={(close) => <RegisterForm event={item} onDone={(registration) => { close(); toast(registration.status === "PENDING" ? "Bukti terkirim. Menunggu konfirmasi penyelenggara." : "Pendaftaran berhasil. Tiketmu ada di Tiket saya."); tickets.reload(); events.reload(); }} />} />)}</EventGrid>}
    </section>
  </>;
}
