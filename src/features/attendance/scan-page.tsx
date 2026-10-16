"use client";
/* eslint-disable @next/next/no-img-element -- event form images are scoped URLs or demo data URLs */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TicketScan } from "@/contracts/participation";
import { ApiError, errorMessage } from "@/lib/api-client";
import { exportTime } from "@/lib/export";
import { useResource } from "@/lib/use-resource";
import { Badge, Breadcrumb, EmptyState, Notice, PageHeader, ProtectedPage, SkeletonCards, uiStyles } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import { CameraScanner } from "./camera-scanner";
import { readQrFile } from "./qr-reader";
import { getAttendance, scanTicket } from "./services/attendance-service";
import styles from "./scan.module.css";

export default function ScanPage({ id }: { id: string }) { return <ProtectedPage><Scanner id={id} /></ProtectedPage>; }

function Scanner({ id }: { id: string }) {
  const board = useResource(id, getAttendance);
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [result, setResult] = useState<TicketScan | null>(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  const heading = useRef<HTMLHeadingElement>(null);
  const reload = useRef(board.reload);
  useEffect(() => { reload.current = board.reload; }, [board.reload]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (result) heading.current?.focus(); }, [result]);
  const stop = useCallback(() => setCamera(false), []);
  const check = useCallback(async (payload: string) => {
    if (locked.current) return;
    locked.current = true; setCamera(false); setBusy(true); setFailure(""); setResult(null);
    try { const data = await scanTicket(id, payload); if (mounted.current) { setResult(data); reload.current(); } }
    catch (error) { if (mounted.current) setFailure(error instanceof ApiError && error.code === "TICKET_INACTIVE" ? "Tiket tidak aktif. Pendaftaran belum dikonfirmasi atau sudah dibatalkan." : error instanceof ApiError && ["INVALID_TICKET", "NOT_FOUND"].includes(error.code) ? "Tiket tidak valid untuk acara ini. Tidak ada kehadiran yang dicatat." : errorMessage(error)); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }, [id]);
  async function choose(file: File) {
    if (locked.current) return;
    locked.current = true; setCamera(false); setBusy(true); setFailure(""); setResult(null);
    try { const payload = await readQrFile(file); locked.current = false; if (mounted.current) await check(payload); }
    catch (error) { if (mounted.current) setFailure(error instanceof Error ? error.message : "Gambar tidak dapat dibaca."); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  if (board.status === "loading" && !result) return <SkeletonCards label="Memuat data acara…" count={2} />;
  if (board.status === "error" && !result) return <Notice error>{errorMessage(board.error)} <button type="button" className={uiStyles.secondary} onClick={board.reload}>Coba lagi</button></Notice>;
  const title = board.data?.eventTitle ?? result?.eventTitle;
  return <>
    <Breadcrumb href={`/events/${id}/registration`} parent={title || "Pendaftaran peserta"} current="Scan tiket" />
    <PageHeader title="Scan tiket peserta.">Periksa tiket individual peserta.{board.data?.attendanceEnabled ? " QR valid otomatis masuk ke daftar Hadir." : " Modul kehadiran tidak aktif, scan hanya memeriksa tiket."}</PageHeader>
    <div className={styles.layout}>
      <section className={styles.controls} aria-labelledby="scan-controls">
        <h2 id="scan-controls">Periksa QR tiket</h2><p>Gunakan kamera atau pilih gambar QR dari tiket peserta. Gambar dibaca di perangkat, tidak diunggah.</p>
        {camera ? <CameraScanner onRead={check} onStop={stop} /> : <div className={styles.actions}><button type="button" className={uiStyles.primary} disabled={busy} onClick={() => { setFailure(""); setResult(null); setCamera(true); }}><Icon name="qr" size={18} />Buka kamera</button><label className={styles.fileLabel}>Pilih gambar QR<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} aria-label="Pilih gambar QR" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void choose(file); }} /></label></div>}
        {busy && <p role="status">Memeriksa tiket dan status hadir…</p>}
        {failure && <Notice error>{failure}</Notice>}
        <Link href={`/events/${id}/qr`}>Kelola pengiriman QR</Link>
      </section>
      <section className={styles.ticket} aria-labelledby="scan-result">
        <h2 id="scan-result" ref={heading} tabIndex={-1}>Hasil pengecekan</h2>
        {!result ? <EmptyState title="Belum ada tiket dipindai.">Data peserta tampil setelah QR valid terbaca.</EmptyState> : <>
          <div role="status"><Badge tone={result.attendance === "DISABLED" ? "info" : "success"}>{result.attendance === "RECORDED" ? "Hadir tercatat" : result.attendance === "ALREADY_RECORDED" ? "Sudah hadir sebelumnya" : "Tiket valid"}</Badge></div>
          <h3 className={styles.name}>{result.participant.name}</h3><p>{result.eventTitle}</p>
          <dl className={styles.facts}><div><dt>Referensi tiket</dt><dd>{result.participant.ticketReference}</dd></div><div><dt>Status tiket</dt><dd>Terdaftar</dd></div><div><dt>Waktu hadir</dt><dd>{result.participant.checkedInAt ? exportTime(result.participant.checkedInAt) : "Tidak dicatat, modul kehadiran nonaktif"}</dd></div></dl>
          {result.participant.answers.length > 0 && <section className={styles.answers}><h3>Jawaban pendaftaran</h3>{result.participant.answers.map((answer) => <div key={answer.fieldId}><strong>{answer.label}</strong>{answer.type === "image" ? <img src={answer.value} alt={answer.label} /> : <p>{answer.value}</p>}</div>)}</section>}
          <button type="button" className={uiStyles.primary} onClick={() => { setResult(null); setFailure(""); setCamera(true); }}>Scan peserta berikutnya</button>
        </>}
      </section>
    </div>
    <section className={styles.attendance} aria-labelledby="attendance-title"><h2 id="attendance-title">Daftar Hadir{board.data ? ` (${board.data.items.length})` : ""}</h2>
      {board.status === "loading" ? <p role="status">Memuat daftar hadir…</p> : board.status === "error" ? <Notice error>{errorMessage(board.error)} <button type="button" className={uiStyles.secondary} onClick={board.reload}>Muat ulang daftar hadir</button></Notice> : !board.data?.items.length ? <p>Belum ada peserta tercatat hadir.</p> : <ul>{board.data.items.map((item) => <li key={item.id}><div><strong>{item.name}</strong><span>{item.ticketReference}</span></div><span>{exportTime(item.checkedInAt!)}</span></li>)}</ul>}
    </section>
  </>;
}
