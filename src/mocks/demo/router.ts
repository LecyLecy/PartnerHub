import { ApiError, messageFor, type RequestOptions } from "@/lib/api-client";
import type { Session } from "@/contracts/account";
import type { EventInput, EventRecord } from "@/contracts/event";
import type { MyRegistration, OrganizerSummary, Proposal, PublicEvent, QrDelivery, Registrant, RegistrantBoard, RegistrationAnswer, RegistrationField, RegistrationForm, TicketQr } from "@/contracts/participation";
import { saveDb, loadDb, resetDb, sessionPasswords } from "./store";
import type { ApplicantView, CommitteeApplication, CommitteeOpening, DecisionTarget, SelectionStage } from "@/contracts/committee";
import { DEMO_PASSWORD, type DemoAccount, type DemoDb, type OwnedApplication, type OwnedEvent, type OwnedOffer, type OwnedOpening } from "./seed";
import { publicationErrors } from "@/features/event/lifecycle";
import { dispatchReporting, ensureAgreement } from "./reporting";

/**
 * In-browser stand-in for the backend, used only when NEXT_PUBLIC_PARTNERHUB_DEMO=1 at build time.
 * Ownership is enforced here, in the service boundary, not only by hiding menus. This simulates backend
 * behavior for demos; it is not security, because anyone can read browser storage.
 */

