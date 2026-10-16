"use client";
import type { SponsorOffer } from "@/contracts/sponsor-offer";
import { Badge, uiStyles } from "@/lib/ui";
import { DetailRow } from "./detail-row";
import { offerLabel, offerTone } from "./offer-status";
import styles from "./sponsorship.module.css";

/** Compact row: title, status and a chevron. The message and the answer buttons live in the dialog. */
export function OfferRow({ item, busy, onAnswer }: { item: SponsorOffer; busy: boolean; onAnswer: (id: string, status: "ACCEPTED" | "DECLINED") => Promise<void> }) {
  return <DetailRow title={item.eventTitle} label={`Detail permintaan ${item.eventTitle}`} badge={<Badge tone={offerTone(item.status)}>{offerLabel[item.status]}</Badge>}>
    {(close) => <>
      <p>{item.organizationName || "Penyelenggara"} · {item.category}{item.amountLabel ? ` · ${item.amountLabel}` : ""}</p>
      <p>{item.message}</p>
      {item.proposalUrl && <p><a href={item.proposalUrl} target="_blank" rel="noopener noreferrer">Buka dokumen proposal</a></p>}
      <div className={styles.receivedActions}>
        {item.status === "SENT" && <>
          <button type="button" className={uiStyles.primary} onClick={() => void onAnswer(item.id, "ACCEPTED").then(close)} disabled={busy}>Terima</button>
          <button type="button" className={uiStyles.secondary} onClick={() => void onAnswer(item.id, "DECLINED").then(close)} disabled={busy}>Tolak</button>
        </>}
        <button type="button" className={uiStyles.secondary} onClick={close}>Tutup</button>
      </div>
    </>}
  </DetailRow>;
}
