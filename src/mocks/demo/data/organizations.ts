import type { SponsorMatchingProfile } from "@/contracts/matching";
import type { DemoMediaKey } from "./media";
import type { demoPeople } from "./people";

export const demoOrganizations = {
  "demo-organizer": { name: "Ruang Tumbuh Collective", city: "Bandung" },
  "demo-other-organizer": { name: "Aksara Kota", city: "Jakarta" },
  "demo-pending": { name: "Jejak Muda", city: "Yogyakarta" },
} as const;

type SponsorFixture = { id: keyof typeof demoPeople; companyName: string; image: DemoMediaKey; profile: SponsorMatchingProfile };
/** Fictional organizations. Photos illustrate their sectors, not their registered brands. */
export const demoSponsors: SponsorFixture[] = [
  { id: "demo-sponsor", companyName: "Lentera Sagara Teknologi", image: "design", profile: { industry: "Teknologi", fields: ["Teknologi", "Pendidikan"] } },
  { id: "demo-sponsor-education", companyName: "Aksara Muda Institute", image: "library", profile: { industry: "Pendidikan", fields: ["Pendidikan", "Teknologi"] } },
  { id: "demo-sponsor-media", companyName: "Kanvas Reka Studio", image: "photography", profile: { industry: "Media & hiburan", fields: ["Seni & desain", "Media & hiburan"] } },
  { id: "demo-sponsor-food", companyName: "Racik Rasa Sehat", image: "food", profile: { industry: "Makanan & minuman", fields: ["Makanan & minuman", "Kesehatan"] } },
  { id: "demo-sponsor-green", companyName: "Bumi Lestari Energi", image: "volunteers", profile: { industry: "Energi & manufaktur", fields: ["Lingkungan & sosial"] } },
  { id: "demo-sponsor-finance", companyName: "Arunika Finansial", image: "finance", profile: { industry: "Keuangan & perbankan", fields: ["Keuangan & perbankan", "Pendidikan"] } },
];
