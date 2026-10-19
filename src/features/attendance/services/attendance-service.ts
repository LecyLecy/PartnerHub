import { z } from "zod";
import { ApiError, apiRequest } from "@/lib/api-client";
import type { AttendanceBoard, TicketScan } from "@/contracts/participation";

const participant = z.object({
  id: z.string().min(1), name: z.string().max(120), ticketReference: z.string().max(40),
  status: z.enum(["PENDING", "REGISTERED", "REJECTED", "CANCELLED"]), note: z.string().max(200).nullable(),
  createdAt: z.iso.datetime({ offset: true }), qrIssued: z.boolean(), checkedInAt: z.iso.datetime({ offset: true }).nullable(),
  checkedOutAt: z.iso.datetime({ offset: true }).nullable().optional(),
  answers: z.array(z.object({ fieldId: z.string(), label: z.string().max(100), type: z.enum(["text", "longtext", "choice", "image"]), value: z.string().max(3_000_000) })).max(10),
});
const board = z.object({ eventId: z.string(), eventTitle: z.string().max(100), attendanceEnabled: z.boolean(), canConfigure: z.boolean().default(false), canScan: z.boolean().default(false), attendanceMode: z.enum(["NONE", "ENTRY", "ENTRY_EXIT"]).optional(), items: z.array(participant).max(5000) });
const scan = z.object({ eventId: z.string(), eventTitle: z.string().max(100), participant, attendance: z.enum(["RECORDED", "ALREADY_RECORDED", "DISABLED", "EXIT_RECORDED", "ALREADY_EXIT_RECORDED"]) });
export async function configureAttendance(eventId: string, mode: "NONE" | "ENTRY" | "ENTRY_EXIT"): Promise<void> {
  await apiRequest(`/api/events/${encodeURIComponent(eventId)}/attendance`, { method: "POST", body: { mode } });
  window.dispatchEvent(new CustomEvent("partnerhub:attendance-changed", { detail: eventId }));
}

export async function getAttendance(eventId: string, signal?: AbortSignal): Promise<AttendanceBoard> {
  // TODO(backend): GET /api/events/:id/attendance, event owner only, 404 foreign event. Returns attendanceEnabled and checked-in registrants, no account contacts or ticket secrets.
  const result = board.safeParse(await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/attendance`, { signal }));
  if (!result.success || result.data.eventId !== eventId) throw new ApiError("Daftar hadir tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data;
}
export async function scanTicket(eventId: string, payload: string, direction: "ENTRY" | "EXIT" = "ENTRY"): Promise<TicketScan> {
  if (!/^PH1\.[a-zA-Z0-9]{24}$/.test(payload)) throw new ApiError("QR ini bukan tiket PartnerHub yang valid.", 422, "INVALID_TICKET");
  // TODO(backend): POST /api/events/:id/ticket-scans {payload}. Owner only. Resolve secret hash to REGISTERED issued ticket of this event, atomically record ENTRY once when enabled. Invalid/foreign codes disclose nothing; no payload logging.
  const result = scan.safeParse(await apiRequest<unknown>(`/api/events/${encodeURIComponent(eventId)}/ticket-scans`, { method: "POST", body: { payload, direction } }));
  if (!result.success || result.data.eventId !== eventId || result.data.participant.status !== "REGISTERED" || !result.data.participant.qrIssued || (result.data.attendance !== "DISABLED" && !result.data.participant.checkedInAt)) throw new ApiError("Hasil pengecekan tiket belum dapat dikonfirmasi.", 0, "INVALID_RESPONSE");
  return result.data;
}
