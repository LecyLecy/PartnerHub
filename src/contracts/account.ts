export type Role = "user" | "organizer" | "sponsor";
export type AccountStatus = "active" | "pending_verification" | "rejected";

export type Session = {
  account: { id: string; email: string; displayName: string | null; role: Role; status: AccountStatus };
  emailVerified: boolean;
  onboardingComplete: boolean;
  expiresAt: string;
};
export type Credentials = { email: string; password: string };
export type ProfileInput = { displayName: string | null };
export type MessageResult = { message: string };
export type SessionApi = {
  getSession: (signal?: AbortSignal) => Promise<Session | null>;
  logout: () => Promise<void>;
};

/** verificationRequired is true whenever the account must confirm its email before using the workspace. */
export type RegistrationResult = { session: Session | null; verificationRequired: boolean };

type CommonRegistration = {
  fullName: string;
  email: string;
  /** Normalized Indonesian mobile number in +62 format. */
  phone: string;
  password: string;
  acceptTerms: true;
};

export type UserRegistration = CommonRegistration & {
  institution: string | null;
  city: string | null;
  interests: string[];
};

export type OrganizerType = "individual" | "organization" | "community" | "institution";
export type OrganizerRegistration = CommonRegistration & {
  organizerType: OrganizerType;
  /** Required unless organizerType is "individual". */
  organizationName: string | null;
  description: string;
  city: string;
  address: string;
  /** Contact person's position in the organizer. */
  position: string;
  website: string | null;
  social: string | null;
  experience: string | null;
};

export type SponsorRegistration = CommonRegistration & {
  /** fullName/email/phone describe the person in charge (PIC). */
  position: string;
  companyName: string;
  industry: string;
  scale: "startup" | "umkm" | "corporate" | null;
  /** 13 digit NIB. */
  legalNumber: string;
  /** 15 or 16 digit NPWP, digits only. */
  npwp: string | null;
  address: string;
  city: string;
  website: string;
  social: string | null;
  categories: string[];
  budget: string | null;
};

export type RegistrationFiles = { logo: File | null; document: File | null };

export type VerificationInfo = {
  status: AccountStatus;
  submittedAt: string;
  summary: { label: string; value: string }[];
  documents: { label: string; name: string }[];
  /** Reason shown to the applicant when status is "rejected". */
  reviewNote: string | null;
};
