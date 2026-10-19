"use client";
import { useState } from "react";
import type { PackageTier } from "@/contracts/billing";
import { errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { Loading, Notice, PageHeader, ProtectedPage } from "@/lib/ui";
import { getBilling } from "./billing-service";
import { PlanCards } from "./plan-cards";
import { SubscriptionCheckout } from "./subscription-checkout";

export default function SubscriptionPage() { return <ProtectedPage><Subscription /></ProtectedPage>; }
function Subscription() {
  const resource = useResource("billing", getBilling);
  const [selected, setSelected] = useState<PackageTier | null>(null);
  if (resource.status === "loading") return <Loading>Memuat subscription…</Loading>;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button onClick={resource.reload}>Coba lagi</button></Notice>;
  const board = resource.data;
  if (!board) return null;
  return <>
    <PageHeader title="Subscription">Untuk penyelenggara yang rutin membuat acara. Pilihan alternatif dari bayar per event.</PageHeader>
    <PlanCards cycle="ANNUAL" activeSubscription={board.subscription} onSelect={setSelected} />
    {selected && !board.subscription && <SubscriptionCheckout key={selected} tier={selected}
      pending={board.subscriptionOrders.find(order => order.tier === selected && order.status === "PENDING") ?? null}
      onDismiss={() => setSelected(null)} onActivated={() => { setSelected(null); resource.reload(); }} />}
  </>;
}
