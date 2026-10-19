import { ApiError } from "@/lib/api-client";
import { packageTiers, type BillingBoard, type EventPackage, type PackageOrder, type PackageTier, type AccountSubscription, type SubscriptionOrder, type EventCoverage } from "@/contracts/billing";
import type { DemoDb, OwnedEvent } from "./types";

const DAY = 86400000;
const reject = (message: string, code: string, status = 409): never => { throw new ApiError(message, status, code); };
const next = (db: DemoDb, prefix: string) => `${prefix}-${++db.counter}`;
const iso = (time = Date.now()) => new Date(time).toISOString();

/** One-time additive migration. The old billing object stays untouched as read-only history. */
export function billingOf(db: DemoDb) {
  if (db.eventBilling) return db.eventBilling;
  const billing = db.eventBilling = { version: 1 as const, orders: [] as PackageOrder[], coverage: {} as NonNullable<DemoDb["eventBilling"]>["coverage"], managers: {} as Record<string, string[]> };
  const legacy = db.billing;
  for (const event of db.events) {
    billing.managers[event.id] = [...new Set([event.ownerId, ...(legacy?.managers[event.id] ?? [])])];
    const old = legacy?.coverage[event.id];
    if (old?.source === "SINGLE" || event.status !== "DRAFT") billing.coverage[event.id] = {
      tier: old?.tier ?? "GROWTH", source: old?.source === "SINGLE" ? "SINGLE" : "LEGACY", orderId: old?.orderId ?? null,
    };
  }
  for (const order of legacy?.orders ?? []) {
    if (order.cycle !== "SINGLE" || !order.eventId) continue;
    const event = db.events.find(event => event.id === order.eventId);
    const ownerId = legacy?.organizations.find(org => org.id === order.organizationId)?.ownerId;
    if (event && ownerId === event.ownerId) billing.orders.push({ id: order.id, ownerId, eventId: event.id, tier: order.tier, cycle: "SINGLE", amountIdr: order.amountIdr, upgrade: order.upgrade, status: order.status, createdAt: order.createdAt, expiresAt: order.expiresAt, verifiedAt: order.verifiedAt, simulated: true });
  }
  return billing;
}
export function canManageEvent(db: DemoDb, event: OwnedEvent, accountId: string): boolean {
  return event.ownerId === accountId || Boolean(billingOf(db).managers[event.id]?.includes(accountId));
}
export function bindEvent(db: DemoDb, event: OwnedEvent) { billingOf(db).managers[event.id] = [event.ownerId]; }
function activeSubscription(db: DemoDb, ownerId: string): AccountSubscription | null {
  return db.accountBilling?.subscriptions.find(item => item.ownerId === ownerId && Date.parse(item.startsAt) <= Date.now() && Date.now() < Date.parse(item.endsAt)) ?? null;
}
function coverageFor(db: DemoDb, event: OwnedEvent): EventCoverage | null {
  const stored = billingOf(db).coverage[event.id];
  if (event.status !== "DRAFT") return stored ?? null;
  const subscription = activeSubscription(db, event.ownerId);
  if (!subscription) return stored?.source === "SUBSCRIPTION" ? null : stored ?? null;
  const count = new Set([event.ownerId, ...(billingOf(db).managers[event.id] ?? [])]).size;
  const limits = packageTiers[subscription.tier];
  const fits = Number.isInteger(event.capacity) && event.capacity! > 0 && event.capacity! <= limits.participants && count <= limits.managers && event.endsAt && Date.parse(event.endsAt) <= Date.parse(subscription.endsAt);
  // A paid event keeps its own rights unless the active subscription provides a higher tier.
  if (fits && (!stored || stored.source === "SUBSCRIPTION" || stored.tier === "STARTER" && subscription.tier === "GROWTH")) return { tier: subscription.tier, source: "SUBSCRIPTION", orderId: subscription.orderId, subscriptionId: subscription.id };
  return stored?.source === "SUBSCRIPTION" ? null : stored ?? null;
}
export function eventPackage(db: DemoDb, event: OwnedEvent): EventPackage {
  const billing = billingOf(db);
  const coverage = coverageFor(db, event);
  const limits = coverage ? packageTiers[coverage.tier] : null;
  const managerIds = [...new Set([event.ownerId, ...(billing.managers[event.id] ?? [])])];
  const serviceEndsAt = coverage && event.endsAt ? iso(Date.parse(event.endsAt) + 30 * DAY) : null;
  const readOnly = Boolean(serviceEndsAt && Date.now() >= Date.parse(serviceEndsAt));
  const withinLimits = Boolean(limits && Number.isInteger(event.capacity) && event.capacity! > 0 && event.capacity! <= limits.participants && managerIds.length <= limits.managers);
  const message = readOnly ? "Masa layanan selesai. Data dan tiket tetap tersimpan; laporan dapat dilihat dan diekspor."
    : limits && !Number.isInteger(event.capacity) ? "Paket acara sudah aktif. Lengkapi kapasitas peserta sebelum publikasi."
    : limits && !withinLimits ? `Batas ${limits.participants} peserta dan ${limits.managers} pengelola termasuk pemilik. Sesuaikan kapasitas atau upgrade paket.`
    : coverage?.source === "SUBSCRIPTION" ? "Tercakup subscription. Unggah acara tanpa pembayaran tambahan."
    : coverage ? "Paket acara sudah aktif. Tidak ada biaya paket tambahan untuk acara ini."
    : "Pilih paket untuk acara ini sebelum publikasi.";
  const owner = db.sessionAccountId === event.ownerId;
  return { ownerId: event.ownerId, owner, coverage, canPublish: !readOnly && withinLimits, readOnly, serviceEndsAt, participantLimit: limits?.participants ?? null, managerLimit: limits?.managers ?? null, managerIds,
    managers: owner ? managerIds.map(id => { const account = db.accounts.find(account => account.id === id); return { id, name: account?.fullName ?? "Pengelola", email: account?.email ?? "" }; }) : [],
    message };
}
export function assertEventWritable(db: DemoDb, event: OwnedEvent) {
  if (eventPackage(db, event).readOnly) reject("Masa layanan acara selesai. Laporan tetap dapat dibaca.", "EVENT_READ_ONLY");
}
export function publishWithPackage(db: DemoDb, event: OwnedEvent) {
  const view = eventPackage(db, event);
  if (!view.canPublish) reject(view.message, "PACKAGE_REQUIRED");
  if (view.coverage) billingOf(db).coverage[event.id] = view.coverage;
}
export function validatePackageEdit(db: DemoDb, event: OwnedEvent, input: { capacity: number | null; endsAt: string | null }) {
  const tier = coverageFor(db, { ...event, ...input })?.tier;
  if (tier && input.capacity !== null && input.capacity > packageTiers[tier].participants) reject("Kapasitas melebihi paket aktif. Upgrade paket terlebih dahulu.", "PACKAGE_CAPACITY");
}
export function participantLimit(db: DemoDb, event: OwnedEvent): number {
  return Math.min(event.capacity ?? Infinity, eventPackage(db, event).participantLimit ?? 0);
}
function organizer(db: DemoDb) {
  const account = db.accounts.find(account => account.id === db.sessionAccountId);
  if (!account) return reject("Masuk untuk melanjutkan.", "UNAUTHENTICATED", 401);
  if (account.role !== "organizer" || account.status !== "active" || !account.emailVerified) return reject("Akses hanya untuk penyelenggara aktif.", "FORBIDDEN", 403);
  return account;
}
function board(db: DemoDb, accountId: string): BillingBoard {
  const billing = billingOf(db);
  for (const order of billing.orders) if (order.status === "PENDING" && Date.parse(order.expiresAt) <= Date.now()) order.status = "EXPIRED";
  for (const order of db.accountBilling?.orders ?? []) if (order.status === "PENDING" && Date.parse(order.expiresAt) <= Date.now()) order.status = "EXPIRED";
  const ids = new Set(billing.orders.map(order => order.id));
  const legacy = db.billing;
  return { orders: billing.orders.filter(order => order.ownerId === accountId),
    subscriptionOrders: (db.accountBilling?.orders ?? []).filter(order => order.ownerId === accountId), subscription: activeSubscription(db, accountId),
    history: (legacy?.orders ?? []).filter(order => !ids.has(order.id) && legacy?.organizations.find(org => org.id === order.organizationId)?.ownerId === accountId).map(order => ({
      id: order.id, eventId: order.eventId, tier: order.tier, cycle: order.cycle, amountIdr: order.amountIdr, status: order.status, createdAt: order.createdAt, verifiedAt: order.verifiedAt,
    })),
    events: db.events.filter(event => event.ownerId === accountId).map(({ id, title, status }) => ({ id, title, status })) };
}
export function dispatchBilling(db: DemoDb, method: string, route: string, body: Record<string, unknown>): unknown {
  const account = organizer(db);
  const billing = billingOf(db);
  if (/^\/api\/organizer\/(workspaces|members)/.test(route) || route.endsWith("/duplicate")) return reject("Fitur ini tidak tersedia.", "FEATURE_REMOVED", 410);
  if (route === "/api/organizer/billing" && method === "GET") return board(db, account.id);
  if (route === "/api/organizer/subscription/orders" && method === "POST") {
    if (body.tier !== "STARTER" && body.tier !== "GROWTH") return reject("Pilih subscription yang tersedia.", "INVALID_PLAN", 422);
    if (activeSubscription(db, account.id)) return reject("Subscription masih aktif. Tidak ada tagihan subscription tambahan.", "SUBSCRIPTION_ACTIVE");
    const annual = db.accountBilling ??= { orders: [], subscriptions: [] };
    const pending = annual.orders.find(order => order.ownerId === account.id && order.tier === body.tier && order.status === "PENDING" && Date.parse(order.expiresAt) > Date.now());
    if (pending) return pending;
    const tier = body.tier;
    const order: SubscriptionOrder = { id: next(db, "subscription-order"), ownerId: account.id, eventId: null, tier, cycle: "ANNUAL", upgrade: false, amountIdr: packageTiers[tier].annualPrice, status: "PENDING", createdAt: iso(), expiresAt: iso(Date.now() + 30 * 60000), verifiedAt: null, simulated: true };
    annual.orders.push(order); return order;
  }
  const annualVerify = route.match(/^\/api\/organizer\/subscription\/orders\/([^/]+)\/verify-demo$/);
  if (annualVerify && method === "POST") {
    const annual = db.accountBilling;
    const order = annual?.orders.find(order => order.id === annualVerify[1] && order.ownerId === account.id);
    if (!annual || !order) return reject("Transaksi tidak ditemukan.", "NOT_FOUND", 404);
    if (order.status === "SUCCEEDED") return order;
    if (order.status === "EXPIRED" || Date.parse(order.expiresAt) <= Date.now()) { order.status = "EXPIRED"; return reject("Pesanan kedaluwarsa. Buat pesanan baru.", "ORDER_EXPIRED"); }
    if (body.confirmSimulation !== true) return reject("Konfirmasi pembayaran diperlukan.", "SIMULATION_REQUIRED", 422);
    if (activeSubscription(db, account.id)) return reject("Subscription sudah aktif.", "SUBSCRIPTION_ACTIVE");
    const start = new Date();
    const end = new Date(start);
    // Clamp leap-day renewals to the last day of February in the following year.
    end.setUTCFullYear(end.getUTCFullYear() + 1);
    if (end.getUTCMonth() !== start.getUTCMonth()) end.setUTCDate(0);
    annual.subscriptions.push({ id: next(db, "subscription"), ownerId: account.id, tier: order.tier, orderId: order.id, startsAt: start.toISOString(), endsAt: end.toISOString() });
    order.status = "SUCCEEDED"; order.verifiedAt = start.toISOString(); return order;
  }
  if (route === "/api/organizer/orders" && method === "POST") {
    if (body.tier !== "STARTER" && body.tier !== "GROWTH" || body.cycle !== undefined && body.cycle !== "SINGLE") return reject("Pilih paket per event yang tersedia.", "INVALID_PLAN", 422);
    const event = db.events.find(event => event.id === body.eventId && event.ownerId === account.id);
    if (!event) return reject("Pilih acara milikmu.", "EVENT_REQUIRED", 422);
    assertEventWritable(db, event);
    const tier = body.tier as PackageTier;
    const coverage = eventPackage(db, event).coverage;
    const upgrade = coverage?.source === "SINGLE" && coverage.tier === "STARTER" && tier === "GROWTH";
    if (coverage && !upgrade) return reject("Paket acara sudah aktif.", "ALREADY_COVERED");
    const existing = billing.orders.find(order => order.ownerId === account.id && order.eventId === event.id && order.tier === tier && order.upgrade === upgrade && order.status === "PENDING" && Date.parse(order.expiresAt) > Date.now());
    if (existing) return existing;
    const created: PackageOrder = { id: next(db, "package-order"), ownerId: account.id, eventId: event.id, tier, cycle: "SINGLE", amountIdr: upgrade ? 350000 : packageTiers[tier].singlePrice, upgrade, status: "PENDING", createdAt: iso(), expiresAt: iso(Date.now() + 30 * 60000), verifiedAt: null, simulated: true };
    billing.orders.push(created); return created;
  }
  const verify = route.match(/^\/api\/organizer\/orders\/([^/]+)\/verify-demo$/);
  if (verify && method === "POST") {
    const order = billing.orders.find(order => order.id === verify[1] && order.ownerId === account.id);
    if (!order) return reject("Transaksi tidak tersedia untuk diaktifkan.", "NOT_FOUND", 404);
    if (order.status === "SUCCEEDED") return order;
    if (order.status === "EXPIRED" || Date.parse(order.expiresAt) <= Date.now()) { order.status = "EXPIRED"; return reject("Pesanan kedaluwarsa. Buat pesanan baru.", "ORDER_EXPIRED"); }
    if (body.confirmSimulation !== true) return reject("Konfirmasi pembayaran diperlukan.", "SIMULATION_REQUIRED", 422);
    const event = db.events.find(event => event.id === order.eventId && event.ownerId === account.id);
    if (!event) return reject("Acara transaksi tidak ditemukan.", "NOT_FOUND", 404);
    assertEventWritable(db, event);
    const coverage = eventPackage(db, event).coverage;
    if (coverage && !(order.upgrade && coverage.source === "SINGLE" && coverage.tier === "STARTER" && order.tier === "GROWTH")) return reject("Acara sudah mempunyai paket aktif.", "ALREADY_COVERED");
    billing.coverage[event.id] = { tier: order.tier, source: "SINGLE", orderId: order.id };
    order.status = "SUCCEEDED"; order.verifiedAt = iso(); return order;
  }
  const match = route.match(/^\/api\/events\/([^/]+)\/(package|managers)$/);
  const event = db.events.find(event => event.id === match?.[1] && canManageEvent(db, event, account.id));
  if (!match || !event) return reject("Acara tidak ditemukan.", "NOT_FOUND", 404);
  if (match[2] === "package" && method === "GET") return eventPackage(db, event);
  if (match[2] === "managers" && method === "PUT") {
    if (event.ownerId !== account.id) return reject("Hanya pemilik acara dapat mengatur pengelola.", "OWNER_REQUIRED", 403);
    const view = eventPackage(db, event);
    const ids = Array.isArray(body.accountIds) ? body.accountIds : [];
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const invited = email ? db.accounts.find(item => item.email.toLowerCase() === email && item.role === "organizer" && item.status === "active" && item.emailVerified) : null;
    if (email && !invited) return reject("Gunakan email penyelenggara aktif yang sudah terdaftar.", "MEMBER_NOT_FOUND", 422);
    const unique = [...new Set([event.ownerId, ...ids, ...(invited ? [invited.id] : [])])];
    if (unique.some(id => typeof id !== "string" || !db.accounts.some(item => item.id === id && item.role === "organizer" && item.status === "active" && item.emailVerified))) return reject("Pengelola tidak valid.", "INVALID_MANAGER", 422);
    const additions = unique.some(id => !view.managerIds.includes(id as string));
    if (additions) {
      assertEventWritable(db, event);
      if (!view.managerLimit) return reject("Aktifkan paket acara sebelum menambah pengelola.", "PACKAGE_REQUIRED");
      if (unique.length > view.managerLimit) return reject(`Maksimal ${view.managerLimit} pengelola termasuk pemilik.`, "MANAGER_LIMIT", 422);
    }
    billing.managers[event.id] = unique as string[]; return eventPackage(db, event);
  }
  return reject("Tindakan tidak tersedia.", "NOT_FOUND", 404);
}
