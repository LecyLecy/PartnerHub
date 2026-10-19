import type { EventRecord } from "./event";

export type PublicEvent = Pick<EventRecord, "id" | "title" | "category" | "summary" | "startsAt" | "endsAt" | "venue" | "capacity"> & {
  organizationName: string;
  registeredCount: number;
  /** Ticket price in rupiah. 0 means free. PartnerHub does not process the payment. */
  priceIdr: number;
  /** Event cover image. Null until the organizer uploads one. */
  eventLogoUrl: string | null;
  /** Organizer logo shown as the organizer's avatar. Null until uploaded. */
  organizationLogoUrl: string | null;
  /** Organizer-declared public supporters and accepted sponsor commitments. Never pending proposals or private agreement details. */
  sponsorNames: string[];
};

/** PENDING: paid event, waiting for the organizer to review the payment proof. REJECTED frees the person to register again. */
export type RegistrationStatus = "PENDING" | "REGISTERED" | "REJECTED" | "CANCELLED";
export type RegistrationDecision = { decision: "CONFIRM" | "REJECT"; note: string | null };

export type MyRegistration = {
  id: string;
  /** Opaque, display-safe ticket reference. Never contains personal data. */
  ticketReference: string;
  status: RegistrationStatus;
  /** Organizer reason when status is REJECTED. */
  note: string | null;
  createdAt: string;
  /** True once the organizer has issued and sent the QR for this event. The QR secret itself is never part of this list. */
  qrIssued: boolean;
  /** Current event module flag. Issued secrets remain stored but unavailable when QR is disabled. */
  qrEnabled: boolean;
  priceIdr: number;
  event: Pick<PublicEvent, "id" | "title" | "startsAt" | "venue">;
};

export type NotificationItem = { id: string; title: string; body: string; createdAt: string; read: boolean };

export type OrganizerSummary = {
  events: { eventId: string; title: string; status: EventRecord["status"]; registered: number; capacity: number | null; applications: number; sponsors: number }[];
};

export type ProposalStatus = "SENT" | "IN_REVIEW" | "ACCEPTED" | "DECLINED";
export type Proposal = {
  id: string;
  eventId: string;
  eventTitle: string;
  category: string;
  offer: string;
  amountLabel: string | null;
  status: ProposalStatus;
  createdAt: string;
};
export type ProposalInput = { eventId: string; category: string; offer: string; amountLabel: string | null };

export type Sponsorship = {
  id: string;
  eventId: string;
  eventTitle: string;
  packageName: string;
  benefits: { id: string; label: string; status: "PLANNED" | "VERIFIED"; evidenceUrl?: string | null }[];
};

/** Opaque entry code for one registration. `payload` is `PH1.secret` and holds no personal data. */
export type TicketQr = { payload: string };
/** Organizer view of QR delivery for one event. */
export type QrDelivery = { eventTitle: string; eventPublished: boolean; registered: number; issued: number };
export type FormFieldType = "text" | "longtext" | "choice" | "image";
/** One question of an event's registration form, defined by the organizer. */
export type RegistrationField = { id: string; label: string; type: FormFieldType; required: boolean; hint: string | null; options: string[] };
/** `priceIdr` 0 is free. `paymentNote` tells the participant how to pay outside PartnerHub. `isDefault` is true until the organizer saves their own form. */
export type RegistrationForm = { eventTitle: string; priceIdr: number; paymentNote: string | null; fields: RegistrationField[]; isDefault: boolean };
/** `fields[].id` is null for a new question. Send existing ids back so earlier answers keep their meaning. */
export type RegistrationFormInput = { priceIdr: number; paymentNote: string | null; fields: { id: string | null; label: string; type: FormFieldType; required: boolean; hint: string | null; options: string[] }[] };
/** Answers are keyed by field id. An image answer is the URL of an uploaded image. */
export type RegistrationAnswers = Record<string, string>;
/** The question text is copied at registration time, so later form edits never rewrite what someone answered. */
export type RegistrationAnswer = { fieldId: string; label: string; type: FormFieldType; value: string };
/** Read-only registration receipt, owner only. No QR secret or other participant identities. */
export type MyRegistrationDetail = MyRegistration & { answers: RegistrationAnswer[] };
/** Organizer view of one registrant. Only the display name is shared, never the email. */
export type Registrant = { id: string; name: string; ticketReference: string; status: RegistrationStatus; note: string | null; createdAt: string; qrIssued: boolean; checkedInAt: string | null; checkedOutAt?: string | null; answers: RegistrationAnswer[] };
export type RegistrantBoard = { eventTitle: string; priceIdr: number; qrEnabled: boolean; items: Registrant[] };
export type AttendanceBoard = { eventId: string; eventTitle: string; attendanceEnabled: boolean; attendanceMode?: "NONE" | "ENTRY" | "ENTRY_EXIT"; canConfigure: boolean; canScan: boolean; items: Registrant[] };
export type TicketScan = { eventId: string; eventTitle: string; participant: Registrant; attendance: "RECORDED" | "ALREADY_RECORDED" | "DISABLED" | "EXIT_RECORDED" | "ALREADY_EXIT_RECORDED" };
