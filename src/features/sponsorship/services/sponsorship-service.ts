import { z } from "zod";
import { ApiError, apiRequest } from "@/lib/api-client";
import type { Proposal, ProposalInput, Sponsorship } from "@/contracts/participation";

const proposal = z.object({
  id: z.string().min(1), eventId: z.string().min(1), eventTitle: z.string().max(100), category: z.string().max(60), offer: z.string().max(1000),
  amountLabel: z.string().max(60).nullable(), status: z.enum(["SENT", "IN_REVIEW", "ACCEPTED", "DECLINED"]), createdAt: z.iso.datetime({ offset: true }),
});
const sponsorship = z.object({
  id: z.string().min(1), eventId: z.string().min(1), eventTitle: z.string().max(100), packageName: z.string().max(100),
  benefits: z.array(z.object({ id: z.string().min(1), label: z.string().max(200), status: z.enum(["PLANNED", "VERIFIED"]) })).max(50),
});

export async function listProposals(_key: string, signal: AbortSignal): Promise<Proposal[]> {
  // TODO(backend): GET /api/sponsor/proposals -> 200 {items:[{id,eventId,eventTitle,category,offer,amountLabel,status,createdAt}]}. Proposals of the signed-in sponsor only. 403 for other roles or an account not yet approved.
  const result = z.object({ items: z.array(proposal).max(500) }).safeParse(await apiRequest<unknown>("/api/sponsor/proposals", { signal }));
  if (!result.success) throw new ApiError("Daftar proposal tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data.items;
}

export async function createProposal(input: ProposalInput): Promise<Proposal> {
  // TODO(backend): POST /api/sponsor/proposals, JSON {eventId,category,offer,amountLabel|null} -> 201 Proposal with status "SENT". Approved sponsor accounts only; event must be PUBLISHED. Errors: 404, 403, 422 {fields:{offer}}, 429.
  const result = proposal.safeParse(await apiRequest<unknown>("/api/sponsor/proposals", { method: "POST", body: input }));
  if (!result.success) throw new ApiError("Proposal belum dapat dikonfirmasi.", 0, "INVALID_RESPONSE");
  return result.data;
}

export async function listSponsorships(_key: string, signal: AbortSignal): Promise<Sponsorship[]> {
  // TODO(backend): GET /api/sponsor/sponsorships -> 200 {items:[{id,eventId,eventTitle,packageName,benefits:[{id,label,status}]}]}. Agreements of the signed-in sponsor only. Benefit status becomes VERIFIED only after organizer review.
  const result = z.object({ items: z.array(sponsorship).max(200) }).safeParse(await apiRequest<unknown>("/api/sponsor/sponsorships", { signal }));
  if (!result.success) throw new ApiError("Daftar sponsorship tidak dapat dibaca.", 0, "INVALID_RESPONSE");
  return result.data.items;
}
