import { z } from "zod";
import { ApiError, apiRequest } from "@/lib/api-client";
import type { ApplicantView, ApplicationInput, CommitteeApplication, CommitteeOpening, CommitteeOpeningInput, CommitteeWorkspace, DecisionInput } from "@/contracts/committee";

const iso = z.iso.datetime({ offset: true });
const status = z.enum(["SUBMITTED", "IN_SELECTION", "ACCEPTED", "REJECTED", "WITHDRAWN"]);
// Same rule as organizer assets. A bad or missing logo only drops that image.
const logo = z.string().refine((url) => /^\/(?!\/)/.test(url) || /^https:\/\//.test(url)).nullish().catch(null).transform((url) => url ?? null);
const stage = z.object({ id: z.string().min(1), name: z.string().min(1).max(40) });
const opening = z.object({
  id: z.string().min(1), eventId: z.string().min(1), eventTitle: z.string().max(100), organizationName: z.string().max(100), description: z.string().max(1000),
  eventLogoUrl: logo, organizationLogoUrl: logo, stages: z.array(stage).max(5),
  divisions: z.array(z.object({ id: z.string().min(1), name: z.string().max(60) })).max(12), question: z.string().max(200).nullable(), status: z.enum(["OPEN", "CLOSED"]),
});
const application = z.object({
  id: z.string().min(1), openingId: z.string().min(1), eventId: z.string().min(1), eventTitle: z.string().max(100), organizationName: z.string().max(100), eventLogoUrl: logo, organizationLogoUrl: logo, divisions: z.array(z.string().max(60)).max(12),
  motivation: z.string().max(600), question: z.string().max(200).nullable(), answer: z.string().max(400).nullable(), status, stageId: z.string().nullable(), stages: z.array(stage).max(5), note: z.string().max(300).nullable(), createdAt: iso,
});
const applicant = application.extend({ applicantName: z.string().max(120), allowed: z.array(z.object({ to: z.string().min(1), label: z.string().max(80) })).max(8) });
const workspace = z.object({ eventTitle: z.string().max(100), eventPublished: z.boolean(), opening: opening.nullable(), applications: z.array(applicant).max(500) });

function parse<T>(schema: z.ZodType<T>, data: unknown, message: string): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ApiError(message, 0, "INVALID_RESPONSE");
  return result.data;
}

export async function listOpenings(_key: string, signal: AbortSignal): Promise<CommitteeOpening[]> {
  // TODO(backend): GET /api/committee/openings -> 200 {items:[CommitteeOpening]}. Only OPEN openings of PUBLISHED events. Approved user accounts only.
  return parse(z.object({ items: z.array(opening).max(200) }), await apiRequest<unknown>("/api/committee/openings", { signal }), "Daftar lowongan tidak dapat dibaca.").items;
}

export async function listMyApplications(_key: string, signal: AbortSignal): Promise<CommitteeApplication[]> {
  // TODO(backend): GET /api/me/committee-applications -> 200 {items:[CommitteeApplication]}, newest first, current account only.
  return parse(z.object({ items: z.array(application).max(200) }), await apiRequest<unknown>("/api/me/committee-applications", { signal }), "Daftar lamaran tidak dapat dibaca.").items;
}

export async function applyToOpening(openingId: string, input: ApplicationInput): Promise<CommitteeApplication> {
  // TODO(backend): POST /api/committee/openings/:id/applications JSON {divisionIds,motivation,answer|null} -> 201 CommitteeApplication (SUBMITTED). Errors: 404, 403, 409 already applied, 422 {fields:{divisionIds,motivation,answer}}, 429.
  return parse(application, await apiRequest<unknown>(`/api/committee/openings/${encodeURIComponent(openingId)}/applications`, { method: "POST", body: input }), "Lamaran belum dapat dikonfirmasi.");
}

export async function getCommitteeWorkspace(eventId: string, signal: AbortSignal): Promise<CommitteeWorkspace> {
  // TODO(backend): GET /api/events/:id/committee -> 200 CommitteeWorkspace. Event owner only; 404 for other organizers. `allowed` lists the decisions the state machine accepts now.
  return parse(workspace, await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/committee`, { signal }), "Data panitia tidak dapat dibaca.");
}

export async function saveOpening(eventId: string, input: CommitteeOpeningInput): Promise<CommitteeOpening> {
  // TODO(backend): PUT /api/events/:id/committee/opening JSON {description,divisions:[name],question|null,stages:[{id|null,name}],open} -> 200 CommitteeOpening. Event owner only. Errors: 404, 422 {fields:{description,divisions,question,stages}}. `stages` is an ordered list of 0 to 5 organizer-defined steps; send back existing ids so applicants keep their place. Removing a stage that still holds applicants is a 422 on `stages`.
  return parse(opening, await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/committee/opening`, { method: "PUT", body: input }), "Lowongan belum dapat dikonfirmasi.");
}

export async function decideApplication(eventId: string, applicationId: string, input: DecisionInput): Promise<ApplicantView> {
  // TODO(backend): POST /api/events/:id/committee/applications/:applicationId/decision JSON {to,note|null} -> 200 ApplicantView. `to` is a stage id, ACCEPTED, or REJECTED. Only moves in the state machine (SUBMITTED to the first stage or REJECTED, or to ACCEPTED when the opening has no stages; a stage to the next stage, ACCEPTED, or REJECTED), else 409. ACCEPTED needs a note. Creates a notification for the applicant.
  return parse(applicant, await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/committee/applications/${encodeURIComponent(applicationId)}/decision`, { method: "POST", body: input }), "Keputusan belum dapat dikonfirmasi.");
}
