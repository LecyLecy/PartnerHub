"use client";
import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { Breadcrumb, Meter, Notice, PageHeader, ProtectedPage, SkeletonCards, StatGrid, uiStyles, useToast } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import { getQrDelivery, sendQr } from "../services/registration-service";
import styles from "./qr.module.css";

const loadDelivery = (eventId: string, signal: AbortSignal) => getQrDelivery(eventId, signal);

/** Organizer page: see how many registrants hold a QR for one event, then create and send the missing ones in one action. */
export default function QrDeliveryPage({ id }: { id: string }) { return <ProtectedPage><Delivery id={id} /></ProtectedPage>; }

function Delivery({ id }: { id: string }) {
  const resource = useResource(id, loadDelivery);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const toast = useToast();
  if (resource.status === "loading") return <SkeletonCards label="Memuat status QR…" count={2} />;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button type="button" className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button></Notice>;
  const data = resource.data;
  if (!data) return null;
  const waiting = data.registered - data.issued;
  async function send() {
    if (busy) return;
    setBusy(true); setFailure("");
    try { const result = await sendQr(id); toast(`${result.issued} QR sudah terkirim. Peserta diberi notifikasi.`); resource.reload(); }
    catch (error) { setFailure(errorMessage(error)); toast(errorMessage(error), "error"); }
    finally { setBusy(false); }
  }
  return <>
    <Breadcrumb href={`/events/${id}`} parent={data.eventTitle} current="QR tiket" />
    <PageHeader title="QR tiket peserta.">Buat QR masuk untuk setiap peserta yang terdaftar, lalu kirim. Peserta membukanya lewat tombol Tampilkan QR di halaman tiket mereka.</PageHeader>
    {!data.eventPublished && <Notice>QR hanya bisa dikirim untuk acara yang terpublikasi. Buka detail acara untuk memeriksa kesiapan publikasi.</Notice>}
    <StatGrid label="Status QR" items={[{ label: "peserta terdaftar", value: data.registered }, { label: "QR terkirim", value: data.issued }, { label: "menunggu QR", value: waiting }]} />
    <section className={styles.panel} aria-labelledby="qr-send-title">
      <h2 id="qr-send-title">Kirim QR</h2>
      <Meter value={data.issued} max={Math.max(data.registered, 1)} label={`${data.issued} dari ${data.registered} peserta sudah menerima QR`} />
      <p>{data.registered === 0 ? "Belum ada peserta terdaftar."
        : waiting === 0 ? "Semua peserta terdaftar sudah menerima QR. Peserta yang mendaftar setelah ini akan menunggu pengiriman berikutnya."
        : `${waiting} peserta belum menerima QR. Tombol di bawah membuat kode baru hanya untuk mereka dan mengabari mereka lewat notifikasi.`}</p>
      {failure && <Notice error>{failure}</Notice>}
      <button type="button" className={uiStyles.primary} onClick={() => void send()} disabled={busy || !data.eventPublished || waiting === 0}><Icon name="qr" size={18} />{busy ? "Mengirim…" : waiting === data.registered && waiting > 0 ? "Buat dan kirim QR" : "Kirim QR yang tertunda"}</button>
      <p className={styles.fine}>Kode berisi rahasia acak tanpa data pribadi. Peserta menampilkan QR dari tiketnya. Panitia yang diterima memindainya untuk mencatat presensi.</p>
    </section>
  </>;
}
