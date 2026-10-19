import { z } from "zod";
import { ApiError, apiRequest } from "@/lib/api-client";
import type { MyRegistration, MyRegistrationDetail, QrDelivery, Registrant, RegistrantBoard, RegistrationAnswers, RegistrationDecision, RegistrationForm, RegistrationFormInput, TicketQr } from "@/contracts/participation";

const schema = z.object({
  id: z.string().min(1), ticketReference: z.string().regex(/^[A-Z0-9-]{6,40}$/), status: z.enum(["PENDING", "REGISTERED", "REJECTED", "CANCELLED"]), note: z.string().max(200).nullable().default(null),
  createdAt: z.iso.datetime({ offset: true }), qrIssued: z.boolean().default(false), qrEnabled: z.boolean().default(false), priceIdr: z.number().int().min(0).default(0),
  event: z.object({ id: z.string().min(1), title: z.string().max(100), startsAt: z.iso.datetime({ offset: true }).nullable(), venue: z.string().max(150) }),
});
const answerSchema = z.object({ fieldId: z.string(), label: z.string().max(100), type: z.enum(["text", "longtext", "choice", "image"]), value: z.string().max(3_000_000) });

export async function getMyRegistration(id: string, signal: AbortSignal): Promise<MyRegistrationDetail> {
  // TODO(backend): GET /api/me/registrations/:id -> MyRegistrationDetail. Current participant only, 404 for foreign IDs. Snapshot answers/proof only; never QR secrets. Use Cache-Control: no-store.
  const result = schema.extend({ answers: z.array(answerSchema).max(10) }).safeParse(await apiRequest<unknown>(`/api/me/registrations/${encodeURIComponent(id)}`, { signal }));
  if (!result.success) throw new ApiError("Detail pendaftaran tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data;
}

export async function listMyRegistrations(_key: string, signal: AbortSignal): Promise<MyRegistration[]> {
  // TODO(backend): GET /api/me/registrations -> 200 {items:[{id,ticketReference,status,createdAt,event:{id,title,startsAt,venue}}]}. Current account only. ticketReference is display-safe and opaque; the QR secret is never returned here. 401 signed out, 403 for other roles.
  const result = z.object({ items: z.array(schema).max(500) }).safeParse(await apiRequest<unknown>("/api/me/registrations", { signal }));
  if (!result.success) throw new ApiError("Daftar tiket tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data.items;
}

export async function joinEvent(eventId: string, answers: RegistrationAnswers = {}): Promise<MyRegistration> {
  // TODO(backend): POST /api/public/events/:id/registrations, {answers:{[fieldId]:string}} -> 201 MyRegistration. Server validates every answer against the organizer form of that event (required, type, choice membership, image URL from the registration-images upload), then checks published state, registration window, capacity and one active registration per account in one transaction. Errors: 404, 409 code ALREADY_REGISTERED or EVENT_FULL, 422 {fields:{[fieldId]:message}}, 403, 429.
  try {
    const result = schema.safeParse(await apiRequest<unknown>(`/api/public/events/${encodeURIComponent(eventId)}/registrations`, { method: "POST", body: { answers, consent: true } }));
    if (!result.success) throw new ApiError("Pendaftaran belum dapat dikonfirmasi.", 0, "INVALID_RESPONSE");
    return result.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && error.code === "ALREADY_REGISTERED") throw new ApiError("Kamu sudah terdaftar di acara ini.", 409, error.code);
    if (error instanceof ApiError && error.status === 409 && error.code === "EVENT_FULL") throw new ApiError("Kapasitas acara ini sudah penuh.", 409, error.code);
    throw error;
  }
}

/** Payload is `PH1.` followed by an opaque secret. The secret is random and holds no personal data, so it is safe to draw as a QR. */
const payloadSchema = z.object({ payload: z.string().regex(/^PH1\.[A-Za-z0-9_-]{16,96}$/) });

export async function getTicketQr(registrationId: string): Promise<TicketQr> {
  // TODO(backend): GET /api/me/registrations/:id/qr -> 200 {payload:"PH1.<secret>"}. Current account and REGISTERED only. 409 code QR_NOT_SENT until the organizer has sent codes. The server stores only a hash of the secret, never logs the payload, and sends Cache-Control: no-store.
  try {
    const result = payloadSchema.safeParse(await apiRequest<unknown>(`/api/me/registrations/${encodeURIComponent(registrationId)}/qr`));
    if (!result.success) throw new ApiError("QR belum dapat dibaca.", 0, "INVALID_RESPONSE");
    return result.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && error.code === "QR_NOT_SENT") throw new ApiError("Penyelenggara belum mengirim QR untuk acara ini.", 409, error.code);
    throw error;
  }
}

const deliverySchema = z.object({ eventTitle: z.string().max(100), eventPublished: z.boolean(), registered: z.number().int().min(0), issued: z.number().int().min(0) });

