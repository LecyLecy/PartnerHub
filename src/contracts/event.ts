import type { MatchingField } from "./matching";

export type EventModules = { registration: boolean; committee: boolean; attendance: boolean; sponsorship: boolean };
export type Asset = { id: string; url: string; name: string };
export type EventBrandingInput = {
  organizationName: string;
  eventLogo: Asset | null;
  organizationLogo: Asset | null;
  sponsors: { id: string; name: string; logo: Asset | null }[];
};
export type EventInput = {
  title: string;
  category: "Seminar & diskusi" | "Workshop" | "Kegiatan komunitas";
  /** Chosen at creation and immutable afterwards. Optional only for older records/clients. */
  matchingFields?: MatchingField[];
  summary: string;
  startsAt: string | null;
  endsAt: string | null;
  timezone: "Asia/Jakarta";
  venue: string;
  capacity: number | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  modules: EventModules;
  branding: EventBrandingInput;
};
export type EventRecord = EventInput & {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  revision: string;
  updatedAt: string;
};
export type EventList = { items: EventRecord[] };
export type AssetSlot = "event" | "organization" | "sponsor";
