import type { MatchingField } from "@/contracts/matching";
import type { OwnedEvent } from "../types";
import { demoMedia, type DemoMediaKey } from "./media";
import { demoOrganizations, demoSponsors } from "./organizations";

type EventFixture = {
  id: string; ownerId: "demo-organizer" | "demo-other-organizer"; title: string;
  category: OwnedEvent["category"]; days: number; venue: string; capacity: number | null;
  status: OwnedEvent["status"]; sponsors: string[]; summary: string; image: DemoMediaKey;
  priceIdr: number; fields: MatchingField[];
};
export const demoEvents: EventFixture[] = [
  { id: "demo-event-1", ownerId: "demo-organizer", title: "Seminar Kepemimpinan Mahasiswa", category: "Seminar & diskusi", days: 21, venue: "Auditorium Cakrawala, Bandung", capacity: 200, status: "PUBLISHED", sponsors: ["demo-sponsor", "demo-sponsor-education"], summary: "Diskusi tentang memimpin tim kecil, dari rapat pertama sampai laporan akhir.", image: "seminar", priceIdr: 35000, fields: ["Pendidikan"] },
  { id: "demo-event-2", ownerId: "demo-organizer", title: "Workshop Desain Poster Acara", category: "Workshop", days: 35, venue: "Studio Ruang Reka, Bandung", capacity: 40, status: "PUBLISHED", sponsors: ["demo-sponsor-media"], summary: "Praktik langsung menyusun poster dan materi promosi acara.", image: "design", priceIdr: 50000, fields: ["Seni & desain", "Media & hiburan"] },
  { id: "demo-event-3", ownerId: "demo-organizer", title: "Temu Komunitas Relawan", category: "Kegiatan komunitas", days: 60, venue: "Taman Sagara, Bandung", capacity: 120, status: "PUBLISHED", sponsors: [], summary: "Pertemuan relawan untuk berbagi pengalaman dan merancang kegiatan lingkungan bersama.", image: "volunteers", priceIdr: 25000, fields: ["Lingkungan & sosial"] },
  { id: "demo-event-4", ownerId: "demo-organizer", title: "Rencana Pelatihan Panitia", category: "Workshop", days: 90, venue: "", capacity: null, status: "DRAFT", sponsors: [], summary: "Pelatihan koordinasi tim dan pembagian tugas. Jadwal sedang disusun.", image: "teamwork", priceIdr: 40000, fields: ["Pendidikan"] },
  { id: "demo-event-5", ownerId: "demo-organizer", title: "Diskusi Akhir Tahun Lalu", category: "Seminar & diskusi", days: -40, venue: "Ruang Temu Cakrawala, Bandung", capacity: 80, status: "CLOSED", sponsors: ["demo-sponsor-education"], summary: "Refleksi kegiatan komunitas dan berbagi pelajaran pengelolaan acara.", image: "teamwork", priceIdr: 30000, fields: ["Pendidikan"] },
  { id: "demo-event-6", ownerId: "demo-other-organizer", title: "Festival Literasi Kota", category: "Kegiatan komunitas", days: 28, venue: "Rumah Baca Aksara, Jakarta", capacity: 300, status: "PUBLISHED", sponsors: ["demo-sponsor-education"], summary: "Hari literasi dengan lapak buku, sesi bercerita, dan ruang diskusi pembaca.", image: "library", priceIdr: 60000, fields: ["Pendidikan", "Media & hiburan"] },
  { id: "demo-event-7", ownerId: "demo-other-organizer", title: "Pelatihan Fotografi Dasar", category: "Workshop", days: 42, venue: "Studio Cahaya, Jakarta", capacity: 30, status: "PUBLISHED", sponsors: [], summary: "Belajar komposisi dan cahaya untuk pemula melalui praktik bersama mentor.", image: "photography", priceIdr: 75000, fields: ["Seni & desain"] },
  { id: "demo-event-8", ownerId: "demo-other-organizer", title: "Forum Wirausaha Muda", category: "Seminar & diskusi", days: 50, venue: "Ruang Temu Arunika, Jakarta", capacity: 150, status: "PUBLISHED", sponsors: ["demo-sponsor-finance"], summary: "Berbagi pengalaman memulai usaha, mengembangkan produk, dan mengelola keuangan usaha kecil.", image: "finance", priceIdr: 100000, fields: ["Teknologi", "Keuangan & perbankan"] },
];

export function createEvents(at: (days: number, hours?: number) => string): OwnedEvent[] {
  return demoEvents.map(item => {
    const dated = item.status !== "DRAFT";
    return {
      id: item.id, ownerId: item.ownerId, title: item.title, category: item.category, summary: item.summary,
      status: item.status, revision: "1", updatedAt: at(-2),
      startsAt: dated ? at(item.days) : null, endsAt: dated ? at(item.days, 4) : null, timezone: "Asia/Jakarta",
      venue: item.venue, capacity: item.capacity,
      registrationOpensAt: dated ? at(-30) : null, registrationClosesAt: dated ? at(item.days - 1) : null,
      modules: { registration: true, committee: false, attendance: false, sponsorship: true },
      branding: {
        organizationName: demoOrganizations[item.ownerId].name, organizationLogo: null,
        eventLogo: { id: `demo-photo-${item.image}`, name: `${item.image}.jpg`, url: demoMedia[item.image].path },
        sponsors: item.sponsors.map(id => ({ id, name: demoSponsors.find(sponsor => sponsor.id === id)!.companyName, logo: null })),
      },
    };
  });
}
