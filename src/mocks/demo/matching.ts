import { canManageEvent } from "./billing";
import { ApiError } from "@/lib/api-client";
import { sharedMatchingFields } from "@/lib/matching";
import { matchingFields, type SponsorMatchingProfile } from "@/contracts/matching";
import type { DemoAccount } from "./types";
import type { DemoDb } from "./seed";

function sponsorProfile(db: DemoDb, account: DemoAccount): SponsorMatchingProfile | null {
  const saved = db.sponsorMatchingProfiles?.[account.id];
  if (saved) return saved;
  const industry = matchingFields.find(field => field === account.summary.find(row => row.label === "Industri")?.value);
  return industry ? { industry, fields: [industry] } : null;
}

export function sponsorDirectory(db: DemoDb) {
  return db.accounts.filter(item => item.role === "sponsor" && item.status === "active" && item.emailVerified).map(sponsor => {
    const profile = sponsorProfile(db, sponsor);
    return { id: sponsor.id, companyName: sponsor.summary.find(row => row.label === "Perusahaan")?.value || sponsor.fullName, industry: profile?.industry || sponsor.summary.find(row => row.label === "Industri")?.value || "Belum dicantumkan", imageUrl: sponsor.imageUrl ?? null, fields: profile?.fields ?? [], sharedFields: [] as SponsorMatchingProfile["fields"] };
  }).sort((a, b) => a.companyName.localeCompare(b.companyName, "id-ID") || a.id.localeCompare(b.id));
}

export function dispatchMatching(db: DemoDb, method: string, route: string) {
  const account = db.accounts.find(item => item.id === db.sessionAccountId);
  if (!account) throw new ApiError("Masuk untuk melanjutkan.", 401, "UNAUTHENTICATED");
  if (account.status !== "active" || !account.emailVerified) throw new ApiError("Akun belum disetujui.", 403, "FORBIDDEN");
  const eventMatch = route.match(/^\/api\/events\/([^/]+)\/sponsor-matches$/);
  if (eventMatch) {
    if (account.role !== "organizer") throw new ApiError("Akses hanya untuk penyelenggara.", 403, "FORBIDDEN");
    const event = db.events.find(item => item.id === eventMatch[1] && canManageEvent(db, item, account.id));
    if (!event) throw new ApiError("Acara tidak ditemukan.", 404, "NOT_FOUND");
    if (method !== "GET") throw new ApiError("Tindakan tidak tersedia.", 405, "METHOD_NOT_ALLOWED");
    const fields = db.eventMatchingFields?.[event.id] ?? [];
    const items = sponsorDirectory(db).map(sponsor => ({ ...sponsor, sharedFields: sharedMatchingFields(fields, [sponsor.industry, ...sponsor.fields]) })).sort((a, b) => b.sharedFields.length - a.sharedFields.length || a.companyName.localeCompare(b.companyName, "id-ID"));
    return { eventTitle: event.title, eventPublished: event.status === "PUBLISHED", fields, items };
  }
  if (account.role !== "sponsor") throw new ApiError("Akses hanya untuk sponsor.", 403, "FORBIDDEN");
  if (route === "/api/sponsor/matching-profile") {
    if (method !== "GET") throw new ApiError("Bidang perusahaan ditetapkan saat registrasi dan tidak dapat diubah.", 405, "METHOD_NOT_ALLOWED");
    return { profile: sponsorProfile(db, account), industry: account.summary.find(row => row.label === "Industri")?.value || "" };
  }
  if (method !== "GET") throw new ApiError("Tindakan tidak tersedia.", 405, "METHOD_NOT_ALLOWED");
  const profile = sponsorProfile(db, account);
  const items = profile ? db.events.filter(event => event.status === "PUBLISHED" && event.startsAt && event.endsAt && Date.parse(event.endsAt) > Date.now() && Date.parse(event.endsAt) > Date.parse(event.startsAt)).map(event => ({ eventId: event.id, sharedFields: sharedMatchingFields(db.eventMatchingFields?.[event.id] ?? [], [profile.industry, ...profile.fields]) })).filter(item => item.sharedFields.length).sort((a, b) => b.sharedFields.length - a.sharedFields.length || a.eventId.localeCompare(b.eventId)) : [];
  return { complete: Boolean(profile), items };
}
