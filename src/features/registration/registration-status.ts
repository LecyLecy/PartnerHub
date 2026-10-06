import type { RegistrationStatus } from "@/contracts/participation";

export const statusLabel: Record<RegistrationStatus, string> = { PENDING: "Menunggu konfirmasi", REGISTERED: "Terdaftar", REJECTED: "Ditolak", CANCELLED: "Dibatalkan" };
export const statusTone: Record<RegistrationStatus, "success" | "warning" | "danger" | "neutral"> = { PENDING: "warning", REGISTERED: "success", REJECTED: "danger", CANCELLED: "neutral" };