export async function getQrDelivery(eventId: string, signal?: AbortSignal): Promise<QrDelivery> {
  // TODO(backend): GET /api/events/:id/qr -> 200 {eventTitle,eventPublished,registered,issued}. Event owner only, 404 for other organizers. `issued` counts active registrations that already have a code.
  const result = deliverySchema.safeParse(await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/qr`, { signal }));
  if (!result.success) throw new ApiError("Status QR tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data;
}

export async function sendQr(eventId: string): Promise<QrDelivery> {
  // TODO(backend): POST /api/events/:id/qr/send, {} -> 200 same shape. Event owner only, published events only (409 NOT_PUBLISHED). Issues a code to every active registration that has none, is safe to repeat, and notifies each participant. Secrets are generated server-side.
  const result = deliverySchema.safeParse(await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/qr/send`, { method: "POST", body: {} }));
  if (!result.success) throw new ApiError("Pengiriman QR belum dapat dikonfirmasi.", 0, "INVALID_RESPONSE");
  return result.data;
}
const fieldSchema = z.object({ id: z.string().min(1), label: z.string().max(100), type: z.enum(["text", "longtext", "choice", "image"]), required: z.boolean(), hint: z.string().max(200).nullable(), options: z.array(z.string().max(60)).max(8) });
const formSchema = z.object({ eventTitle: z.string().max(100), priceIdr: z.number().int().min(0), paymentNote: z.string().max(400).nullable(), fields: z.array(fieldSchema).max(10), isDefault: z.boolean() });

export async function getRegistrationForm(eventId: string, signal?: AbortSignal): Promise<RegistrationForm> {
  // TODO(backend): GET /api/public/events/:id/registration-form (participants, published events) and GET /api/events/:id/registration-form (owner) -> RegistrationForm. An event without a saved form returns the default form, free, isDefault true.
  const result = formSchema.safeParse(await apiRequest<unknown>(`/api/public/events/${encodeURIComponent(eventId)}/registration-form`, { signal }));
  if (!result.success) throw new ApiError("Form pendaftaran tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data;
}

export async function getOwnRegistrationForm(eventId: string, signal?: AbortSignal): Promise<RegistrationForm> {
  const result = formSchema.safeParse(await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/registration-form`, { signal }));
  if (!result.success) throw new ApiError("Form pendaftaran tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data;
}

export async function saveRegistrationForm(eventId: string, input: RegistrationFormInput): Promise<RegistrationForm> {
  // TODO(backend): PUT /api/events/:id/registration-form JSON RegistrationFormInput -> 200 RegistrationForm. Owner only. 0 to 10 questions, price 0 to 10.000.000 IDR (integer), a priced event needs a payment note and one image question. Errors: 404, 422 {fields:{priceIdr,paymentNote,fields,field0...}}. PartnerHub stores the price for display only and never charges it.
  const result = formSchema.safeParse(await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/registration-form`, { method: "PUT", body: input }));
  if (!result.success) throw new ApiError("Form pendaftaran belum dapat dikonfirmasi.", 0, "INVALID_RESPONSE");
  return result.data;
}

export async function uploadRegistrationImage(eventId: string, file: Blob, name: string): Promise<string> {
  // TODO(backend): POST /api/public/events/:id/registration-images multipart {file} -> {url}. Participants only, raster images (PNG, JPG, WebP), max 2 MB, re-encoded server-side, scoped URL visible only to the event owner and the uploader. Images are personal data (payment proof): no public URL, no logging.
  const body = new FormData();
  body.set("file", file, name);
  const result = z.object({ url: z.string().refine((url) => /^\/(?!\/)/.test(url) || /^https:\/\//.test(url) || /^data:image\/(png|jpeg|webp);base64,/.test(url)) }).safeParse(await apiRequest<unknown>(`/api/public/events/${encodeURIComponent(eventId)}/registration-images`, { method: "POST", body }));
  if (!result.success) throw new ApiError("Gambar belum dapat dikonfirmasi.", 0, "INVALID_RESPONSE");
  return result.data.url;
}

const registrantSchema = z.object({
  eventTitle: z.string().max(100), priceIdr: z.number().int().min(0), qrEnabled: z.boolean().default(false),
  items: z.array(z.object({
    id: z.string().min(1), name: z.string().max(120), ticketReference: z.string().max(40), status: z.enum(["PENDING", "REGISTERED", "REJECTED", "CANCELLED"]), note: z.string().max(200).nullable().default(null), createdAt: z.iso.datetime({ offset: true }), qrIssued: z.boolean(),
    checkedInAt: z.iso.datetime({ offset: true }).nullable().default(null),
    answers: z.array(answerSchema).max(10),
  })).max(5000),
});

export async function getRegistrants(eventId: string, signal?: AbortSignal): Promise<RegistrantBoard> {
  // TODO(backend): GET /api/events/:id/registrants -> RegistrantBoard. Owner only. Shares display name, ticket reference, status, and the answers to that event's own form. Never the email or phone.
  const result = registrantSchema.safeParse(await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/registrants`, { signal }));
  if (!result.success) throw new ApiError("Daftar peserta tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data;
}

export async function decideRegistrant(eventId: string, registrationId: string, input: RegistrationDecision): Promise<Registrant> {
  // TODO(backend): POST /api/events/:id/registrants/:registrationId/decision {decision:"CONFIRM"|"REJECT", note?} -> 200 Registrant. Owner only. Allowed only from PENDING (409 NOT_PENDING otherwise). CONFIRM rechecks capacity (409 EVENT_FULL). REJECT stores an optional reason (max 200) and notifies the participant, who may register again. Payment proof images are personal data: owner and uploader only, no public URL, no logging.
  const body = await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/registrants/${encodeURIComponent(registrationId)}/decision`, { method: "POST", body: input });
  const result = registrantSchema.shape.items.element.safeParse(body);
  if (!result.success) throw new ApiError("Keputusan belum dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data;
}
