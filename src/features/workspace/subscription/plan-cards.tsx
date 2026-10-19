import { formatPrice } from "@/lib/money";
import Link from "next/link";
import { Badge, uiStyles } from "@/lib/ui";
import { organizerPlans, organizerPlanFeatures, type OrganizerPlanId } from "./plans";
import { packageTiers, type AccountSubscription } from "@/contracts/billing";
import styles from "./subscription.module.css";

/** Same two per-event tiers on pricing and the selected event's package page. */
export function PlanCards({ selectedId, onSelect, cycle = "SINGLE", activeSubscription }: { selectedId?: OrganizerPlanId | null; onSelect?: (id: OrganizerPlanId) => void; cycle?: "SINGLE" | "ANNUAL"; activeSubscription?: AccountSubscription | null }) {
  return <>
    <ul className={`${styles.plans} ${cycle === "ANNUAL" ? styles.subscriptionPlans : ""}`} aria-label={cycle === "ANNUAL" ? "Pilihan subscription" : "Pilihan paket penyelenggara"}>{organizerPlans.map(plan => <li key={plan.id} className={styles.card} data-selected={selectedId === plan.id || activeSubscription?.tier === plan.id}>
      <div className={styles.cardHeading}><h2>Paket {plan.name}</h2>{activeSubscription?.tier === plan.id ? <Badge tone="success">Aktif</Badge> : selectedId === plan.id && <Badge tone="success">Dipilih</Badge>}</div>
      <p className={styles.description}>{cycle === "ANNUAL" ? "Acara tak terbatas selama satu tahun. Jadwal dan kapasitas setiap acara harus sesuai paket." : plan.description}</p>
      <p className={styles.price}><strong>{formatPrice(cycle === "ANNUAL" ? packageTiers[plan.id].annualPrice : plan.priceIdr)}</strong><span>{cycle === "ANNUAL" ? "/ tahun" : plan.unit}</span></p>
      <p className={styles.scope}>{plan.scope}</p>
      {activeSubscription?.tier === plan.id && <p className={styles.note}>Berlaku sampai {new Date(activeSubscription.endsAt).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })}.</p>}
      {activeSubscription?.tier === plan.id ? <Link className={`${uiStyles.secondary} ${styles.cardAction}`} href="/organizer/archive">Buka Arsip acara</Link> : onSelect && <button type="button" className={`${uiStyles.secondary} ${styles.cardAction}`} disabled={Boolean(activeSubscription)} aria-label={`Pilih ${cycle === "ANNUAL" ? "subscription" : "paket"} ${plan.name}`} aria-pressed={selectedId === plan.id} onClick={() => onSelect(plan.id)}>{activeSubscription ? "Subscription aktif" : selectedId === plan.id ? "Paket dipilih" : `Pilih ${plan.name}`}</button>}
    </li>)}{cycle === "ANNUAL" && <li className={styles.card}>
      <h2>Custom</h2><p className={styles.description}>Untuk acara berkapasitas besar atau kebutuhan pengelolaan khusus.</p>
      <p className={styles.price}><strong>Penawaran khusus</strong></p><p className={styles.scope}>Kapasitas peserta dan layanan disesuaikan dengan kebutuhan acaramu.</p>
      <Link className={`${uiStyles.secondary} ${styles.cardAction}`} href="/contact">Kontak PartnerHub</Link>
    </li>}</ul>
    {cycle === "SINGLE" && <><section className={styles.featuresSection} aria-labelledby="plan-features-title"><h2 id="plan-features-title">Fitur paket & biaya tambahan</h2>
      <ul className={styles.features}>{organizerPlanFeatures.map(feature => <li key={feature}>{feature}</li>)}</ul>
      <p className={styles.note}>Gateway pembayaran, iklan, perangkat, petugas lapangan, dan pekerjaan khusus terpisah. Biaya sponsorship mengikuti kesepakatan; tidak ada pemotongan otomatis.</p>
    </section>
    <div className={styles.custom}><strong>Custom</strong><p>Lebih dari 1.500 peserta atau 10 pengelola? Siapkan kebutuhan acara untuk penawaran khusus.</p></div></>}
  </>;
}
