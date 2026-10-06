/**
 * Application lifecycle. `SUBMITTED` is the first step, `IN_SELECTION` means the application sits in one of the
 * organizer's own stages (see `SelectionStage`), and the last three are final.
 */
export type ApplicationStatus = "SUBMITTED" | "IN_SELECTION" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

/** One organizer-defined step between "Lamaran masuk" and the final decision, for example "Wawancara". */
export type SelectionStage = { id: string; name: string };

/** Where an organizer may move an application. `to` is a stage id, `ACCEPTED`, or `REJECTED`. */
export type DecisionTarget = { to: string; label: string };

export type Division = { id: string; name: string };

export type CommitteeOpening = {
  id: string;
  eventId: string;
  eventTitle: string;
  organizationName: string;
  /** Event cover image and organizer logo, null until the organizer uploads them. */
  eventLogoUrl: string | null;
  organizationLogoUrl: string | null;
  description: string;
  divisions: Division[];
  /** One optional event-specific question asked of every applicant. */
  question: string | null;
  /** Ordered selection stages between "Lamaran masuk" and "Diterima". 0 to 5 entries. */
  stages: SelectionStage[];
  status: "OPEN" | "CLOSED";
};
/** `stages[].id` is null for a new stage. Existing ids must be sent back so applicants keep their place. */
export type CommitteeOpeningInput = { description: string; divisions: string[]; question: string | null; stages: { id: string | null; name: string }[]; open: boolean };

export type CommitteeApplication = {
  id: string;
  openingId: string;
  eventId: string;
  eventTitle: string;
  organizationName: string;
  eventLogoUrl: string | null;
  organizationLogoUrl: string | null;
  /** Division names in the applicant's order of preference. */
  divisions: string[];
  motivation: string;
  question: string | null;
  answer: string | null;
  status: ApplicationStatus;
  /** Stage the application is in (`IN_SELECTION`), or was in when it was rejected or withdrawn. Null while still at "Lamaran masuk" and once accepted. */
  stageId: string | null;
  /** The opening's stages, so the applicant can see the whole path. */
  stages: SelectionStage[];
  /** Organizer note shown to the applicant: next steps when accepted, otherwise feedback. */
  note: string | null;
  createdAt: string;
};
export type ApplicationInput = { divisionIds: string[]; motivation: string; answer: string | null };

/** Organizer view. The applicant's name is the only personal field shared. `allowed` lists the moves the service accepts now. */
export type ApplicantView = CommitteeApplication & { applicantName: string; allowed: DecisionTarget[] };
export type CommitteeWorkspace = { eventTitle: string; eventPublished: boolean; opening: CommitteeOpening | null; applications: ApplicantView[] };
export type DecisionInput = { to: string; note: string | null };
