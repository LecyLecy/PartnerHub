import type { MatchingField } from "@/contracts/matching";

/** Same rule in both directions. No random scores, model calls, or popularity weighting. */
export function sharedMatchingFields(eventFields: readonly MatchingField[], sponsorFields: readonly string[]): MatchingField[] {
  const sponsor = new Set(sponsorFields);
  return [...new Set(eventFields)].filter(field => field !== "Lainnya" && sponsor.has(field));
}
