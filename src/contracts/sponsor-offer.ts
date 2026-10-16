export type OfferStatus = "SENT" | "ACCEPTED" | "DECLINED";

/** A sponsorship request an organizer sends to a verified sponsor company for one event. */
export type SponsorOffer = {
  id: string;
  eventId: string;
  eventTitle: string;
  organizationName: string;
  sponsorId: string;
  sponsorName: string;
  category: string;
  message: string;
  amountLabel: string | null;
  /** Optional link to a proposal document. Files are not uploaded in the first version. */
  proposalUrl: string | null;
  status: OfferStatus;
  createdAt: string;
  nextFollowUpAt?: string | null;
  followUpNote?: string | null;
};
export type SponsorOfferInput = { sponsorId: string; category: string; message: string; amountLabel: string | null; proposalUrl: string | null };

export type SponsorOfferBoard = { eventTitle: string; eventPublished: boolean; items: SponsorOffer[] };

/** Minimal directory entry. Only approved sponsor accounts are listed. */
export type SponsorDirectoryItem = { id: string; companyName: string; industry: string };
