import { z } from "zod";
import { ApiError, apiRequest } from "@/lib/api-client";
import type { Asset, AssetSlot, EventInput, EventList, EventRecord } from "@/contracts/event";
import type { OrganizerSummary } from "@/contracts/participation";
const safeUrl = z.string().refine((url) => /^\/(?!\/)/.test(url) || /^https:\/\//.test(url) || (process.env.NEXT_PUBLIC_PARTNERHUB_DEMO === "1" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(url)));
const assetSchema = z.object({ id: z.string().min(1), url: safeUrl, name: z.string().max(255) });
const date = z.iso.datetime({ offset: true }).nullable();
const recordSchema = z.object({
  id:z.string().regex(/^[a-zA-Z0-9_-]+$/), title:z.string().min(3).max(100), category:z.enum(["Seminar & diskusi","Workshop","Kegiatan komunitas"]), summary:z.string().max(500), startsAt:date, endsAt:date, timezone:z.literal("Asia/Jakarta"), venue:z.string().max(150), capacity:z.number().int().min(1).max(100000).nullable(), registrationOpensAt:date, registrationClosesAt:date,
  modules:z.object({registration:z.boolean(),committee:z.boolean(),attendance:z.boolean(),sponsorship:z.boolean()}),
  branding:z.object({organizationName:z.string().max(100),eventLogo:assetSchema.nullable(),organizationLogo:assetSchema.nullable(),sponsors:z.array(z.object({id:z.string().min(1),name:z.string().max(100),logo:assetSchema.nullable()})).max(6)}),
  status:z.enum(["DRAFT","PUBLISHED","CLOSED","ARCHIVED"]), revision:z.string().min(1),updatedAt:z.iso.datetime({offset:true}),
});
function recordValue(value:unknown):EventRecord { const result=recordSchema.safeParse(value); if(!result.success) throw new ApiError("Data event tidak dapat dibaca. Coba muat ulang.",0,"INVALID_RESPONSE"); return result.data; }
export async function listEvents(_key:string,signal:AbortSignal):Promise<EventList> {
  // TODO(backend): GET /api/events -> {items:EventRecord[]}; return only events authorized for current account, no fixture counts.
  const result=z.object({items:z.array(recordSchema)}).safeParse(await apiRequest<unknown>("/api/events",{signal}));
  if(!result.success) throw new ApiError("Daftar event tidak dapat dibaca.",0,"INVALID_RESPONSE"); return result.data;
}
export async function getOrganizerSummary(_key:string,signal:AbortSignal):Promise<OrganizerSummary> {
  // TODO(backend): GET /api/organizer/summary -> 200 {events:[{eventId,title,status,registered,capacity,applications,sponsors}]}; applications counts committee applications, sponsors counts accepted sponsor requests and proposals for the event. Events owned by the signed-in organizer only; registered excludes cancelled registrations. 403 for other roles or an organizer not yet approved.
  const result=z.object({events:z.array(z.object({eventId:z.string().min(1),title:z.string().max(100),status:z.enum(["DRAFT","PUBLISHED","CLOSED","ARCHIVED"]),registered:z.number().int().min(0),capacity:z.number().int().min(1).nullable(),applications:z.number().int().min(0).default(0),sponsors:z.number().int().min(0).default(0)})).max(500)}).safeParse(await apiRequest<unknown>("/api/organizer/summary",{signal}));
  if(!result.success) throw new ApiError("Ringkasan pendaftar tidak dapat dibaca.",0,"INVALID_RESPONSE"); return result.data;
}
export async function getEvent(id:string,signal?:AbortSignal):Promise<EventRecord> {
  // TODO(backend): GET /api/events/:id -> EventRecord; authorize membership, 404/403 for inaccessible records.
  const record = recordValue(await apiRequest<unknown>(`/api/events/${encodeURIComponent(id)}`,{signal}));
  if (record.id !== id) throw new ApiError("Identitas event pada respons tidak cocok.",0,"INVALID_RESPONSE");
  return record;
}
export async function createEvent(input:EventInput,key:string):Promise<EventRecord> {
  // TODO(backend): POST /api/events, EventInput -> EventRecord(DRAFT); Idempotency-Key prevents duplicate creation on retries.
  const record = recordValue(await apiRequest<unknown>("/api/events",{method:"POST",body:input,headers:{"Idempotency-Key":key}}));
  if (record.status !== "DRAFT") throw new ApiError("Pembuatan draft belum dapat dikonfirmasi.",0,"INVALID_RESPONSE");
  return record;
}
export async function updateEvent(id:string,revision:string,input:EventInput):Promise<EventRecord> {
  // TODO(backend): PATCH /api/events/:id, {revision,...EventInput} -> EventRecord; reject stale revisions with 409, never arbitrary status replacement.
  const record = recordValue(await apiRequest<unknown>(`/api/events/${encodeURIComponent(id)}`,{method:"PATCH",body:{...input,revision}}));
  if (record.id !== id || record.status !== "DRAFT") throw new ApiError("Perubahan draft belum dapat dikonfirmasi.",0,"INVALID_RESPONSE");
  return record;
}
export async function uploadAsset(id:string,slot:AssetSlot,file:Blob,name:string,key:string):Promise<Asset> {
  // TODO(backend): POST /api/events/:id/assets, multipart {slot,file} -> Asset; authorize/decode/normalize raster, server limits, scoped URLs, idempotency.
  const body=new FormData(); body.set("slot",slot);body.set("file",file,name);
  const result=assetSchema.safeParse(await apiRequest<unknown>(`/api/events/${encodeURIComponent(id)}/assets`,{method:"POST",body,headers:{"Idempotency-Key":key}}));
  if(!result.success) throw new ApiError("Logo belum dapat dikonfirmasi oleh layanan.",0,"INVALID_RESPONSE"); return result.data;
}

export async function transitionEvent(id: string, revision: string, action: "publish" | "close" | "archive"): Promise<EventRecord> {
  return recordValue(await apiRequest<unknown>(`/api/events/${encodeURIComponent(id)}/lifecycle`, { method: "POST", body: { revision, action } }));
}
