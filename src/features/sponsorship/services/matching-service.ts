import { z } from "zod";
import { ApiError, apiRequest } from "@/lib/api-client";
import { matchingFields, type SponsorMatchBoard, type EventMatchBoard } from "@/contracts/matching";

const field = z.enum(matchingFields);
const fields = z.array(field).max(5);
const imageUrl = z.string().regex(/^\/demo\/photos\/[a-z-]+\.jpg$/).nullable();
const profileSchema = z.object({ industry: field, fields });
const sponsorSchema = z.object({ id: z.string().min(1), companyName: z.string(), industry: z.string(), imageUrl, fields, sharedFields: fields });
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ApiError("Data rekomendasi tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return parsed.data;
}
// TODO(backend): These owner/role-scoped endpoints are implemented only in the local demo router.
export async function getSponsorMatches(id: string, signal: AbortSignal): Promise<SponsorMatchBoard> {
  return parse(z.object({ eventTitle: z.string(), eventPublished: z.boolean(), fields, items: z.array(sponsorSchema) }), await apiRequest(`/api/events/${encodeURIComponent(id)}/sponsor-matches`, { signal }));
}
export async function getSponsorDirectory(_key: string, signal: AbortSignal) {
  return parse(z.object({ items: z.array(sponsorSchema) }), await apiRequest("/api/sponsors/directory", { signal })).items;
}
export async function getMatchingProfile(_key: string, signal: AbortSignal) {
  return parse(z.object({ profile: profileSchema.nullable(), industry: z.string() }), await apiRequest("/api/sponsor/matching-profile", { signal }));
}
export async function getEventMatches(_key: string, signal: AbortSignal): Promise<EventMatchBoard> {
  return parse(z.object({ complete: z.boolean(), items: z.array(z.object({ eventId: z.string(), sharedFields: fields })) }), await apiRequest("/api/sponsor/event-matches", { signal }));
}
