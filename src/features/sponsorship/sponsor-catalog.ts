import type { SponsorMatch } from "@/contracts/matching";

export function sponsorCatalog(items: SponsorMatch[], query: string, requestedPage: number) {
  const search = query.trim().toLocaleLowerCase("id-ID");
  const filtered = items.filter(item => `${item.companyName} ${item.industry} ${item.fields.join(" ")}`.toLocaleLowerCase("id-ID").includes(search));
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const page = Math.min(pages, Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1));
  return { items: filtered.slice((page - 1) * 6, page * 6), page, pages, total: filtered.length };
}
