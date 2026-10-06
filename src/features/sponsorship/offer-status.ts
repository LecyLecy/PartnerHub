import type { OfferStatus } from "@/contracts/sponsor-offer";

export const offerLabel: Record<OfferStatus, string> = { SENT: "Menunggu tanggapan", ACCEPTED: "Diterima sponsor", DECLINED: "Ditolak sponsor" };
export const offerTone = (status: OfferStatus) => status === "ACCEPTED" ? "success" : status === "DECLINED" ? "danger" : "info";