const fail = (status: number, code = "REQUEST_FAILED", fields: Record<string, string> = {}): never => {
  throw new ApiError(messageFor(status, true), status, code, fields);
};
const sleep = () => new Promise((resolve) => setTimeout(resolve, 120));
const nowIso = () => new Date().toISOString();
const next = (db: DemoDb, prefix: string) => `${prefix}-${++db.counter}`;
async function demoPasswordHash(id: string, password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${id}:${password}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sessionOf(account: DemoAccount, db: DemoDb): Session {
  const displayName = (db as DemoDb & { names?: Record<string, string | null> }).names?.[account.id];
  return {
    account: { id: account.id, email: account.email, displayName: displayName === undefined ? account.fullName : displayName, role: account.role, status: account.status },
    emailVerified: account.emailVerified,
    onboardingComplete: account.onboardingComplete,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  };
}

function current(db: DemoDb): DemoAccount {
  const account = db.accounts.find((item) => item.id === db.sessionAccountId);
  return account ?? fail(401, "UNAUTHENTICATED");
}
/** Role and approval check. Organizer and sponsor accounts under review are refused here, not only in the UI. */
function active(db: DemoDb, role: DemoAccount["role"]): DemoAccount {
  const account = current(db);
  if (!account.emailVerified || account.status !== "active" || account.role !== role) return fail(403, "FORBIDDEN");
  return account;
}

function registeredCount(db: DemoDb, eventId: string) {
  return (db.baseRegistered[eventId] ?? 0) + db.registrations.filter((item) => item.eventId === eventId && item.status === "REGISTERED").length;
}
const publicEvent = (db: DemoDb, item: OwnedEvent): PublicEvent => ({ id: item.id, title: item.title, category: item.category, summary: item.summary, startsAt: item.startsAt, endsAt: item.endsAt, venue: item.venue, capacity: item.capacity, organizationName: item.branding.organizationName, registeredCount: registeredCount(db, item.id), priceIdr: db.forms[item.id]?.priceIdr ?? 0, eventLogoUrl: item.branding.eventLogo?.url ?? null, organizationLogoUrl: item.branding.organizationLogo?.url ?? null, sponsorNames: item.branding.sponsors.map((sponsor) => sponsor.name) });
const strip = ({ ownerId, ...record }: OwnedEvent): EventRecord => { void ownerId; return record; };

function ticketReference(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = [...bytes].map((byte) => alphabet[byte % alphabet.length]);
  return `PH-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

const toDataUrl = (file: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

async function register(db: DemoDb, role: "user" | "organizer" | "sponsor", body: FormData): Promise<unknown> {
  const raw = body.get("payload");
  const payload = raw instanceof Blob ? JSON.parse(await raw.text()) as Record<string, unknown> : fail(422, "VALIDATION_ERROR");
  const email = String(payload.email ?? "").trim().toLowerCase();
  if (db.accounts.some((item) => item.email === email)) return fail(409, "EMAIL_TAKEN");
  const str = (key: string) => String(payload[key] ?? "");
  const document = body.get("document");
  const review = role !== "user";
  const summary = role === "organizer"
    ? [{ label: "Jenis", value: str("organizerType") }, { label: "Organisasi", value: str("organizationName") || "-" }, { label: "Kota", value: str("city") }]
    : role === "sponsor" ? [{ label: "Perusahaan", value: str("companyName") }, { label: "Industri", value: str("industry") }, { label: "Kota", value: str("city") }] : [];
  const account: DemoAccount = {
    id: next(db, "account"), email, fullName: str("fullName"), role,
    status: review ? "pending_verification" : "active",
    emailVerified: false, onboardingComplete: true, seeded: false,
    description: "Akun baru dari formulir Register. Mulai dari kondisi kosong.",
    submittedAt: nowIso(), summary,
    documents: document instanceof File ? [{ label: "Dokumen verifikasi", name: document.name }] : [],
  };
  db.accounts.push(account);
  db.sessionAccountId = account.id;
  sessionPasswords.set(account.id, str("password"));
  (db.passwordHashes ??= {})[account.id] = await demoPasswordHash(account.id, str("password"));
  return { session: sessionOf(account, db), verificationRequired: true };
}

export async function demoRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  await sleep();
  const method = (options.method ?? "GET").toUpperCase();
  const url = new URL(path, "http://demo.invalid");
  const route = url.pathname;
  const db = loadDb();
  const result = await dispatch(db, method, route, options);
  saveDb();
  return result as T;
}

async function dispatch(db: DemoDb, method: string, route: string, options: RequestOptions): Promise<unknown> {
  const json = (options.body ?? {}) as Record<string, unknown>;
  const form = options.body instanceof FormData ? options.body : null;

  if (route === "/api/auth/session") {
    const account = db.accounts.find((item) => item.id === db.sessionAccountId);
    return account ? sessionOf(account, db) : fail(401, "UNAUTHENTICATED");
  }
  if (route === "/api/auth/login" && method === "POST") {
    const email = String(json.email ?? "").trim().toLowerCase();
    const account = db.accounts.find((item) => item.email === email);
    const expected = account?.seeded ? DEMO_PASSWORD : account ? sessionPasswords.get(account.id) : undefined;
    const hashMatches = account && !account.seeded && typeof json.password === "string" && db.passwordHashes?.[account.id] === await demoPasswordHash(account.id, json.password);
    if (!account || (!hashMatches && (!expected || expected !== json.password))) throw new ApiError(messageFor(401, false), 401, "INVALID_CREDENTIALS");
    db.sessionAccountId = account.id;
    return sessionOf(account, db);
  }
  if (route === "/api/auth/logout" && method === "POST") { db.sessionAccountId = null; return undefined; }
  if (route === "/api/demo/switch" && method === "POST") {
    const account = db.accounts.find((item) => item.seeded && item.status === "active" && item.role === json.role);
    if (!account) return fail(422, "INVALID_ROLE");
    db.sessionAccountId = account.id;
    return sessionOf(account, db);
  }
  if (route === "/api/demo/approve" && method === "POST") {
    const account = current(db);
    account.emailVerified = true;
    account.status = "active";
    return sessionOf(account, db);
  }
  const registerMatch = route.match(/^\/api\/auth\/register\/(user|organizer|sponsor)$/);
  if (registerMatch && method === "POST" && form) return register(db, registerMatch[1] as "user" | "organizer" | "sponsor", form);
  if (route === "/api/auth/password/forgot" || route === "/api/auth/password/reset" || route === "/api/auth/verification/resend") return { message: "Mode demo: tidak ada email yang dikirim." };
  if (route === "/api/auth/verification/confirm" && method === "POST") {
    const account = current(db);
    account.emailVerified = true;
    return sessionOf(account, db);
  }
  if (route === "/api/accounts/onboarding" && method === "POST") {
    const account = current(db);
    account.onboardingComplete = true;
    return sessionOf(account, db);
  }
  if (route === "/api/profile" && method === "PATCH") {
    const account = current(db);
    const names = ((db as DemoDb & { names?: Record<string, string | null> }).names ??= {});
    names[account.id] = typeof json.displayName === "string" ? json.displayName : null;
    return sessionOf(account, db);
  }
  if (route === "/api/accounts/me/verification") {
    const account = current(db);
    return { status: account.status, submittedAt: account.submittedAt, summary: account.summary, documents: account.documents, reviewNote: null };
  }

  if (route === "/api/public/events" && method === "GET") {
    const account = current(db);
    if (!account.emailVerified || account.status !== "active") return fail(403, "FORBIDDEN");
    return { items: db.events.filter((item) => item.status === "PUBLISHED").map((item) => publicEvent(db, item)) };
  }
  const joinMatch = route.match(/^\/api\/public\/events\/([^/]+)\/registrations$/);
  if (joinMatch && method === "POST") {
    const account = active(db, "user");
    const target = db.events.find((item) => item.id === joinMatch[1] && item.status === "PUBLISHED");
    if (!target) return fail(404, "NOT_FOUND");
    if (!target.modules.registration) return fail(409, "REGISTRATION_DISABLED");
    if (!target.registrationOpensAt || !target.registrationClosesAt || Date.now() < Date.parse(target.registrationOpensAt) || Date.now() >= Date.parse(target.registrationClosesAt)) throw new ApiError("Pendaftaran belum dibuka atau sudah ditutup.", 409, "REGISTRATION_CLOSED");
    if (db.registrations.some((item) => item.ownerId === account.id && item.eventId === target.id && (item.status === "REGISTERED" || item.status === "PENDING"))) return fail(409, "ALREADY_REGISTERED");
    if (target.capacity !== null && registeredCount(db, target.id) >= target.capacity) return fail(409, "EVENT_FULL");
    const form = formOf(db, target.id);
    const answers = checkAnswers(form.fields, json.answers);
    const paid = form.priceIdr > 0;
    const created = { id: next(db, "reg"), ownerId: account.id, eventId: target.id, ticketReference: ticketReference(), status: paid ? "PENDING" as const : "REGISTERED" as const, note: null, createdAt: nowIso(), consentAt: json.consent === true ? nowIso() : null, qrSecret: null, answers, registrantName: null };
    db.registrations.push(created);
    if (paid) {
      notify(db, account.id, "Menunggu konfirmasi pembayaran", `Bukti pembayaran untuk ${target.title} sudah terkirim. Penyelenggara akan meninjaunya.`);
      notify(db, target.ownerId, "Bukti pembayaran baru", `${account.fullName} mengirim bukti pembayaran untuk ${target.title}.`);
    } else {
      db.notifications.push({ id: next(db, "n"), ownerId: account.id, title: "Pendaftaran dikonfirmasi", body: `Tiket ${target.title} sudah tersedia di halaman Acara saya.`, createdAt: nowIso(), read: false });
      notify(db, target.ownerId, "Pendaftar baru", `${account.fullName} mendaftar ke ${target.title}.`);
    }
    return toRegistration(db, created);
  }
  const formPublicMatch = route.match(/^\/api\/public\/events\/([^/]+)\/registration-form$/);
  if (formPublicMatch && method === "GET") {
    active(db, "user");
    const target = db.events.find((item) => item.id === formPublicMatch[1] && item.status === "PUBLISHED");
    if (!target) return fail(404, "NOT_FOUND");
    return formView(db, target);
  }
  const imageMatch = route.match(/^\/api\/public\/events\/([^/]+)\/registration-images$/);
  if (imageMatch && method === "POST" && form) {
    active(db, "user");
    if (!db.events.some((item) => item.id === imageMatch[1] && item.status === "PUBLISHED")) return fail(404, "NOT_FOUND");
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024 || !/^image\/(png|jpeg|webp)$/.test(file.type)) return fail(422, "VALIDATION_ERROR");
    return { url: await toDataUrl(file) };
  }
  if (route === "/api/me/registrations") {
    const account = active(db, "user");
    return { items: db.registrations.filter((item) => item.ownerId === account.id).map((item) => toRegistration(db, item)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  }
  if (route === "/api/me/notifications") {
    const account = current(db);
    if (!account.emailVerified || account.status !== "active") return fail(403, "FORBIDDEN");
    return { items: db.notifications.filter((item) => item.ownerId === account.id).map(({ ownerId, ...item }) => { void ownerId; return item; }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  }

  if (route === "/api/organizer/summary") {
    const account = active(db, "organizer");
    const summary: OrganizerSummary = { events: db.events.filter((item) => item.ownerId === account.id).map((item) => ({ eventId: item.id, title: item.title, status: item.status, registered: registeredCount(db, item.id), capacity: item.capacity, applications: db.applications.filter((entry) => entry.eventId === item.id).length, sponsors: db.offers.filter((entry) => entry.eventId === item.id && entry.status === "ACCEPTED").length + db.proposals.filter((entry) => entry.eventId === item.id && entry.status === "ACCEPTED").length })) };
    return summary;
  }
  if (route === "/api/events" && method === "GET") {
    const account = active(db, "organizer");
    return { items: db.events.filter((item) => item.ownerId === account.id).map(strip) };
  }
  if (route === "/api/events" && method === "POST") {
    const account = active(db, "organizer");
    const key = options.headers?.["Idempotency-Key"];
    const existing = key ? db.events.find((item) => item.id === db.idempotency[key] && item.ownerId === account.id) : null;
    if (existing) return strip(existing);
    const input = json as unknown as EventInput;
    if (typeof input.title !== "string" || input.title.trim().length < 3) return fail(422, "VALIDATION_ERROR", { title: "Isi judul event, minimal 3 karakter." });
    const created: OwnedEvent = { ...input, id: next(db, "event"), ownerId: account.id, status: "DRAFT", revision: "1", updatedAt: nowIso() };
    db.events.push(created);
    if (key) db.idempotency[key] = created.id;
    return strip(created);
  }
  const lifecycleMatch = route.match(/^\/api\/events\/([^/]+)\/lifecycle$/);
  const followUpMatch = route.match(/^\/api\/events\/([^/]+)\/sponsor-offers\/([^/]+)\/follow-up$/);
  if (followUpMatch && method === "POST") {
    const account = active(db, "organizer");
    const event = db.events.find((item) => item.id === followUpMatch[1] && item.ownerId === account.id);
    const offer = db.offers.find((item) => item.id === followUpMatch[2] && item.eventId === event?.id);
    const date = typeof json.date === "string" ? json.date : "";
    const note = typeof json.note === "string" ? json.note.trim() : "";
    if (!event || !offer) return fail(404, "NOT_FOUND");
    const parsed = new Date(`${date}T00:00:00Z`);
    if ((date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)) || note.length > 500) throw new ApiError("Isi tanggal tindak lanjut yang valid dan catatan maksimal 500 karakter.", 422, "INVALID_FOLLOW_UP");
    offer.nextFollowUpAt = date || null;
    offer.followUpNote = note || null;
    return { ok: true };
  }
  if (lifecycleMatch && method === "POST") {
    const account = active(db, "organizer");
    const target = db.events.find((item) => item.id === lifecycleMatch[1] && item.ownerId === account.id);
    if (!target) return fail(404, "NOT_FOUND");
    if (target.revision !== json.revision) return fail(409, "STALE_REVISION");
    if (json.action === "publish" && target.status === "DRAFT") {
      const errors = publicationErrors(target);
      if (errors.length) throw new ApiError(errors.join(" "), 422, "INVALID_EVENT");
      target.status = "PUBLISHED";
    } else if (json.action === "close" && target.status === "PUBLISHED") target.status = "CLOSED";
    else if (json.action === "archive" && target.status === "CLOSED") target.status = "ARCHIVED";
    else return fail(409, "INVALID_TRANSITION");
    target.revision = String(Number(target.revision) + 1);
    target.updatedAt = nowIso();
    return strip(target);
  }
  const eventMatch = route.match(/^\/api\/events\/([^/]+)(\/assets)?$/);
  if (eventMatch) {
    const account = active(db, "organizer");
    const target = db.events.find((item) => item.id === eventMatch[1] && item.ownerId === account.id);
    if (!target) return fail(404, "NOT_FOUND");
    if (eventMatch[2] && method === "POST" && form) {
      const file = form.get("file");
      if (!(file instanceof File)) return fail(422, "VALIDATION_ERROR");
      return { id: next(db, "asset"), name: file.name.slice(0, 255), url: await toDataUrl(file) };
    }
    if (method === "GET") return strip(target);
    if (method === "PATCH") {
      if (target.status !== "DRAFT") return fail(409, "NOT_EDITABLE");
      if (json.revision !== target.revision) return fail(409, "STALE_REVISION");
      const { revision, ...input } = json as unknown as EventInput & { revision: string };
      void revision;
      Object.assign(target, input, { revision: String(Number(target.revision) + 1), updatedAt: nowIso() });
      return strip(target);
    }
  }

  if (/\/report$|\/benefits(?:\/|$)|\/sponsor-proposals\/[^/]+\/decision$/.test(route)) return dispatchReporting(db, method, route, json);
  const handled = await dispatchParticipation(db, method, route, json);
  if (handled !== NOT_HANDLED) return handled;

  const eventProposalsMatch = route.match(/^\/api\/events\/([^/]+)\/sponsor-proposals$/);
  if (eventProposalsMatch && method === "GET") {
    const account = active(db, "organizer");
    const event = db.events.find((item) => item.id === eventProposalsMatch[1] && item.ownerId === account.id);
    if (!event) return fail(404, "NOT_FOUND");
    return { items: db.proposals.filter((item) => item.eventId === event.id).map(({ ownerId, ...item }) => {
      const sponsor = db.accounts.find((account) => account.id === ownerId);
      return { ...item, sponsorName: sponsor?.summary.find((entry) => entry.label === "Perusahaan")?.value || sponsor?.fullName || "Sponsor" };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  }
  if (route === "/api/sponsor/proposals" && method === "GET") {
    const account = active(db, "sponsor");
    return { items: db.proposals.filter((item) => item.ownerId === account.id).map(({ ownerId, ...item }) => { void ownerId; return item; }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  }
  if (route === "/api/sponsor/proposals" && method === "POST") {
    const account = active(db, "sponsor");
    const target = db.events.find((item) => item.id === json.eventId && item.status === "PUBLISHED");
    if (!target) return fail(404, "NOT_FOUND");
    const offer = String(json.offer ?? "").trim();
    if (offer.length < 20) return fail(422, "VALIDATION_ERROR", { offer: "Jelaskan penawaranmu, minimal 20 karakter." });
    const created: Proposal & { ownerId: string } = { id: next(db, "proposal"), ownerId: account.id, eventId: target.id, eventTitle: target.title, category: String(json.category ?? ""), offer, amountLabel: typeof json.amountLabel === "string" && json.amountLabel.trim() ? json.amountLabel.trim() : null, status: "SENT", createdAt: nowIso() };
    db.proposals.push(created);
    notify(db, target.ownerId, "Proposal sponsor baru", `Ada penawaran dukungan untuk ${target.title}. Tinjau di Status sponsor.`);
    const { ownerId, ...view } = created; void ownerId;
    return view;
  }
  if (route === "/api/sponsor/sponsorships") {
    const account = active(db, "sponsor");
    return { items: db.sponsorships.filter((item) => item.ownerId === account.id).map(({ ownerId, ...item }) => { void ownerId; return item; }) };
  }
  return fail(404, "NOT_FOUND");
}

const NOT_HANDLED = Symbol("not-handled");
const notify = (db: DemoDb, ownerId: string, title: string, body: string) => db.notifications.push({ id: next(db, "n"), ownerId, title, body, createdAt: nowIso(), read: false });
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const strip2 = <T extends { ownerId: string }>({ ownerId, ...view }: T) => { void ownerId; return view; };

/** Logos come from the event's branding, so an organizer sets them once. */
function coverOf(db: DemoDb, eventId: string) {
  const event = db.events.find((item) => item.id === eventId);
  return { organizationName: event?.branding.organizationName ?? "", eventLogoUrl: event?.branding.eventLogo?.url ?? null, organizationLogoUrl: event?.branding.organizationLogo?.url ?? null };
}
const openingView = (db: DemoDb, item: OwnedOpening): CommitteeOpening => ({ ...strip2(item), organizationName: coverOf(db, item.eventId).organizationName || item.organizationName, eventLogoUrl: coverOf(db, item.eventId).eventLogoUrl, organizationLogoUrl: coverOf(db, item.eventId).organizationLogoUrl });
const stagesOf = (db: DemoDb, openingId: string): SelectionStage[] => db.openings.find((item) => item.id === openingId)?.stages ?? [];
const applicationView = (db: DemoDb, item: OwnedApplication): CommitteeApplication => { const { ownerId, applicantName, ...view } = item; void ownerId; void applicantName; return { ...view, ...coverOf(db, item.eventId), stages: stagesOf(db, item.openingId) }; };

/**
 * Moves the organizer may make now. A new application goes to the first stage (or straight to a decision when the opening
 * has no stages). From a stage it may go to the next stage, be accepted, or be rejected. Final states have no moves.
 */
function allowedMoves(db: DemoDb, item: OwnedApplication): DecisionTarget[] {
  const stages = stagesOf(db, item.openingId);
  const accept = { to: "ACCEPTED", label: "Terima" };
  const reject = { to: "REJECTED", label: "Tolak" };
  if (item.status === "SUBMITTED") return stages.length ? [{ to: stages[0].id, label: `Pindah ke ${stages[0].name}` }, reject] : [accept, reject];
  if (item.status !== "IN_SELECTION") return [];
  const following = stages[stages.findIndex((stage) => stage.id === item.stageId) + 1];
  return following ? [{ to: following.id, label: `Pindah ke ${following.name}` }, accept, reject] : [accept, reject];
}
const applicantView = (db: DemoDb, item: OwnedApplication): ApplicantView => ({ ...applicationView(db, item), applicantName: item.applicantName, allowed: allowedMoves(db, item) });

const secretAlphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function qrSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((byte) => secretAlphabet[byte % secretAlphabet.length]).join("");
}
const defaultFields: RegistrationField[] = [{ id: "field-default-1", label: "Asal institusi atau komunitas", type: "text", required: false, hint: "Boleh dikosongkan.", options: [] }];
const formOf = (db: DemoDb, eventId: string) => db.forms[eventId] ?? { priceIdr: 0, paymentNote: null, fields: defaultFields };
const formView = (db: DemoDb, event: OwnedEvent): RegistrationForm => { const stored = db.forms[event.id]; const form = formOf(db, event.id); return { eventTitle: event.title, priceIdr: form.priceIdr, paymentNote: form.paymentNote, fields: form.fields, isDefault: !stored }; };
const imageUrl = /^(https:\/\/\S+|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/;

/** Validates a registration against the organizer's form. The question text is copied so later edits never rewrite old answers. */
function checkAnswers(fields: RegistrationField[], raw: unknown): RegistrationAnswer[] {
  const given = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const problems: Record<string, string> = {};
  const answers: RegistrationAnswer[] = [];
  for (const field of fields) {
    const value = typeof given[field.id] === "string" ? (given[field.id] as string).trim() : "";
    if (!value) { if (field.required) problems[field.id] = "Wajib diisi."; continue; }
    if (field.type === "text" && value.length > 200) problems[field.id] = "Maksimal 200 karakter.";
    else if (field.type === "longtext" && value.length > 1000) problems[field.id] = "Maksimal 1000 karakter.";
    else if (field.type === "choice" && !field.options.includes(value)) problems[field.id] = "Pilih salah satu dari daftar.";
    else if (field.type === "image" && !imageUrl.test(value)) problems[field.id] = "Unggah gambar yang valid.";
    else answers.push({ fieldId: field.id, label: field.label, type: field.type, value });
  }
  if (Object.keys(problems).length) return fail(422, "VALIDATION_ERROR", problems);
  return answers;
}

function registrantOf(db: DemoDb, item: DemoDb["registrations"][number]): Registrant {
  const account = db.accounts.find((entry) => entry.id === item.ownerId);
  return { id: item.id, name: account?.fullName ?? item.registrantName ?? "Peserta", ticketReference: item.ticketReference, status: item.status, note: item.note ?? null, createdAt: item.createdAt, qrIssued: Boolean(item.qrSecret), checkedInAt: item.checkedInAt ?? null, checkedOutAt: item.checkedOutAt ?? null, answers: item.answers };
}

/** Organizer side of registration: price, custom form, and the list of registrants. */
function dispatchRegistration(db: DemoDb, method: string, route: string, json: Record<string, unknown>): unknown {
  const scanMatch = route.match(/^\/api\/events\/([^/]+)\/(ticket-scans|attendance)$/);
  if (scanMatch) {
    const owner = active(db, "organizer");
    const event = db.events.find((item) => item.id === scanMatch[1] && item.ownerId === owner.id);
    if (!event) return fail(404, "NOT_FOUND");
    if (scanMatch[2] === "attendance" && method === "POST") {
      if (json.mode !== "NONE" && json.mode !== "ENTRY" && json.mode !== "ENTRY_EXIT") return fail(422, "INVALID_MODE");
      if (json.mode !== "NONE" && !event.modules.registration) throw new ApiError("Aktifkan modul pendaftaran terlebih dahulu.", 422, "REGISTRATION_REQUIRED");
      event.modules.attendance = json.mode !== "NONE";
      (db.attendanceModes ??= {})[event.id] = json.mode;
      return { ok: true };
    }
    const mode = !event.modules.attendance ? "NONE" : db.attendanceModes?.[event.id] === "ENTRY_EXIT" ? "ENTRY_EXIT" : "ENTRY";
    if (scanMatch[2] === "attendance" && method === "GET") return { eventId: event.id, eventTitle: event.title, attendanceEnabled: event.modules.attendance, attendanceMode: mode, items: db.registrations.filter((item) => item.eventId === event.id && item.checkedInAt).map((item) => registrantOf(db, item)) };
    if (scanMatch[2] !== "ticket-scans" || method !== "POST") return fail(404, "NOT_FOUND");
    if (event.status !== "PUBLISHED") throw new ApiError("Acara tidak terbuka untuk pemindaian tiket baru.", 409, "EVENT_CLOSED");
    if (typeof json.payload !== "string" || !/^PH1\.[a-zA-Z0-9]{24}$/.test(json.payload)) return fail(422, "INVALID_TICKET");
    const found = db.registrations.find((item) => item.eventId === event.id && item.qrSecret === (json.payload as string).slice(4));
    if (!found) return fail(404, "INVALID_TICKET");
    if (found.status !== "REGISTERED") return fail(409, "TICKET_INACTIVE");
    if (json.direction === "EXIT") {
      if (mode !== "ENTRY_EXIT") throw new ApiError("Scan keluar belum diaktifkan untuk acara ini.", 409, "EXIT_DISABLED");
      if (!found.checkedInAt) throw new ApiError("Tiket harus dicatat masuk sebelum scan keluar.", 409, "ENTRY_REQUIRED");
      const repeated = Boolean(found.checkedOutAt);
      if (!repeated) found.checkedOutAt = nowIso();
      return { eventId: event.id, eventTitle: event.title, participant: registrantOf(db, found), attendance: repeated ? "ALREADY_EXIT_RECORDED" : "EXIT_RECORDED" };
    }
    const attendance = !event.modules.attendance ? "DISABLED" : found.checkedInAt ? "ALREADY_RECORDED" : "RECORDED";
    if (attendance === "RECORDED") found.checkedInAt = nowIso();
    return { eventId: event.id, eventTitle: event.title, participant: registrantOf(db, found), attendance };
  }
  const decisionMatch = route.match(/^\/api\/events\/([^/]+)\/registrants\/([^/]+)\/decision$/);
  if (decisionMatch && method === "POST") {
    const owner = active(db, "organizer");
    const event = db.events.find((item) => item.id === decisionMatch[1] && item.ownerId === owner.id);
    const found = event && db.registrations.find((item) => item.id === decisionMatch[2] && item.eventId === event.id);
    if (!event || !found) return fail(404, "NOT_FOUND");
    const decision = json.decision;
    const reason = text(json.note);
    if (decision !== "CONFIRM" && decision !== "REJECT") return fail(422, "VALIDATION_ERROR", { decision: "Pilih konfirmasi atau tolak." });
    if (reason.length > 200) return fail(422, "VALIDATION_ERROR", { note: "Maksimal 200 karakter." });
    if (found.status !== "PENDING") return fail(409, "NOT_PENDING");
    if (decision === "CONFIRM") {
      if (event.capacity !== null && registeredCount(db, event.id) >= event.capacity) return fail(409, "EVENT_FULL");
      found.status = "REGISTERED";
      found.note = null;
      notify(db, found.ownerId, "Pembayaran dikonfirmasi", `Pendaftaran ${event.title} sudah terkonfirmasi. QR masuk akan dikirim penyelenggara.`);
    } else {
      found.status = "REJECTED";
      found.note = reason || null;
      notify(db, found.ownerId, "Pembayaran ditolak", `Pendaftaran ${event.title} ditolak.${reason ? ` Alasan: ${reason}` : ""} Kamu bisa mendaftar lagi dengan bukti baru.`);
    }
    return registrantOf(db, found);
  }
  const match = route.match(/^\/api\/events\/([^/]+)\/(registration-form|registrants)$/);
  if (!match) return NOT_HANDLED;
  const account = active(db, "organizer");
  const target = db.events.find((item) => item.id === match[1] && item.ownerId === account.id);
  if (!target) return fail(404, "NOT_FOUND");
  if (match[2] === "registrants" && method === "GET") {
    const board: RegistrantBoard = { eventTitle: target.title, priceIdr: formOf(db, target.id).priceIdr, items: db.registrations.filter((item) => item.eventId === target.id).map((item) => registrantOf(db, item)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) };
    return board;
  }
  if (match[2] !== "registration-form") return fail(404, "NOT_FOUND");
  if (method === "GET") return formView(db, target);
  if (method !== "PUT") return fail(404, "NOT_FOUND");
  const price = Number(json.priceIdr);
  const note = text(json.paymentNote);
  const list = Array.isArray(json.fields) ? json.fields : [];
  const problems: Record<string, string> = {};
  if (!Number.isInteger(price) || price < 0 || price > 10_000_000) problems.priceIdr = "Harga 0 sampai Rp10.000.000, tanpa desimal. Isi 0 untuk acara gratis.";
  if (price > 0 && note.length < 10) problems.paymentNote = "Jelaskan cara membayar, minimal 10 karakter. PartnerHub tidak memproses pembayaran.";
  if (note.length > 400) problems.paymentNote = "Maksimal 400 karakter.";
  if (list.length > 10) problems.fields = "Maksimal 10 pertanyaan.";
  const previous = formOf(db, target.id).fields;
  const fields: RegistrationField[] = [];
  const labels = new Set<string>();
  list.forEach((entry, index) => {
    const source = (entry ?? {}) as Record<string, unknown>;
    const label = text(source.label);
    const type = source.type as RegistrationField["type"];
    const options = (Array.isArray(source.options) ? source.options : []).map(text).filter(Boolean);
    if (label.length < 3 || label.length > 100) problems[`field${index}`] = "Pertanyaan 3 sampai 100 karakter.";
    else if (labels.has(label.toLowerCase())) problems[`field${index}`] = "Pertanyaan tidak boleh sama.";
    else if (!["text", "longtext", "choice", "image"].includes(type)) problems[`field${index}`] = "Pilih jenis isian.";
    else if (type === "choice" && (options.length < 2 || options.length > 8 || new Set(options).size !== options.length || options.some((option) => option.length > 60))) problems[`field${index}`] = "Pilihan berisi 2 sampai 8 opsi berbeda.";
    labels.add(label.toLowerCase());
    const id = text(source.id);
    fields.push({ id: id && previous.some((item) => item.id === id) ? id : next(db, "field"), label, type, required: source.required === true, hint: text(source.hint) || null, options: type === "choice" ? options : [] });
  });
  if (price > 0 && !fields.some((field) => field.type === "image")) problems.fields = problems.fields ?? "Acara berbayar perlu satu isian gambar untuk bukti pembayaran.";
  if (Object.keys(problems).length) return fail(422, "VALIDATION_ERROR", problems);
  db.forms[target.id] = { priceIdr: price, paymentNote: note || null, fields };
  return formView(db, target);
}
/** Committee recruitment and organizer-to-sponsor requests. Returns NOT_HANDLED for routes it does not own. */
async function dispatchParticipation(db: DemoDb, method: string, route: string, json: Record<string, unknown>): Promise<unknown> {
  const registration = dispatchRegistration(db, method, route, json);
  if (registration !== NOT_HANDLED) return registration;
  if (route === "/api/committee/openings" && method === "GET") {
    active(db, "user");
    const published = new Set(db.events.filter((item) => item.status === "PUBLISHED").map((item) => item.id));
    return { items: db.openings.filter((item) => item.status === "OPEN" && published.has(item.eventId)).map((item) => openingView(db, item)) };
  }
  if (route === "/api/me/committee-applications" && method === "GET") {
    const account = active(db, "user");
    return { items: db.applications.filter((item) => item.ownerId === account.id).map((item) => applicationView(db, item)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  }
  const applyMatch = route.match(/^\/api\/committee\/openings\/([^/]+)\/applications$/);
  if (applyMatch && method === "POST") {
    const account = active(db, "user");
    const opening = db.openings.find((item) => item.id === applyMatch[1] && item.status === "OPEN" && db.events.some((entry) => entry.id === item.eventId && entry.status === "PUBLISHED"));
    if (!opening) return fail(404, "NOT_FOUND");
    if (db.applications.some((item) => item.ownerId === account.id && item.openingId === opening.id && item.status !== "WITHDRAWN")) return fail(409, "ALREADY_APPLIED");
    const ids = Array.isArray(json.divisionIds) ? json.divisionIds.filter((id): id is string => typeof id === "string") : [];
    const chosen = ids.map((id) => opening.divisions.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
    const motivation = text(json.motivation);
    const answer = text(json.answer);
    const fields: Record<string, string> = {};
    if (!chosen.length || chosen.length !== new Set(ids).size) fields.divisionIds = "Pilih minimal satu divisi dari daftar.";
    if (motivation.length < 20) fields.motivation = "Ceritakan motivasimu, minimal 20 karakter.";
    if (opening.question && !answer) fields.answer = "Jawab pertanyaan dari penyelenggara.";
    if (Object.keys(fields).length) return fail(422, "VALIDATION_ERROR", fields);
    const created: OwnedApplication = { id: next(db, "application"), ownerId: account.id, applicantName: account.fullName, openingId: opening.id, eventId: opening.eventId, eventTitle: opening.eventTitle, divisions: chosen.map((item) => item.name), motivation, question: opening.question, answer: opening.question ? answer : null, status: "SUBMITTED", stageId: null, note: null, createdAt: nowIso() };
    db.applications.push(created);
    notify(db, opening.ownerId, "Lamaran panitia baru", `${account.fullName} melamar panitia ${opening.eventTitle}.`);
    return applicationView(db, created);
  }

  // QR delivery. The organizer issues and sends codes per event; a participant can only show a code that was sent to them.
  const qrEventMatch = route.match(/^\/api\/events\/([^/]+)\/qr(\/send)?$/);
  if (qrEventMatch) {
    const account = active(db, "organizer");
    const target = db.events.find((item) => item.id === qrEventMatch[1] && item.ownerId === account.id);
    if (!target) return fail(404, "NOT_FOUND");
    const live = () => db.registrations.filter((item) => item.eventId === target.id && item.status === "REGISTERED");
    const board = (): QrDelivery => ({ eventTitle: target.title, eventPublished: target.status === "PUBLISHED", registered: live().length, issued: live().filter((item) => item.qrSecret).length });
    if (!qrEventMatch[2] && method === "GET") return board();
    if (qrEventMatch[2] && method === "POST") {
      if (target.status !== "PUBLISHED") return fail(409, "NOT_PUBLISHED");
      const pending = live().filter((item) => !item.qrSecret);
      for (const registration of pending) {
        registration.qrSecret = qrSecret();
        notify(db, registration.ownerId, "QR tiket terkirim", `QR masuk untuk ${target.title} sudah tersedia. Buka halaman tiketmu dan pilih Tampilkan QR.`);
      }
      return board();
    }
    return fail(404, "NOT_FOUND");
  }
  const qrTicketMatch = route.match(/^\/api\/me\/registrations\/([^/]+)\/qr$/);
  if (qrTicketMatch && method === "GET") {
    const account = active(db, "user");
    const found = db.registrations.find((item) => item.id === qrTicketMatch[1] && item.ownerId === account.id && item.status === "REGISTERED");
    if (!found) return fail(404, "NOT_FOUND");
    if (!found.qrSecret) return fail(409, "QR_NOT_SENT");
    const payload: TicketQr = { payload: `PH1.${found.qrSecret}` };
    return payload;
  }
  const committeeMatch = route.match(/^\/api\/events\/([^/]+)\/committee(\/opening|\/applications\/([^/]+)\/decision)?$/);
  if (committeeMatch) {
    const account = active(db, "organizer");
    const target = db.events.find((item) => item.id === committeeMatch[1] && item.ownerId === account.id);
    if (!target) return fail(404, "NOT_FOUND");
    const opening = db.openings.find((item) => item.eventId === target.id) ?? null;
    if (!committeeMatch[2] && method === "GET") {
      return { eventTitle: target.title, eventPublished: target.status === "PUBLISHED", opening: opening ? openingView(db, opening) : null, applications: db.applications.filter((item) => item.eventId === target.id).map((item) => applicantView(db, item)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
    }
    if (committeeMatch[2] === "/opening" && method === "PUT") {
      if (target.status !== "PUBLISHED") return fail(409, "NOT_PUBLISHED");
      const description = text(json.description);
      const names = (Array.isArray(json.divisions) ? json.divisions : []).map(text).filter(Boolean);
      const question = text(json.question);
      const fields: Record<string, string> = {};
      if (description.length < 20) fields.description = "Jelaskan kebutuhan panitia, minimal 20 karakter.";
      if (!names.length || names.length > 12) fields.divisions = "Isi 1 sampai 12 divisi.";
      else if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) fields.divisions = "Nama divisi tidak boleh sama.";
      const stageInput = (Array.isArray(json.stages) ? json.stages : []).map((entry) => ({ id: text((entry as { id?: unknown })?.id) || null, name: text((entry as { name?: unknown })?.name) }));
      const stageNames = stageInput.map((entry) => entry.name);
      if (stageInput.length > 5) fields.stages = "Maksimal 5 tahapan.";
      else if (stageNames.some((name) => !name || name.length > 40)) fields.stages = "Beri setiap tahapan nama, maksimal 40 karakter.";
      else if (new Set(stageNames.map((name) => name.toLowerCase())).size !== stageNames.length) fields.stages = "Nama tahapan tidak boleh sama.";
      else {
        const kept = new Set(stageInput.map((entry) => entry.id));
        const held = (opening?.stages ?? []).find((stage) => !kept.has(stage.id) && db.applications.some((entry) => entry.openingId === opening?.id && entry.stageId === stage.id && entry.status === "IN_SELECTION"));
        if (held) fields.stages = `Tahapan ${held.name} masih berisi pelamar. Pindahkan mereka dulu.`;
      }
      if (Object.keys(fields).length) return fail(422, "VALIDATION_ERROR", fields);
      const stages: SelectionStage[] = stageInput.map((entry) => ({ id: entry.id && opening?.stages.some((stage) => stage.id === entry.id) ? entry.id : next(db, "stage"), name: entry.name }));
      // Existing divisions keep their ids so earlier applications stay meaningful.
      const divisions = names.map((name) => opening?.divisions.find((item) => item.name === name) ?? { id: next(db, "division"), name });
      const saved: OwnedOpening = { id: opening?.id ?? next(db, "opening"), ownerId: account.id, eventId: target.id, eventTitle: target.title, organizationName: target.branding.organizationName, description, divisions, question: question || null, stages, status: json.open === false ? "CLOSED" : "OPEN" };
      if (opening) Object.assign(opening, saved); else db.openings.push(saved);
      return openingView(db, saved);
    }
    const applicationId = committeeMatch[3];
    if (applicationId && method === "POST") {
      const application = db.applications.find((item) => item.id === applicationId && item.eventId === target.id);
      if (!application) return fail(404, "NOT_FOUND");
      const to = text(json.to);
      const note = text(json.note);
      const move = allowedMoves(db, application).find((entry) => entry.to === to);
      if (!move) return fail(409, "INVALID_TRANSITION");
      if (to === "ACCEPTED" && note.length < 10) return fail(422, "VALIDATION_ERROR", { note: "Tulis langkah berikutnya untuk panitia yang diterima, minimal 10 karakter." });
      const stage = stagesOf(db, application.openingId).find((entry) => entry.id === to);
      if (stage) { application.status = "IN_SELECTION"; application.stageId = stage.id; }
      else if (to === "ACCEPTED") { application.status = "ACCEPTED"; application.stageId = null; }
      else application.status = "REJECTED";
      application.note = note || null;
      const label = stage ? `masuk tahap ${stage.name}` : to === "ACCEPTED" ? "diterima" : "belum dapat kami terima";
      notify(db, application.ownerId, `Lamaran panitia ${application.eventTitle}`, `Lamaranmu ${label}.${note ? ` Catatan penyelenggara: ${note}` : ""}`.slice(0, 500));      return applicantView(db, application);
    }
    return fail(404, "NOT_FOUND");
  }

  if (route === "/api/sponsors/directory" && method === "GET") {
    active(db, "organizer");
    return { items: db.accounts.filter((item) => item.role === "sponsor" && item.status === "active" && item.emailVerified).map((item) => ({ id: item.id, companyName: item.summary.find((entry) => entry.label === "Perusahaan")?.value || item.fullName, industry: item.summary.find((entry) => entry.label === "Industri")?.value || "-" })) };
  }
  const offersMatch = route.match(/^\/api\/events\/([^/]+)\/sponsor-offers$/);
  if (offersMatch) {
    const account = active(db, "organizer");
    const target = db.events.find((item) => item.id === offersMatch[1] && item.ownerId === account.id);
    if (!target) return fail(404, "NOT_FOUND");
    if (method === "GET") return { eventTitle: target.title, eventPublished: target.status === "PUBLISHED", items: db.offers.filter((item) => item.eventId === target.id).map(strip2).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
    if (method === "POST") {
      if (target.status !== "PUBLISHED") return fail(409, "NOT_PUBLISHED");
      const sponsor = db.accounts.find((item) => item.id === json.sponsorId && item.role === "sponsor" && item.status === "active" && item.emailVerified);
      const message = text(json.message);
      const category = text(json.category);
      const amount = text(json.amountLabel);
      const url = text(json.proposalUrl);
      const fields: Record<string, string> = {};
      if (!sponsor) fields.sponsorId = "Pilih sponsor dari daftar.";
      if (!category) fields.category = "Pilih bentuk dukungan.";
      if (message.length < 20) fields.message = "Jelaskan permintaanmu, minimal 20 karakter.";
      if (url && !/^https:\/\/[^\s]+$/.test(url)) fields.proposalUrl = "Masukkan tautan yang diawali https://.";
      if (Object.keys(fields).length || !sponsor) return fail(422, "VALIDATION_ERROR", fields);
      if (db.offers.some((item) => item.eventId === target.id && item.sponsorId === sponsor.id && item.status === "SENT")) return fail(409, "OFFER_PENDING");
      const sponsorName = sponsor.summary.find((entry) => entry.label === "Perusahaan")?.value || sponsor.fullName;
      const created: OwnedOffer = { id: next(db, "offer"), ownerId: account.id, eventId: target.id, eventTitle: target.title, organizationName: target.branding.organizationName, sponsorId: sponsor.id, sponsorName, category, message, amountLabel: amount || null, proposalUrl: url || null, status: "SENT", createdAt: nowIso() };
      db.offers.push(created);
      notify(db, sponsor.id, "Permintaan sponsorship baru", `${target.branding.organizationName || "Penyelenggara"} mengajak ${sponsorName} mendukung ${target.title}.`);
      return strip2(created);
    }
  }
  if (route === "/api/sponsor/offers" && method === "GET") {
    const account = active(db, "sponsor");
    return { items: db.offers.filter((item) => item.sponsorId === account.id).map(strip2).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  }
  const responseMatch = route.match(/^\/api\/sponsor\/offers\/([^/]+)\/response$/);
  if (responseMatch && method === "POST") {
    const account = active(db, "sponsor");
    const found = db.offers.find((item) => item.id === responseMatch[1] && item.sponsorId === account.id);
    if (!found) return fail(404, "NOT_FOUND");
    if (found.status !== "SENT") return fail(409, "ALREADY_ANSWERED");
    if (json.status !== "ACCEPTED" && json.status !== "DECLINED") return fail(422, "VALIDATION_ERROR");
    found.status = json.status;
    if (found.status === "ACCEPTED") ensureAgreement(db, found.eventId, found.sponsorId, found.category);
    notify(db, found.ownerId, "Tanggapan sponsor", `${found.sponsorName} ${json.status === "ACCEPTED" ? "menerima" : "menolak"} permintaan dukungan untuk ${found.eventTitle}.`);
    return strip2(found);
  }
  return NOT_HANDLED;
}

function toRegistration(db: DemoDb, item: DemoDb["registrations"][number]): MyRegistration {
  const target = db.events.find((entry) => entry.id === item.eventId);
  return { id: item.id, ticketReference: item.ticketReference, status: item.status, note: item.note ?? null, createdAt: item.createdAt, qrIssued: Boolean(item.qrSecret), priceIdr: db.forms[item.eventId]?.priceIdr ?? 0, event: { id: item.eventId, title: target?.title ?? "Acara", startsAt: target?.startsAt ?? null, venue: target?.venue ?? "" } };
}

/** Called by the demo banner. Clears every change and signs out. */
export function resetDemoData(): void { resetDb(); }
