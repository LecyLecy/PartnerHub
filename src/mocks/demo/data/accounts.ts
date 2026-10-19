import type { DemoAccount } from "../types";
import { demoPeople } from "./people";
import { demoOrganizations, demoSponsors } from "./organizations";
import { demoMedia } from "./media";

export function createAccounts(submittedAt: string, pendingAt: string): DemoAccount[] {
  const account = (id: keyof typeof demoPeople, role: DemoAccount["role"], description: string, overrides: Partial<DemoAccount> = {}): DemoAccount => ({
    id, email: demoPeople[id].email, fullName: demoPeople[id].name, role, description,
    status: "active", emailVerified: true, onboardingComplete: true, seeded: true, submittedAt, summary: [], documents: [], ...overrides,
  });
  const organizer = (id: keyof typeof demoOrganizations, description: string, overrides: Partial<DemoAccount> = {}) => account(id, "organizer", description, {
    summary: [{ label: "Organisasi", value: demoOrganizations[id].name }, { label: "Kota", value: demoOrganizations[id].city }], ...overrides,
  });
  const sponsors = demoSponsors.map(sponsor => account(sponsor.id, "sponsor", "Perusahaan fiktif untuk simulasi pencarian sponsor dan pengelolaan proposal.", {
    imageUrl: demoMedia[sponsor.image].path,
    summary: [{ label: "Perusahaan", value: sponsor.companyName }, { label: "Industri", value: sponsor.profile.industry }],
  }));
  return [
    account("demo-user", "user", "Peserta dengan tiket, pendaftaran, dan lamaran panitia."),
    organizer("demo-organizer", "Penyelenggara dengan lima acara dan data pendaftaran."),
    sponsors[0],
    organizer("demo-pending", "Komunitas yang menunggu pemeriksaan dokumen.", { status: "pending_verification", submittedAt: pendingAt, documents: [{ label: "Surat pengantar komunitas (contoh)", name: "surat-pengantar-jejak-muda.pdf" }] }),
    ...sponsors.slice(1),
    organizer("demo-other-organizer", "Komunitas literasi dan pengembangan keterampilan."),
    ...(["demo-registrant-1", "demo-registrant-2", "demo-registrant-3", "demo-applicant-2", "demo-applicant-3"] as const).map(id => account(id, "user", "Peserta kegiatan komunitas dan pengembangan keterampilan.")),
  ];
}
