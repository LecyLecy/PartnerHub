import { z } from "zod";
import { ApiError, apiRequest } from "./api-client";
import type { PublicEvent } from "@/contracts/participation";

const date = z.iso.datetime({ offset: true }).nullable();
// Same rule as organizer-side assets. A bad or missing logo only drops that image, never the whole list.
const logo = z.string().refine((url) => /^\/(?!\/)/.test(url) || /^https:\/\//.test(url)).nullish().catch(null).transform((url) => url ?? null);
const schema = z.object({
  items: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/), title: z.string().max(100),
    category: z.enum(["Seminar & diskusi", "Workshop", "Kegiatan komunitas"]),
    summary: z.string().max(500), startsAt: date, endsAt: date, venue: z.string().max(150),
    capacity: z.number().int().min(1).nullable(), organizationName: z.string().max(100),
    registeredCount: z.number().int().min(0), priceIdr: z.number().int().min(0).max(10_000_000).default(0),
    eventLogoUrl: logo, organizationLogoUrl: logo, sponsorNames: z.array(z.string().max(100)).max(6).default([]),
  })).max(500),
});

/** Published events are public to every approved account. Private data (registrants, proposals) never appears here. */
export async function listPublicEvents(_key: string, signal: AbortSignal): Promise<PublicEvent[]> {
  // TODO(backend): GET /api/public/events -> 200 {items:[{id,title,category,summary,startsAt,endsAt,venue,capacity,organizationName,registeredCount,priceIdr,eventLogoUrl,organizationLogoUrl,sponsorNames}]} (logo URLs nullable, https or same-origin only), PUBLISHED events only, paginated. 401 signed out, 403 when the account is not approved.
  const result = schema.safeParse(await apiRequest<unknown>("/api/public/events", { signal }));
  if (!result.success) throw new ApiError("Daftar acara tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data.items;
}

export const eventWhen = (iso: string | null) => iso ? `${new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" })} WIB` : "Jadwal belum ditentukan";
