import { z } from "zod";

/** Current single-event and annual account prices. Historical amounts never change. */
export const packageTiers = {
  STARTER: { name: "Starter", singlePrice: 149000, annualPrice: 699000, participants: 300, managers: 3 },
  GROWTH: { name: "Growth", singlePrice: 499000, annualPrice: 1499000, participants: 1500, managers: 10 },
} as const;
export type PackageTier = keyof typeof packageTiers;
export type PackageOrder = { id: string; ownerId: string; eventId: string; tier: PackageTier; cycle: "SINGLE"; amountIdr: number; upgrade: boolean; status: "PENDING" | "SUCCEEDED" | "EXPIRED"; createdAt: string; expiresAt: string; verifiedAt: string | null; simulated: true };
/** Read-only history from the removed organization model, never an activation input. */
export type HistoricalOrder = { id: string; eventId: string | null; tier: PackageTier; cycle: "SINGLE" | "ANNUAL"; amountIdr: number; status: PackageOrder["status"]; createdAt: string; verifiedAt: string | null };
export type SubscriptionOrder = Omit<PackageOrder, "eventId" | "cycle" | "upgrade"> & { eventId: null; cycle: "ANNUAL"; upgrade: false };
export type AccountSubscription = { id: string; ownerId: string; tier: PackageTier; orderId: string; startsAt: string; endsAt: string };
export type EventCoverage = { tier: PackageTier; source: "SINGLE" | "SUBSCRIPTION" | "LEGACY"; orderId: string | null; subscriptionId?: string };
export type EventPackage = {
  ownerId: string; owner: boolean; coverage: EventCoverage | null;
  canPublish: boolean; readOnly: boolean; serviceEndsAt: string | null;
  participantLimit: number | null; managerLimit: number | null;
  managers: { id: string; name: string; email: string }[]; managerIds: string[]; message: string;
};
export type BillingBoard = {
  orders: PackageOrder[]; history: HistoricalOrder[];
  subscriptionOrders: SubscriptionOrder[]; subscription: AccountSubscription | null;
  events: { id: string; title: string; status: string }[];
};
const id = z.string().min(1);
const date = z.iso.datetime({ offset: true });
const count = z.number().int().nonnegative();
const tier = z.enum(["STARTER", "GROWTH"]);
const orderStatus = z.enum(["PENDING", "SUCCEEDED", "EXPIRED"]);
const coverageSchema = z.object({ tier, source: z.enum(["SINGLE", "SUBSCRIPTION", "LEGACY"]), orderId: id.nullable(), subscriptionId: id.optional() });
export const packageOrderSchema: z.ZodType<PackageOrder> = z.object({ id, ownerId: id, eventId: id, tier, cycle: z.literal("SINGLE"), amountIdr: count, upgrade: z.boolean(), status: orderStatus, createdAt: date, expiresAt: date, verifiedAt: date.nullable(), simulated: z.literal(true) });
export const subscriptionOrderSchema: z.ZodType<SubscriptionOrder> = z.object({ id, ownerId: id, eventId: z.null(), tier, cycle: z.literal("ANNUAL"), amountIdr: count, upgrade: z.literal(false), status: orderStatus, createdAt: date, expiresAt: date, verifiedAt: date.nullable(), simulated: z.literal(true) });
const accountSubscriptionSchema: z.ZodType<AccountSubscription> = z.object({ id, ownerId: id, tier, orderId: id, startsAt: date, endsAt: date });
export const eventPackageSchema: z.ZodType<EventPackage> = z.object({ ownerId: id, owner: z.boolean(), coverage: coverageSchema.nullable(), canPublish: z.boolean(), readOnly: z.boolean(), serviceEndsAt: date.nullable(), participantLimit: count.nullable(), managerLimit: count.nullable(), managers: z.array(z.object({ id, name: z.string(), email: z.string() })), managerIds: z.array(id), message: z.string() });
export const billingBoardSchema: z.ZodType<BillingBoard> = z.object({
  orders: z.array(packageOrderSchema),
  subscriptionOrders: z.array(subscriptionOrderSchema).default([]), subscription: accountSubscriptionSchema.nullable().default(null),
  history: z.array(z.object({ id, eventId: id.nullable(), tier, cycle: z.enum(["SINGLE", "ANNUAL"]), amountIdr: count, status: orderStatus, createdAt: date, verifiedAt: date.nullable() })),
  events: z.array(z.object({ id, title: z.string(), status: z.string() })),
});
