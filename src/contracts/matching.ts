/** Shared vocabulary for the local matching demonstration, not an AI confidence model. */
export const matchingFields = ["Teknologi", "Pendidikan", "Makanan & minuman", "Keuangan & perbankan", "Kesehatan", "Media & hiburan", "Seni & desain", "Lingkungan & sosial", "Olahraga", "Ritel & FMCG", "Transportasi & logistik", "Energi & manufaktur", "Lainnya"] as const;
export type MatchingField = typeof matchingFields[number];
export type SponsorMatchingProfile = { industry: MatchingField; fields: MatchingField[] };
export type SponsorMatch = { id: string; companyName: string; industry: string; imageUrl: string | null; fields: MatchingField[]; sharedFields: MatchingField[] };
export type SponsorMatchBoard = { eventTitle: string; eventPublished: boolean; fields: MatchingField[]; items: SponsorMatch[] };
export type EventMatchBoard = { complete: boolean; items: { eventId: string; sharedFields: MatchingField[] }[] };
