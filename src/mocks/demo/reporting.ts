import { ApiError } from "@/lib/api-client";
import type { EventReport } from "@/contracts/event-report";
import type { DemoDb } from "./seed";

export function ensureAgreement(db: DemoDb, eventId: string, sponsorId: string, packageName: string) {
  const event = db.events.find((item) => item.id === eventId);
  if (!event) throw new ApiError("Acara tidak ditemukan.", 404, "NOT_FOUND");
  let found = db.sponsorships.find((item) => item.eventId === eventId && item.ownerId === sponsorId);
  if (!found) { found = { id: `sponsorship-${++db.counter}`, ownerId: sponsorId, eventId, eventTitle: event.title, packageName, benefits: [] }; db.sponsorships.push(found); }
  return found;
}

export function dispatchReporting(db: DemoDb, method: string, route: string, body: Record<string, unknown>): EventReport | { ok: true } {
  const match = route.match(/^\/api\/events\/([^/]+)\/(report|benefits|benefits\/([^/]+)|sponsor-proposals\/([^/]+)\/decision)$/);
  const account = db.accounts.find((item) => item.id === db.sessionAccountId);
  const event = db.events.find((item) => item.id === match?.[1] && item.ownerId === account?.id);
  if (!account || account.role !== "organizer" || account.status !== "active" || !account.emailVerified || !event || !match) throw new ApiError("Acara tidak tersedia untuk akun ini.", 403, "FORBIDDEN");
  const agreement = (sponsorId: string, packageName: string) => ensureAgreement(db, event.id, sponsorId, packageName);
  if (match[4] && method === "POST") {
    const proposal = db.proposals.find((item) => item.id === match[4] && item.eventId === event.id);
    if (!proposal) throw new ApiError("Proposal tidak ditemukan.", 404, "NOT_FOUND");
    if (!["SENT", "IN_REVIEW"].includes(proposal.status)) throw new ApiError("Proposal sudah diputuskan.", 409, "DECIDED");
    if (body.status !== "IN_REVIEW" && body.status !== "ACCEPTED" && body.status !== "DECLINED") throw new ApiError("Pilih keputusan yang valid.", 422, "INVALID_STATUS");
    proposal.status = body.status;
    if (proposal.status === "ACCEPTED") agreement(proposal.ownerId, proposal.category || "Dukungan acara");
    db.notifications.push({ id: `notice-${++db.counter}`, ownerId: proposal.ownerId, title: "Status proposal diperbarui", body: `${event.title}: ${proposal.status === "ACCEPTED" ? "diterima" : proposal.status === "DECLINED" ? "ditolak" : "sedang ditinjau"}.`, createdAt: new Date().toISOString(), read: false });
    return { ok: true };
  }
  // Accepted organizer requests also create the same accountable benefit workspace.
  for (const offer of db.offers.filter((item) => item.eventId === event.id && item.status === "ACCEPTED")) agreement(offer.sponsorId, offer.category);
  for (const proposal of db.proposals.filter((item) => item.eventId === event.id && item.status === "ACCEPTED")) agreement(proposal.ownerId, proposal.category);
  const agreements = db.sponsorships.filter((item) => item.eventId === event.id);
  if (match[2] === "benefits" && method === "POST") {
    const found = agreements.find((item) => item.id === body.sponsorshipId);
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!found || !label || label.length > 200 || found.benefits.length >= 50) throw new ApiError("Pilih komitmen sponsor dan isi benefit, maksimal 200 karakter.", 422, "INVALID_BENEFIT");
    found.benefits.push({ id: `benefit-${++db.counter}`, label, status: "PLANNED", evidenceUrl: null });
    return { ok: true };
  }
  if (match[3] && method === "PATCH") {
    const benefit = agreements.flatMap((item) => item.benefits).find((item) => item.id === match[3]);
    const url = typeof body.evidenceUrl === "string" ? body.evidenceUrl.trim() : "";
    let valid = false;
    try { const parsed = new URL(url); valid = parsed.protocol === "https:" && !parsed.username && !parsed.password; } catch { /* Validation feedback below. */ }
    if (!benefit || !valid || url.length > 2000 || typeof body.verified !== "boolean") throw new ApiError("Masukkan tautan bukti https yang valid dan pilih status pemeriksaan.", 422, "INVALID_EVIDENCE");
    benefit.evidenceUrl = url;
    benefit.status = body.verified ? "VERIFIED" : "PLANNED";
    return { ok: true };
  }
  if (match[2] !== "report" || method !== "GET") throw new ApiError("Tindakan tidak tersedia.", 405, "METHOD_NOT_ALLOWED");
  const registrations = db.registrations.filter((item) => item.eventId === event.id);
  return { eventId: event.id, eventTitle: event.title, registered: (db.baseRegistered[event.id] ?? 0) + registrations.filter((item) => item.status === "REGISTERED").length, pending: registrations.filter((item) => item.status === "PENDING").length, applications: db.applications.filter((item) => item.eventId === event.id).length, attended: registrations.filter((item) => item.status === "REGISTERED" && item.checkedInAt).length,
    sponsorships: agreements.map(({ ownerId, ...item }) => ({ ...item, sponsorName: db.accounts.find((account) => account.id === ownerId)?.summary.find((row) => row.label === "Perusahaan")?.value || "Sponsor demo" })) };
}
