import { apiRequest } from "@/lib/api-client";
import { billingBoardSchema, packageOrderSchema, subscriptionOrderSchema, type PackageTier } from "@/contracts/billing";
export const getBilling = async (_key: string, signal?: AbortSignal) => billingBoardSchema.parse(await apiRequest<unknown>("/api/organizer/billing", { signal }));
export { getEventPackage as getPackage } from "@/lib/event-package";
export const createOrder = async (tier: PackageTier, eventId: string) => packageOrderSchema.parse(await apiRequest<unknown>("/api/organizer/orders", { method: "POST", body: { tier, eventId } }));
export const verifyDemoOrder = async (id: string) => packageOrderSchema.parse(await apiRequest<unknown>(`/api/organizer/orders/${encodeURIComponent(id)}/verify-demo`, { method: "POST", body: { confirmSimulation: true } }));
export const createSubscriptionOrder = async (tier: PackageTier) => subscriptionOrderSchema.parse(await apiRequest<unknown>("/api/organizer/subscription/orders", { method: "POST", body: { tier } }));
export const verifySubscriptionOrder = async (id: string) => subscriptionOrderSchema.parse(await apiRequest<unknown>(`/api/organizer/subscription/orders/${encodeURIComponent(id)}/verify-demo`, { method: "POST", body: { confirmSimulation: true } }));
