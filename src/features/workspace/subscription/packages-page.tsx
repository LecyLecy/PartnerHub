"use client";
import { useConfirm } from "@/lib/ui/confirmation";
import Link from "next/link";
import { useState } from "react";
import { packageTiers, type PackageTier, type PackageOrder, type SubscriptionOrder } from "@/contracts/billing";
import { errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { formatPrice } from "@/lib/money";
import { BackLink, Notice, PageHeader, ProtectedPage, Loading, uiStyles } from "@/lib/ui";
import { PlanCards } from "./plan-cards";
import { createOrder, getBilling, getPackage, verifyDemoOrder, verifySubscriptionOrder } from "./billing-service";
import styles from "./subscription.module.css";

export default function PackagesPage({ eventId }: { eventId: string }) { return <ProtectedPage><Package eventId={eventId} /></ProtectedPage>; }
function Package({ eventId }: { eventId: string }) {
  const resource = useResource(eventId, getPackage);
  const board = useResource("billing", getBilling);
  const [tier, setTier] = useState<PackageTier | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [message, setMessage] = useState("");
  async function order() {
    if (!tier || busy) return;
    setBusy(true); setFailure("");
    try { const created = await createOrder(tier, eventId); setMessage(`Pesanan ${packageTiers[created.tier].name}: ${formatPrice(created.amountIdr)}. Periksa sebelum mengonfirmasi pembayaran.`); board.reload(); }
    catch (error) { setFailure(errorMessage(error)); }
    finally { setBusy(false); }
  }
  if (resource.status === "loading") return <Loading>Memuat informasi pembayaran…</Loading>;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button onClick={resource.reload}>Coba lagi</button></Notice>;
  const value = resource.data; if (!value) return null;
  const upgrade = value.coverage?.source === "SINGLE" && value.coverage.tier === "STARTER" && tier === "GROWTH";
  const amount = tier ? upgrade ? 350000 : packageTiers[tier].singlePrice : null;
  const displayedTier = tier ?? value.coverage?.tier;
  return <>
    <BackLink href={`/events/${encodeURIComponent(eventId)}`}>Ringkasan acara</BackLink>
    <PageHeader title={displayedTier ? `Paket ${packageTiers[displayedTier].name}` : "Pilih paket"}>{board.data?.events.find(event => event.id === eventId)?.title ?? "Paket hanya berlaku untuk acara yang dipilih."}</PageHeader>
    <Notice>{value.message}</Notice>
    {value.canPublish && <p><Link className={uiStyles.primary} href={`/events/${encodeURIComponent(eventId)}`}>Lanjut unggah acara</Link></p>}
    {!value.coverage && <p>Sering membuat acara? <Link href="/organizer/subscription">Lihat subscription</Link> sebagai alternatif pembayaran per event.</p>}
    {failure && <Notice error>{failure}</Notice>}{message && <Notice>{message}</Notice>}
    {value.owner && !value.readOnly && (!value.coverage || value.coverage.source === "SINGLE" && value.coverage.tier === "STARTER") ? <>
      <PlanCards selectedId={tier} onSelect={setTier} />
      {tier && <section className={styles.selection}><h2>Periksa pesanan</h2><p>{packageTiers[tier].name} · {formatPrice(amount!)} untuk satu acara{upgrade ? " · Upgrade dari Starter" : ""}.</p>
        <p className={styles.note}>Membuat pesanan belum mengaktifkan paket. Periksa transaksi, lalu konfirmasikan pembayaran.</p>
        <button type="button" className={uiStyles.primary} disabled={busy || Boolean(value.coverage && !upgrade)} onClick={() => void order()}>Buat pesanan</button>
      </section>}
    </> : !value.owner && <p>Pembelian dan upgrade paket hanya dapat dilakukan pemilik acara.</p>}
    <Transactions eventId={eventId} resource={board} onVerified={resource.reload} />
  </>;
}
type BoardResource = ReturnType<typeof useResource<Awaited<ReturnType<typeof getBilling>>>>;
export function TransactionsPage() {
  return <ProtectedPage><TransactionHistory /></ProtectedPage>;
}
function TransactionHistory() {
  const resource = useResource("billing", getBilling);
  return <><BackLink href="/settings" /><PageHeader title="Riwayat transaksi">Pembayaran per event dan subscription akunmu.</PageHeader><Transactions resource={resource} /></>;
}
export function Transactions({ eventId, resource, onVerified }: { eventId?: string; resource: BoardResource; onVerified?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const confirm = useConfirm();
  async function verify(order: PackageOrder | SubscriptionOrder) {
    if (busy || !await confirm({ title: "Konfirmasi pembayaran?", description: `Paket ${packageTiers[order.tier].name} sebesar ${formatPrice(order.amountIdr)} untuk ${order.cycle === "ANNUAL" ? "subscription satu tahun pada akunmu" : board?.events.find(event => event.id === order.eventId)?.title ?? "acara ini"}. Pastikan pesanan sudah sesuai sebelum melanjutkan.`, confirmLabel: "Konfirmasi pembayaran" })) return;
    setBusy(true); setFailure("");
    try { await (order.cycle === "ANNUAL" ? verifySubscriptionOrder(order.id) : verifyDemoOrder(order.id)); resource.reload(); onVerified?.(); }
    catch (error) { setFailure(errorMessage(error)); }
    finally { setBusy(false); }
  }
  if (resource.status === "loading") return <Loading>Memuat transaksi…</Loading>;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button onClick={resource.reload}>Coba lagi</button></Notice>;
  const board = resource.data; if (!board) return null;
  const orders = board.orders.filter(order => !eventId || order.eventId === eventId);
  const history = board.history.filter(order => !eventId || order.eventId === eventId);
  const entries = [
    ...orders.map(order => ({ order, current: order })),
    ...(!eventId ? board.subscriptionOrders.map(order => ({ order, current: order })) : []),
    ...history.map(order => ({ order, current: null })),
  ].sort((a, b) => Date.parse(b.order.createdAt) - Date.parse(a.order.createdAt));
  return <section className={styles.transactions} aria-label="Transaksi paket"><h2>Transaksi paket</h2>
    {failure && <Notice error>{failure}</Notice>}
    {!entries.length && <p>Belum ada transaksi.</p>}
    <ul className={styles.records}>{entries.map(({ order, current }) => <li key={`${current ? "current" : "history"}-${order.id}`}>
      <strong>{packageTiers[order.tier].name} · {board.events.find(event => event.id === order.eventId)?.title ?? (order.cycle === "ANNUAL" ? "Tahunan" : "Satuan")}</strong>
      <p>{formatPrice(order.amountIdr)} · {order.status === "SUCCEEDED" ? "Terverifikasi" : order.status === "EXPIRED" ? "Kedaluwarsa" : "Menunggu verifikasi"}{current?.upgrade ? " · Upgrade" : ""}</p>
      <p className={styles.note}><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB</time></p>
      {current && <Link href={current.cycle === "ANNUAL" ? "/organizer/subscription" : `/events/${encodeURIComponent(current.eventId)}/package`}>Paket {packageTiers[current.tier].name}</Link>}
      {current?.status === "PENDING" && <button type="button" className={uiStyles.secondary} disabled={busy} onClick={() => void verify(current)}>Konfirmasi pembayaran</button>}
    </li>)}</ul>
  </section>;
}
