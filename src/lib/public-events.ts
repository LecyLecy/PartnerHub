import { z } from "zod";
import { ApiError, apiRequest } from "./api-client";
import type { PublicEvent } from "@/contracts/participation";

const date = z.iso.datetime({ offset: true }).nullable();
// Same rule as organizer-side assets. A bad or missing logo only drops that image, never the whole list.
const logo = z.string().refine((url) => /^\/(?!\/)/.test(url) || /^https:\/\//.test(url)).nullish().catch(null).transform((url) => url ?? null);
const eventSchema = z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/), title: z.string().max(100),
    category: z.enum(["Seminar & diskusi", "Workshop", "Kegiatan komunitas"]),
    summary: z.string().max(500), startsAt: date, endsAt: date, venue: z.string().max(150),
    capacity: z.number().int().min(1).nullable(), organizationName: z.string().max(100),
    registeredCount: z.number().int().min(0), priceIdr: z.number().int().min(0).max(10_000_000).default(0),
    eventLogoUrl: logo, organizationLogoUrl: logo, sponsorNames: z.array(z.string().max(100)).max(500).default([]),
});
const schema = z.object({ items: z.array(eventSchema).max(500) });

/** Published event information is readable without an account. Private records never appear here. */
export async function listPublicEvents(_key: string, signal: AbortSignal): Promise<PublicEvent[]> {
  // TODO(backend): Guest-readable GET /api/public/events -> {items:PublicEvent[]}, PUBLISHED only, paginated. Explicit public-field projection; no participant, proposal, evidence, contact or ticket records. Sponsor names are organizer-declared public supporters and accepted agreements, never pending/declined proposals.
  const result = schema.safeParse(await apiRequest<unknown>("/api/public/events", { signal, auth: false }));
  if (!result.success) throw new ApiError("Daftar acara tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data.items;
}

export async function getPublicEvent(id: string, signal: AbortSignal): Promise<PublicEvent> {
  // TODO(backend): Guest-readable GET /api/public/events/:id -> PublicEvent; 404 for missing or non-PUBLISHED events. Same public projection as the list.
  const result = eventSchema.safeParse(await apiRequest<unknown>(`/api/public/events/${encodeURIComponent(id)}`, { signal, auth: false }));
  if (!result.success) throw new ApiError("Detail acara tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data;
}

export function publicEventStatus(event: Pick<PublicEvent, "startsAt" | "endsAt">, now = Date.now()): "ongoing" | "upcoming" | "ended" | "unscheduled" {
  if (!event.startsAt || !event.endsAt) return "unscheduled";
  const start = Date.parse(event.startsAt), end = Date.parse(event.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "unscheduled";
  return end <= now ? "ended" : start <= now ? "ongoing" : "upcoming";
}

export const eventWhen = (iso: string | null) => iso ? `${new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" })} WIB` : "Jadwal belum ditentukan";
