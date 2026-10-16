import type { EventReport } from "@/contracts/event-report";
import { apiRequest } from "@/lib/api-client";

export const getEventReport = (id: string, signal?: AbortSignal) => apiRequest<EventReport>(`/api/events/${encodeURIComponent(id)}/report`, { signal });
export const addBenefit = (id: string, sponsorshipId: string, label: string) => apiRequest(`/api/events/${encodeURIComponent(id)}/benefits`, { method: "POST", body: { sponsorshipId, label } });
export const saveEvidence = (id: string, benefitId: string, evidenceUrl: string, verified: boolean) => apiRequest(`/api/events/${encodeURIComponent(id)}/benefits/${encodeURIComponent(benefitId)}`, { method: "PATCH", body: { evidenceUrl, verified } });
