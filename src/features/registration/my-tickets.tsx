"use client";
import { errorMessage } from "@/lib/api-client";
import { formatPrice } from "@/lib/money";
import { eventWhen } from "@/lib/public-events";
import { useResource } from "@/lib/use-resource";
import { Badge, EmptyState, Notice, SkeletonCards, uiStyles } from "@/lib/ui";
import { TicketQr } from "./qr/ticket-qr-dialog";
import { listMyRegistrations } from "./services/registration-service";
import styles from "./me.module.css";

/** The participant's tickets. Used by the composed "Acara saya" page. */
export function MyTickets() {
  const tickets = useResource("tickets", listMyRegistrations);
  return <section className={styles.panel} aria-labelledby="tickets-title">
    <div className={styles.panelHead}><h2 id="tickets-title">Tiket</h2><p>Acara yang sudah kamu ikuti, lengkap dengan QR masuk dari penyelenggara.</p></div>
    {tickets.status === "loading" ? <SkeletonCards label="Memuat tiket…" count={2} />
      : tickets.status === "error" ? <Notice error>{errorMessage(tickets.error)} <button className={uiStyles.secondary} onClick={tickets.reload}>Muat ulang</button></Notice>
      : !tickets.data?.length ? <EmptyState title="Belum ada tiket." href="/me" action="Lihat acara">Daftar ke sebuah acara. Tiketmu muncul di sini.</EmptyState>
      : <ul className={styles.ticketList}>{tickets.data.map((item) => <li key={item.id} data-status={item.status}>
        <div className={styles.ticketMain}>
          <Badge tone={item.status === "REGISTERED" ? "success" : "neutral"}>{item.status === "REGISTERED" ? "Terdaftar" : "Dibatalkan"}</Badge>
          <h3>{item.event.title}</h3>
          <p>{eventWhen(item.event.startsAt)}{item.event.venue ? ` · ${item.event.venue}` : ""}</p>
          <p>{formatPrice(item.priceIdr)}</p>
        </div>
        <p className={styles.reference}>Referensi tiket <strong>{item.ticketReference}</strong></p>
        {item.status === "REGISTERED" && <div className={styles.ticketActions}><TicketQr registrationId={item.id} title={item.event.title} reference={item.ticketReference} sent={item.qrIssued} /></div>}
      </li>)}</ul>}
    <p className={styles.hint}>QR masuk dikirim penyelenggara per acara. Pemindaian di pintu masuk masih dalam pengembangan.</p>
  </section>;
}