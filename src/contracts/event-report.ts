export type EventReport = {
  eventId: string;
  eventTitle: string;
  registered: number;
  pending: number;
  applications: number;
  attended: number;
  sponsorships: { id: string; sponsorName: string; packageName: string; benefits: { id: string; label: string; status: "PLANNED" | "VERIFIED"; evidenceUrl?: string | null }[] }[];
};
