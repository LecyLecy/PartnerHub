import { z } from "zod";
import { ApiError, apiRequest } from "./api-client";
import type { NotificationItem } from "@/contracts/participation";

const schema = z.object({ items: z.array(z.object({ id: z.string().min(1), title: z.string().max(120), body: z.string().max(500), createdAt: z.iso.datetime({ offset: true }), read: z.boolean() })).max(200) });

export async function listNotifications(_key: string, signal: AbortSignal): Promise<NotificationItem[]> {
  // TODO(backend): GET /api/me/notifications -> 200 {items:[{id,title,body,createdAt,read}]}, newest first, current account only. 401 signed out, 403 when the account is not approved.
  const result = schema.safeParse(await apiRequest<unknown>("/api/me/notifications", { signal }));
  if (!result.success) throw new ApiError("Notifikasi tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data.items;
}
