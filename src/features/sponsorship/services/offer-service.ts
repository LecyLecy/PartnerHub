import { z } from "zod";
import { ApiError, apiRequest } from "@/lib/api-client";
import type { SponsorDirectoryItem, SponsorOffer, SponsorOfferBoard, SponsorOfferInput } from "@/contracts/sponsor-offer";

const offer = z.object({
  id: z.string().min(1), eventId: z.string().min(1), eventTitle: z.string().max(100), organizationName: z.string().max(100), sponsorId: z.string().min(1), sponsorName: z.string().max(120),
  category: z.string().max(60), message: z.string().max(1000), amountLabel: z.string().max(60).nullable(), proposalUrl: z.string().max(300).nullable(),
  status: z.enum(["SENT", "ACCEPTED", "DECLINED"]), createdAt: z.iso.datetime({ offset: true }),
});

function parse<T>(schema: z.ZodType<T>, data: unknown, message: string): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ApiError(message, 0, "INVALID_RESPONSE");
  return result.data;
}

export async function getOfferBoard(eventId: string, signal: AbortSignal): Promise<SponsorOfferBoard> {
  // TODO(backend): GET /api/events/:id/sponsor-offers -> 200 {eventTitle,eventPublished,items:[SponsorOffer]}. Event owner only; 404 for other organizers.
  return parse(z.object({ eventTitle: z.string().max(100), eventPublished: z.boolean(), items: z.array(offer).max(200) }), await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/sponsor-offers`, { signal }), "Daftar permintaan sponsor tidak dapat dibaca.");
}

export async function createOffer(eventId: string, input: SponsorOfferInput): Promise<SponsorOffer> {
  // TODO(backend): POST /api/events/:id/sponsor-offers JSON SponsorOfferInput -> 201 SponsorOffer (SENT). Event owner only, event must be PUBLISHED, sponsor must be approved. Errors: 404, 409 open offer exists, 422 {fields:{sponsorId,category,message,amountLabel,proposalUrl}}, 429. Creates a notification for the sponsor.
  return parse(offer, await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/sponsor-offers`, { method: "POST", body: input }), "Permintaan belum dapat dikonfirmasi.");
}

export async function listSponsorDirectory(_key: string, signal: AbortSignal): Promise<SponsorDirectoryItem[]> {
  // TODO(backend): GET /api/sponsors/directory -> 200 {items:[{id,companyName,industry}]}. Approved sponsor accounts only, no contact details. Approved organizer accounts only.
  const schema = z.object({ items: z.array(z.object({ id: z.string().min(1), companyName: z.string().max(120), industry: z.string().max(80) })).max(500) });
  return parse(schema, await apiRequest<unknown>("/api/sponsors/directory", { signal }), "Daftar sponsor tidak dapat dibaca.").items;
}

export async function listReceivedOffers(_key: string, signal: AbortSignal): Promise<SponsorOffer[]> {
  // TODO(backend): GET /api/sponsor/offers -> 200 {items:[SponsorOffer]}, newest first. Offers addressed to the signed-in sponsor only.
  return parse(z.object({ items: z.array(offer).max(200) }), await apiRequest<unknown>("/api/sponsor/offers", { signal }), "Daftar permintaan tidak dapat dibaca.").items;
}

export async function respondToOffer(offerId: string, status: "ACCEPTED" | "DECLINED"): Promise<SponsorOffer> {
  // TODO(backend): POST /api/sponsor/offers/:id/response JSON {status} -> 200 SponsorOffer. Only from SENT, else 409. Creates a notification for the organizer.
  return parse(offer, await apiRequest<unknown>(`/api/sponsor/offers/${encodeURIComponent(offerId)}/response`, { method: "POST", body: { status } }), "Tanggapan belum dapat dikonfirmasi.");
}
