"use client";
import { useEffect, useId, useRef, useState } from "react";
import { packageTiers, type PackageTier, type SubscriptionOrder } from "@/contracts/billing";
import { ApiError, errorMessage } from "@/lib/api-client";
import { formatPrice } from "@/lib/money";
import { Notice, uiStyles } from "@/lib/ui";
import { useConfirm } from "@/lib/ui/confirmation";
import { createSubscriptionOrder, verifySubscriptionOrder } from "./billing-service";
import styles from "./subscription.module.css";

export function SubscriptionCheckout({ tier, pending, onDismiss, onActivated }: {
  tier: PackageTier; pending: SubscriptionOrder | null; onDismiss: () => void; onActivated: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [order, setOrder] = useState(pending);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirm = useConfirm();
  const plan = packageTiers[tier];
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal(); close.current?.focus();
    return () => { element?.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  async function create() {
    if (busy) return;
    setBusy(true); setError("");
    try { setOrder(await createSubscriptionOrder(tier)); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  async function verify() {
    if (!order || busy || !await confirm({ title: "Konfirmasi pembayaran?", description: `Paket ${plan.name} sebesar ${formatPrice(order.amountIdr)} untuk subscription satu tahun pada akunmu. Tidak ada perpanjangan otomatis.`, confirmLabel: "Konfirmasi pembayaran" })) return;
    setBusy(true); setError("");
    try { await verifySubscriptionOrder(order.id); onActivated(); }
    catch (error) { if (error instanceof ApiError && error.code === "ORDER_EXPIRED") setOrder(null); setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className={styles.checkoutDialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onDismiss(); }} onKeyDown={event => {
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) event.preventDefault();
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }}>
    <div className={styles.checkoutHeading}><h2 id={titleId}>Periksa subscription</h2><button ref={close} type="button" className={uiStyles.secondary} disabled={busy} onClick={onDismiss}>Tutup</button></div>
    <h3>Paket {plan.name}</h3><p className={styles.price}><strong>{formatPrice(order?.amountIdr ?? plan.annualPrice)}</strong><span>/ tahun</span></p>
    <p>Acara tak terbatas sesuai batas paket. Subscription dimulai setelah pembayaran dikonfirmasi, tanpa perpanjangan otomatis.</p>
    {order && <p role="status">Pesanan menunggu konfirmasi pembayaran. Periksa paket dan nominal sebelum melanjutkan.</p>}
    {error && <Notice error>{error}</Notice>}
    <div className={styles.checkoutActions}>{order ? <button type="button" className={uiStyles.primary} disabled={busy} onClick={() => void verify()}>{busy ? "Memproses…" : "Konfirmasi pembayaran"}</button> : <button type="button" className={uiStyles.primary} disabled={busy} onClick={() => void create()}>{busy ? "Memproses…" : "Buat pesanan subscription"}</button>}</div>
  </dialog>;
}
