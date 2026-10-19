import { packageTiers, type PackageTier } from "@/contracts/billing";
export const organizerPlans = (["STARTER", "GROWTH"] as PackageTier[]).map(tier => ({
  id: tier, tier, name: packageTiers[tier].name,
  priceIdr: packageTiers[tier].singlePrice, unit: "/ event",
  description: "Bayar satu kali untuk satu acara.",
  scope: `${packageTiers[tier].participants.toLocaleString("id-ID")} peserta dan ${packageTiers[tier].managers} pengelola, termasuk pemilik`,
}));
export type OrganizerPlanId = PackageTier;
export const organizerPlanFeatures = ["Halaman acara dan registrasi peserta", "Pendaftaran serta seleksi panitia", "Tiket dan presensi QR opsional", "Pengelolaan proposal dan manfaat sponsor"] as const;
