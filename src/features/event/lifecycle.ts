import type { EventRecord } from "@/contracts/event";

export type EventAction = "publish" | "close" | "archive";

export function publicationErrors(event: EventRecord, now = Date.now()): string[] {
  const errors: string[] = [];
  if (event.title.trim().length < 3) errors.push("Isi nama acara minimal 3 karakter.");
  const start = event.startsAt ? Date.parse(event.startsAt) : NaN;
  const end = event.endsAt ? Date.parse(event.endsAt) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end <= now) errors.push("Lengkapi jadwal mulai dan selesai yang valid di masa mendatang.");
  if (!event.venue.trim()) errors.push("Isi lokasi atau tautan pelaksanaan online.");
  if (!event.branding.organizationName.trim()) errors.push("Isi nama organisasi penyelenggara.");
  if (event.modules.registration && (!event.capacity || event.capacity < 1)) errors.push("Tentukan kapasitas peserta.");
  if (event.modules.registration) {
    const opens = event.registrationOpensAt ? Date.parse(event.registrationOpensAt) : NaN;
    const closes = event.registrationClosesAt ? Date.parse(event.registrationClosesAt) : NaN;
    if (!Number.isFinite(opens) || !Number.isFinite(closes) || closes <= opens || closes > start || closes <= now) errors.push("Lengkapi periode pendaftaran; penutupan harus setelah pembukaan dan paling lambat saat acara dimulai.");
  }
  if (event.modules.attendance && !event.modules.registration) errors.push("Aktifkan pendaftaran sebelum menggunakan presensi.");
  return errors;
}
