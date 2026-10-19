import type { AccountStatus, Role } from "@/contracts/account";
import type { EventRecord } from "@/contracts/event";
import type { NotificationItem, Proposal, RegistrationAnswer, RegistrationField, RegistrationStatus, Sponsorship } from "@/contracts/participation";
import type { CommitteeApplication, CommitteeOpening } from "@/contracts/committee";
import type { SponsorOffer } from "@/contracts/sponsor-offer";
import type { MatchingField, SponsorMatchingProfile } from "@/contracts/matching";
import type { PackageOrder, EventCoverage, PackageTier, SubscriptionOrder, AccountSubscription } from "@/contracts/billing";

/** Inactive compatibility archive. Never used to grant coverage for new events. */
type Organization = { id: string; name: string; ownerId: string; memberIds: string[] };
type AnnualSubscription = { id: string; organizationId: string; tier: PackageTier; startsAt: string; endsAt: string; orderId: string; simulated: true };
type LegacyOrder = Omit<PackageOrder, "ownerId" | "eventId" | "cycle"> & { organizationId: string; eventId: string | null; cycle: "SINGLE" | "ANNUAL" };
type LegacyCoverage = Omit<EventCoverage, "source"> & { organizationId: string; source: "SINGLE" | "ANNUAL" | "LEGACY"; subscriptionId: string | null };

export type DemoBilling = {
  organizations: Organization[];
  selected: Record<string, string>;
  eventOrganizations: Record<string, string>;
  subscriptions: AnnualSubscription[];
  orders: LegacyOrder[];
  coverage: Record<string, LegacyCoverage>;
  managers: Record<string, string[]>;
};

export type DemoAccount = {
  id: string;
  imageUrl?: string | null;
  email: string;
  fullName: string;
  role: Role;
  status: AccountStatus;
  emailVerified: boolean;
  onboardingComplete: boolean;
  /** True for the seeded accounts. Accounts created through Register are false and start empty. */
  seeded: boolean;
  description: string;
  submittedAt: string;
  summary: { label: string; value: string }[];
  documents: { label: string; name: string }[];
};
export type OwnedEvent = EventRecord & { ownerId: string };
/** `qrSecret` is set when the organizer sends the QR. Demo only: a real backend stores just a hash of it. */
export type OwnedRegistration = { id: string; ownerId: string; eventId: string; ticketReference: string; status: RegistrationStatus; note?: string | null; createdAt: string; consentAt?: string | null; qrSecret: string | null; checkedInAt?: string | null; checkedOutAt?: string | null; answers: RegistrationAnswer[]; registrantName: string | null };
/** Registration form an organizer saved for one event. Events without an entry use the default form and are free. */
export type StoredForm = { priceIdr: number; paymentNote: string | null; fields: RegistrationField[] };
export type OwnedNotification = NotificationItem & { ownerId: string };
export type OwnedProposal = Proposal & { ownerId: string };
export type OwnedSponsorship = Sponsorship & { ownerId: string };
/** ownerId is the organizer who owns the event. */
export type OwnedOpening = Omit<CommitteeOpening, "eventLogoUrl" | "organizationLogoUrl"> & { ownerId: string };
/** ownerId is the applicant. */
export type OwnedApplication = Omit<CommitteeApplication, "stages" | "organizationName" | "eventLogoUrl" | "organizationLogoUrl"> & { ownerId: string; applicantName: string };
/** ownerId is the organizer who sent the request. */
export type OwnedOffer = SponsorOffer & { ownerId: string };

export type DemoDb = {
  accountBilling?: { orders: SubscriptionOrder[]; subscriptions: AccountSubscription[] };
  eventBilling?: { version: 1; orders: PackageOrder[]; coverage: Record<string, EventCoverage>; managers: Record<string, string[]> };
  billing?: DemoBilling;
  version: 3;
  fixtureRevision?: number;
  eventMatchingFields?: Record<string, MatchingField[]>;
  sponsorMatchingProfiles?: Record<string, SponsorMatchingProfile>;
  attendanceModes?: Record<string, "NONE" | "ENTRY" | "ENTRY_EXIT">;
  passwordHashes?: Record<string, string>;
  forms: Record<string, StoredForm>;
  accounts: DemoAccount[];
  sessionAccountId: string | null;
  events: OwnedEvent[];
  baseRegistered: Record<string, number>;
  registrations: OwnedRegistration[];
  notifications: OwnedNotification[];
  proposals: OwnedProposal[];
  sponsorships: OwnedSponsorship[];
  openings: OwnedOpening[];
  applications: OwnedApplication[];
  offers: OwnedOffer[];
  idempotency: Record<string, string>;
  counter: number;
};
