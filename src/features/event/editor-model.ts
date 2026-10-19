import type { EventInput, EventRecord } from "@/contracts/event";
import { initialDraft, type EventDraft } from "./draft";
import { emptyBranding, type EventBranding } from "./event-branding";

export function localTime(value: string | null): string {
  return value ? new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 16) : "";
}
export function recordToEditor(record?: EventRecord): { draft: EventDraft; branding: EventBranding } {
  if (!record) return { draft: initialDraft, branding: emptyBranding() };
  const asset = (value: EventRecord["branding"]["eventLogo"]) => value ? { remote: value, name: value.name } : null;
  const start = localTime(record.startsAt); const end = localTime(record.endsAt);
  return { draft: { title: record.title, category: record.category as EventDraft["category"], summary: record.summary, matchingFields: record.matchingFields ?? [], date: start.slice(0, 10), startTime: start.slice(11), endTime: end.slice(11), venue: record.venue, capacity: record.capacity === null ? "" : String(record.capacity), modules: record.modules }, branding: { organizationName: record.branding.organizationName, eventLogo: asset(record.branding.eventLogo), organizationLogo: asset(record.branding.organizationLogo), sponsors: record.branding.sponsors.map(item => ({ ...item, logo: asset(item.logo) })) } };
}
export function draftToInput(draft: EventDraft, branding: EventInput["branding"], opens: string, closes: string): EventInput {
  const iso = (value: string) => value ? new Date(`${value}:00+07:00`).toISOString() : null;
  return { title: draft.title.trim(), category: draft.category, summary: draft.summary.trim(), matchingFields: draft.matchingFields, startsAt: draft.date && draft.startTime ? iso(`${draft.date}T${draft.startTime}`) : null, endsAt: draft.date && draft.endTime ? iso(`${draft.date}T${draft.endTime}`) : null, timezone: "Asia/Jakarta", venue: draft.venue.trim(), capacity: draft.capacity ? Number(draft.capacity) : null, registrationOpensAt: iso(opens), registrationClosesAt: iso(closes), modules: draft.modules, branding };
}
export function registrationError(opens: string, closes: string, draft: EventDraft): string | null {
  if (!opens && !closes) return null;
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) && Number.isFinite(new Date(`${value}:00+07:00`).getTime()) && localTime(new Date(`${value}:00+07:00`).toISOString()) === value;
  if (!valid(opens) || !valid(closes)) return "Isi awal dan akhir periode registrasi yang valid, atau kosongkan keduanya.";
  if (closes <= opens) return "Penutupan registrasi harus setelah pembukaan.";
  if (draft.date && draft.startTime && closes > `${draft.date}T${draft.startTime}`) return "Registrasi harus ditutup paling lambat saat event dimulai.";
  return null;
}
