import { apiRequest } from "./api-client";
import { eventPackageSchema } from "@/contracts/billing";
export const getEventPackage = async (id: string, signal?: AbortSignal) => eventPackageSchema.parse(await apiRequest<unknown>(`/api/events/${encodeURIComponent(id)}/package`, { signal }));
