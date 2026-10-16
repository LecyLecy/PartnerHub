import { z } from "zod";
import { ApiError, apiRequest } from "@/lib/api-client";
import type {
  Credentials, MessageResult, OrganizerRegistration, ProfileInput, RegistrationFiles, RegistrationResult,
  Session, SessionApi, SponsorRegistration, UserRegistration, VerificationInfo,
} from "@/contracts/account";

const accountSchema = z.object({
  id: z.string().min(1), email: z.email(), displayName: z.string().nullable(),
  role: z.enum(["user", "organizer", "sponsor"]),
  status: z.enum(["active", "pending_verification", "rejected"]),
});
const sessionSchema = z.object({ account: accountSchema, emailVerified: z.boolean(), onboardingComplete: z.boolean(), expiresAt: z.iso.datetime({ offset: true }) });

function sessionValue(value: unknown): Session {
  const parsed = sessionSchema.safeParse(value);
  if (!parsed.success || new Date(parsed.data.expiresAt).getTime() <= Date.now()) throw new ApiError("Respons sesi tidak valid. Masuk kembali atau coba lagi.", 0, "INVALID_RESPONSE");
  return parsed.data;
}
function messageValue(value: unknown): MessageResult {
  const result = z.object({ message: z.string().min(1).max(500) }).safeParse(value);
  if (!result.success) throw new ApiError("Respons layanan tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data;
}
function registrationValue(value: unknown): RegistrationResult {
  const result = z.object({ session: sessionSchema.nullable(), verificationRequired: z.boolean() }).safeParse(value);
  if (!result.success || (!result.data.verificationRequired && !result.data.session)) throw new ApiError("Respons pendaftaran tidak valid.", 0, "INVALID_RESPONSE");
  return { ...result.data, session: result.data.session ? sessionValue(result.data.session) : null };
}

export async function getSession(signal?: AbortSignal): Promise<Session | null> {
  // TODO(backend): GET /api/auth/session, no body. 200 Session {account:{id,email,displayName,role,status},emailVerified,onboardingComplete,expiresAt}; 401 when no valid HttpOnly cookie session.
  try { return sessionValue(await apiRequest<unknown>("/api/auth/session", { auth: false, signal })); }
  catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
}
export async function login(input: Credentials): Promise<Session> {
  // TODO(backend): POST /api/auth/login, JSON {email,password} -> 200 Session with secure HttpOnly cookie. Errors: 401 invalid credentials, 429 rate limited. Pending or rejected accounts still receive a Session with their status.
  return sessionValue(await apiRequest<unknown>("/api/auth/login", { method: "POST", body: input, auth: false }));
}

/** Sends JSON fields plus optional files as multipart so the server can inspect, re-encode, and store them privately. */
function multipart(role: "user" | "organizer" | "sponsor", fields: object, files: Partial<RegistrationFiles>): FormData {
  const body = new FormData();
  body.set("role", role);
  body.set("payload", new Blob([JSON.stringify(fields)], { type: "application/json" }));
  if (files.logo) body.set("logo", files.logo, files.logo.name);
  if (files.document) body.set("document", files.document, files.document.name);
  return body;
}

const registerErrors = (error: unknown): never => {
  if (error instanceof ApiError && error.status === 409 && error.code === "EMAIL_TAKEN") throw new ApiError("Email ini sudah terdaftar. Masuk, atau gunakan email lain.", 409, "EMAIL_TAKEN", { email: "Email ini sudah terdaftar. Masuk, atau gunakan email lain." });
  throw error;
};

export async function registerUser(input: UserRegistration): Promise<RegistrationResult> {
  // TODO(backend): POST /api/auth/register/user, multipart/form-data {role:"user", payload: JSON UserRegistration}. 201 {session:Session|null, verificationRequired:boolean}; account status "active" after email verification. Errors: 409 code EMAIL_TAKEN, 422 {error:{code,fields}}, 429. Password is hashed server-side; never logged.
  try { return registrationValue(await apiRequest<unknown>("/api/auth/register/user", { method: "POST", body: multipart("user", input, {}), auth: false })); }
  catch (error) { return registerErrors(error); }
}
export async function registerOrganizer(input: OrganizerRegistration, files: RegistrationFiles): Promise<RegistrationResult> {
  // TODO(backend): POST /api/auth/register/organizer, multipart/form-data {role:"organizer", payload: JSON OrganizerRegistration, logo?: PNG|JPEG|WebP <=2MB, document: PDF|PNG|JPEG <=5MB (identity for individual, legality otherwise)}. 201 {session, verificationRequired}; account status "pending_verification" until an admin approves. Errors: 409 EMAIL_TAKEN, 413, 415, 422 {fields}, 429. Documents are private, encrypted, admin-only.
  try { return registrationValue(await apiRequest<unknown>("/api/auth/register/organizer", { method: "POST", body: multipart("organizer", input, files), auth: false })); }
  catch (error) { return registerErrors(error); }
}
export async function registerSponsor(input: SponsorRegistration, files: RegistrationFiles): Promise<RegistrationResult> {
  // TODO(backend): POST /api/auth/register/sponsor, multipart/form-data {role:"sponsor", payload: JSON SponsorRegistration, logo: PNG|JPEG|WebP <=2MB, document: PDF|PNG|JPEG <=5MB}. 201 {session, verificationRequired}; status "pending_verification" until admin approval. Server must re-check work-email domain, NIB/NPWP format, and file content. Errors: 409 EMAIL_TAKEN, 413, 415, 422 {fields}, 429.
  try { return registrationValue(await apiRequest<unknown>("/api/auth/register/sponsor", { method: "POST", body: multipart("sponsor", input, files), auth: false })); }
  catch (error) { return registerErrors(error); }
}

const verificationSchema = z.object({
  status: z.enum(["active", "pending_verification", "rejected"]), submittedAt: z.iso.datetime({ offset: true }),
  summary: z.array(z.object({ label: z.string().max(80), value: z.string().max(300) })).max(20),
  documents: z.array(z.object({ label: z.string().max(120), name: z.string().max(255) })).max(10),
  reviewNote: z.string().max(500).nullable(),
});
export async function getVerificationInfo(signal?: AbortSignal): Promise<VerificationInfo> {
  // TODO(backend): GET /api/accounts/me/verification -> 200 {status, submittedAt, summary:[{label,value}], documents:[{label,name}], reviewNote}. Current account only; never return document contents. 401 when signed out.
  const result = verificationSchema.safeParse(await apiRequest<unknown>("/api/accounts/me/verification", { signal }));
  if (!result.success) throw new ApiError("Status verifikasi tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data;
}

export async function logout(): Promise<void> {
  // TODO(backend): POST /api/auth/logout, {} -> 204; revoke session and clear cookie, idempotent.
  try { await apiRequest<void>("/api/auth/logout", { method: "POST", body: {}, auth: false }); }
  catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
}
export async function forgotPassword(email: string): Promise<MessageResult> {
  // TODO(backend): POST /api/auth/password/forgot, {email} -> {message}; same neutral response for existing/non-existing accounts.
  return messageValue(await apiRequest<unknown>("/api/auth/password/forgot", { method: "POST", body: { email }, auth: false }));
}
export async function resetPassword(token: string, password: string): Promise<MessageResult> {
  // TODO(backend): POST /api/auth/password/reset, {token,password} -> {message}; single-use expiring token, revoke old sessions.
  return messageValue(await apiRequest<unknown>("/api/auth/password/reset", { method: "POST", body: { token, password }, auth: false }));
}
export async function resendVerification(email: string): Promise<MessageResult> {
  // TODO(backend): POST /api/auth/verification/resend, {email} -> {message}; neutral response with resend throttling.
  return messageValue(await apiRequest<unknown>("/api/auth/verification/resend", { method: "POST", body: { email }, auth: false }));
}
export async function verifyEmail(token: string): Promise<Session> {
  // TODO(backend): POST /api/auth/verification/confirm, {token} -> Session with emailVerified true; single-use token, sets secure cookie. Organizer and sponsor sessions keep status "pending_verification".
  const session = sessionValue(await apiRequest<unknown>("/api/auth/verification/confirm", { method: "POST", body: { token }, auth: false }));
  if (!session.emailVerified) throw new ApiError("Verifikasi belum dikonfirmasi oleh layanan.", 0, "INVALID_RESPONSE");
  return session;
}
export async function completeOnboarding(): Promise<Session> {
  // TODO(backend): POST /api/accounts/onboarding, {completed:true} -> Session, authenticated verified account only.
  const session = sessionValue(await apiRequest<unknown>("/api/accounts/onboarding", { method: "POST", body: { completed: true } }));
  if (!session.onboardingComplete) throw new ApiError("Pengenalan belum tersimpan. Coba lagi.", 0, "INVALID_RESPONSE");
  return session;
}
export async function updateProfile(input: ProfileInput): Promise<Session> {
  // TODO(backend): PATCH /api/profile, {displayName:string|null} -> Session; authorize current account, never body-supplied account IDs.
  return sessionValue(await apiRequest<unknown>("/api/profile", { method: "PATCH", body: input }));
}
export const sessionApi: SessionApi = { getSession, logout };
