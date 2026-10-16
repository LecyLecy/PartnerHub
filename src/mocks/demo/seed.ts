import type { AccountStatus, Role } from "@/contracts/account";
import type { EventRecord } from "@/contracts/event";
import type { NotificationItem, Proposal, RegistrationAnswer, RegistrationField, RegistrationStatus, Sponsorship } from "@/contracts/participation";
import type { CommitteeApplication, CommitteeOpening } from "@/contracts/committee";
import type { SponsorOffer } from "@/contracts/sponsor-offer";
import { DEMO_PROOF_IMAGE } from "./proof-image";

/** Public, throwaway credentials for the demo build. They only work when NEXT_PUBLIC_PARTNERHUB_DEMO=1 at build time. */
export const DEMO_PASSWORD = "DemoPass-2026!";

export type DemoAccount = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: AccountStatus;
  emailVerified: boolean;
  onboardingComplete: boolean;
  /** True for the seeded accounts. Accounts created through Register are false and start empty. */
  seeded: boolean;
  description: string;
  submittedAt: string;
  summary: { label: string; value: string }[];
  documents: { label: string; name: string }[];
};
export type OwnedEvent = EventRecord & { ownerId: string };
/** `qrSecret` is set when the organizer sends the QR. Demo only: a real backend stores just a hash of it. */
export type OwnedRegistration = { id: string; ownerId: string; eventId: string; ticketReference: string; status: RegistrationStatus; note?: string | null; createdAt: string; qrSecret: string | null; checkedInAt?: string | null; answers: RegistrationAnswer[]; registrantName: string | null };
/** Registration form an organizer saved for one event. Events without an entry use the default form and are free. */
export type StoredForm = { priceIdr: number; paymentNote: string | null; fields: RegistrationField[] };
export type OwnedNotification = NotificationItem & { ownerId: string };
export type OwnedProposal = Proposal & { ownerId: string };
export type OwnedSponsorship = Sponsorship & { ownerId: string };
/** ownerId is the organizer who owns the event. */
export type OwnedOpening = Omit<CommitteeOpening, "eventLogoUrl" | "organizationLogoUrl"> & { ownerId: string };
/** ownerId is the applicant. */
export type OwnedApplication = Omit<CommitteeApplication, "stages" | "organizationName" | "eventLogoUrl" | "organizationLogoUrl"> & { ownerId: string; applicantName: string };
/** ownerId is the organizer who sent the request. */
export type OwnedOffer = SponsorOffer & { ownerId: string };

export type DemoDb = {
  version: 3;
  forms: Record<string, StoredForm>;
  accounts: DemoAccount[];
  sessionAccountId: string | null;
  events: OwnedEvent[];
  baseRegistered: Record<string, number>;
  registrations: OwnedRegistration[];
  notifications: OwnedNotification[];
  proposals: OwnedProposal[];
  sponsorships: OwnedSponsorship[];
  openings: OwnedOpening[];
  applications: OwnedApplication[];
  offers: OwnedOffer[];
  idempotency: Record<string, string>;
  counter: number;
};

export const demoIds = { user: "demo-user", organizer: "demo-organizer", sponsor: "demo-sponsor", pending: "demo-pending", otherOrganizer: "demo-other-organizer" } as const;

const DAY = 86400000;
const at = (days: number, hours = 0) => {
  const base = new Date();
  base.setUTCHours(2, 0, 0, 0); // 09:00 WIB
  return new Date(base.getTime() + days * DAY + hours * 3600000).toISOString();
};

// Published demo events get bundled SVG art so cards show real logos. Drafts and closed events stay bare.
const covers = ["cover-a", "cover-b", "cover-c"];
function demoAsset(key: string, kind: "cover" | "org", status: EventRecord["status"]) {
  if (status !== "PUBLISHED") return null;
  const file = kind === "org" ? (key === "Komunitas Demo Kota" ? "org-kota" : "org-kampus") : covers[Number(key.replace(/\D/g, "")) % covers.length];
  return { id: `demo-${kind}-${file}`, name: `${file}.svg`, url: `/demo/${file}.svg` };
}

function event(id: string, ownerId: string, title: string, category: EventRecord["category"], days: number, venue: string, capacity: number | null, status: EventRecord["status"], organizationName: string, sponsors: string[], summary: string): OwnedEvent {
  const dated = status !== "DRAFT";
  return {
    id, ownerId, title, category, summary, status, revision: "1", updatedAt: at(-2),
    startsAt: dated ? at(days) : null, endsAt: dated ? at(days, 4) : null, timezone: "Asia/Jakarta",
    venue: dated ? venue : "", capacity,
    registrationOpensAt: dated ? at(days - 30) : null, registrationClosesAt: dated ? at(days - 1) : null,
    modules: { registration: true, committee: false, attendance: false, sponsorship: true },
    branding: { organizationName, eventLogo: demoAsset(id, "cover", status), organizationLogo: demoAsset(organizationName, "org", status), sponsors: sponsors.map((name, index) => ({ id: `${id}-s${index}`, name, logo: null })) },
  };
}

export function seed(): DemoDb {
  const org = "Organisasi Demo Kampus";
  const other = "Komunitas Demo Kota";
  const events: OwnedEvent[] = [
    event("demo-event-1", demoIds.organizer, "Seminar Kepemimpinan Mahasiswa", "Seminar & diskusi", 21, "Aula Demo Utama", 200, "PUBLISHED", org, ["Sponsor Demo A", "Sponsor Demo B"], "Diskusi tentang memimpin tim kecil, dari rapat pertama sampai laporan akhir."),
    event("demo-event-2", demoIds.organizer, "Workshop Desain Poster Acara", "Workshop", 35, "Lab Kreatif Demo", 40, "PUBLISHED", org, ["Sponsor Demo A"], "Praktik langsung menyusun poster dan materi promosi acara."),
    event("demo-event-3", demoIds.organizer, "Temu Komunitas Relawan", "Kegiatan komunitas", 60, "Taman Demo", 120, "PUBLISHED", org, [], "Pertemuan relawan dari beberapa organisasi untuk berbagi pengalaman."),
    event("demo-event-4", demoIds.organizer, "Rencana Pelatihan Panitia", "Workshop", 90, "", null, "DRAFT", org, [], "Draft yang belum punya jadwal."),
    event("demo-event-5", demoIds.organizer, "Diskusi Akhir Tahun Lalu", "Seminar & diskusi", -40, "Ruang Seminar Demo", 80, "CLOSED", org, ["Sponsor Demo B"], "Acara yang sudah selesai."),
    event("demo-event-6", demoIds.otherOrganizer, "Festival Literasi Kota", "Kegiatan komunitas", 28, "Perpustakaan Demo", 300, "PUBLISHED", other, ["Sponsor Demo C"], "Hari literasi dengan lapak buku dan sesi bercerita."),
    event("demo-event-7", demoIds.otherOrganizer, "Pelatihan Fotografi Dasar", "Workshop", 42, "Studio Demo", 30, "PUBLISHED", other, [], "Belajar komposisi dan cahaya untuk pemula."),
    event("demo-event-8", demoIds.otherOrganizer, "Forum Wirausaha Muda", "Seminar & diskusi", 50, "Gedung Demo Timur", 150, "PUBLISHED", other, ["Sponsor Demo A"], "Forum berbagi pengalaman memulai usaha kecil."),
  ];
  const account = (fields: Partial<DemoAccount> & Pick<DemoAccount, "id" | "email" | "fullName" | "role" | "description">): DemoAccount => ({
    status: "active", emailVerified: true, onboardingComplete: true, seeded: true, submittedAt: at(-30), summary: [], documents: [], ...fields,
  });
  return {
    version: 3,
    forms: {
      "demo-event-2": { priceIdr: 50000, paymentNote: "Bayar langsung ke panitia (detail diberikan panitia lewat WhatsApp), lalu unggah bukti pembayaran di form ini. PartnerHub tidak memproses pembayaran.", fields: [
        { id: "demo-f1", label: "Asal institusi atau komunitas", type: "text", required: true, hint: null, options: [] },
        { id: "demo-f2", label: "Tingkat pengalaman desain", type: "choice", required: true, hint: null, options: ["Pemula", "Menengah", "Mahir"] },
        { id: "demo-f3", label: "Bukti pembayaran", type: "image", required: true, hint: "PNG, JPG, atau WebP, maksimal 2 MB.", options: [] },
      ] },
      "demo-event-7": { priceIdr: 75000, paymentNote: "Transfer sesuai arahan panitia setelah mendaftar, lalu unggah bukti di form ini. PartnerHub tidak memproses pembayaran.", fields: [
        { id: "demo-f4", label: "Membawa kamera sendiri?", type: "choice", required: true, hint: null, options: ["Ya", "Tidak"] },
        { id: "demo-f5", label: "Bukti pembayaran", type: "image", required: true, hint: null, options: [] },
      ] },
    },
    accounts: [
      account({ id: demoIds.user, email: "demo.user@partnerhub.test", fullName: "Pengguna Demo", role: "user", description: "User biasa dengan tiket, pendaftaran, dan notifikasi." }),
      account({ id: demoIds.organizer, email: "demo.penyelenggara@partnerhub.test", fullName: "Penyelenggara Demo", role: "organizer", description: "Penyelenggara aktif dengan lima acara dan data pendaftar.", summary: [{ label: "Organisasi", value: org }, { label: "Kota", value: "Kota Demo" }], documents: [{ label: "Surat tugas organisasi", name: "surat-tugas-demo.pdf" }] }),
      account({ id: demoIds.sponsor, email: "demo.sponsor@partnerhub.test", fullName: "PIC Sponsor Demo", role: "sponsor", description: "Perusahaan sponsor aktif dengan proposal dan komitmen.", summary: [{ label: "Perusahaan", value: "Perusahaan Demo" }, { label: "Industri", value: "Teknologi" }], documents: [{ label: "Dokumen legalitas", name: "legalitas-demo.pdf" }] }),
      account({ id: demoIds.pending, email: "demo.menunggu@partnerhub.test", fullName: "Penyelenggara Menunggu", role: "organizer", status: "pending_verification", submittedAt: at(-1), description: "Penyelenggara yang menunggu verifikasi admin, akses terbatas.", summary: [{ label: "Jenis", value: "Komunitas" }, { label: "Organisasi", value: "Komunitas Demo Baru" }, { label: "Kota", value: "Kota Demo" }], documents: [{ label: "Surat tugas atau legalitas organisasi", name: "legalitas-komunitas-demo.pdf" }] }),
    ],
    sessionAccountId: null,
    events,
    baseRegistered: { "demo-event-1": 122, "demo-event-2": 30, "demo-event-3": 48, "demo-event-5": 72, "demo-event-6": 210, "demo-event-7": 18, "demo-event-8": 96 },
    registrations: [
      { id: "demo-reg-1", ownerId: demoIds.user, eventId: "demo-event-1", ticketReference: "PH-K7M2-Q9DA", status: "REGISTERED", createdAt: at(-6), qrSecret: null, answers: [], registrantName: null },
      { id: "demo-reg-2", ownerId: demoIds.user, eventId: "demo-event-6", ticketReference: "PH-R4T8-W3LN", status: "REGISTERED", createdAt: at(-3), qrSecret: "demoSecretK7m2Q9daX4pLw8Rt", answers: [], registrantName: null },
      { id: "demo-reg-3", ownerId: demoIds.user, eventId: "demo-event-5", ticketReference: "PH-B2X6-H5VC", status: "CANCELLED", createdAt: at(-50), qrSecret: null, answers: [], registrantName: null },
      { id: "demo-reg-4", ownerId: "demo-registrant-1", eventId: "demo-event-1", ticketReference: "PH-M3N7-A2QX", status: "REGISTERED", createdAt: at(-5), qrSecret: null, answers: [{ fieldId: "field-default-1", label: "Asal institusi atau komunitas", type: "text", value: "Himpunan Teknik Demo" }], registrantName: "Peserta Demo Satu" },
      { id: "demo-reg-5", ownerId: "demo-registrant-2", eventId: "demo-event-1", ticketReference: "PH-T8W4-K6RD", status: "REGISTERED", createdAt: at(-4), qrSecret: null, answers: [{ fieldId: "field-default-1", label: "Asal institusi atau komunitas", type: "text", value: "Komunitas Baca Demo" }], registrantName: "Peserta Demo Dua" },
      { id: "demo-reg-6", ownerId: "demo-registrant-3", eventId: "demo-event-2", ticketReference: "PH-C5P9-L2ZE", status: "REGISTERED", createdAt: at(-2), qrSecret: null, answers: [{ fieldId: "demo-f1", label: "Asal institusi atau komunitas", type: "text", value: "UKM Desain Demo" }, { fieldId: "demo-f2", label: "Tingkat pengalaman desain", type: "choice", value: "Menengah" }], registrantName: "Peserta Demo Tiga" },
      { id: "demo-reg-7", ownerId: "demo-registrant-1", eventId: "demo-event-2", ticketReference: "PH-D4F8-N3VK", status: "PENDING", createdAt: at(-1), qrSecret: null, answers: [{ fieldId: "demo-f1", label: "Asal institusi atau komunitas", type: "text", value: "Himpunan Desain Demo" }, { fieldId: "demo-f2", label: "Tingkat pengalaman desain", type: "choice", value: "Pemula" }, { fieldId: "demo-f3", label: "Bukti pembayaran", type: "image", value: DEMO_PROOF_IMAGE }], registrantName: "Peserta Demo Satu" },
      { id: "demo-reg-8", ownerId: "demo-registrant-2", eventId: "demo-event-2", ticketReference: "PH-G9H2-R5TB", status: "PENDING", createdAt: at(-0.5), qrSecret: null, answers: [{ fieldId: "demo-f1", label: "Asal institusi atau komunitas", type: "text", value: "Komunitas Kreatif Demo" }, { fieldId: "demo-f2", label: "Tingkat pengalaman desain", type: "choice", value: "Menengah" }, { fieldId: "demo-f3", label: "Bukti pembayaran", type: "image", value: DEMO_PROOF_IMAGE }], registrantName: "Peserta Demo Dua" },
    ],
    notifications: [
      { id: "demo-n1", ownerId: demoIds.user, title: "Pendaftaran dikonfirmasi", body: "Tiket Seminar Kepemimpinan Mahasiswa sudah tersedia di halaman tiketmu.", createdAt: at(-6), read: true },
      { id: "demo-n2", ownerId: demoIds.user, title: "Pengingat acara", body: "Festival Literasi Kota dimulai dalam beberapa minggu.", createdAt: at(-1), read: false },
      { id: "demo-n3", ownerId: demoIds.organizer, title: "Pendaftar baru", body: "Seminar Kepemimpinan Mahasiswa menerima pendaftar baru hari ini.", createdAt: at(-1), read: false },
      { id: "demo-n4", ownerId: demoIds.organizer, title: "Proposal sponsor masuk", body: "Perusahaan Demo mengirim proposal dukungan untuk Workshop Desain Poster Acara.", createdAt: at(-2), read: true },
      { id: "demo-n5", ownerId: demoIds.sponsor, title: "Proposal diterima", body: "Proposal untuk Seminar Kepemimpinan Mahasiswa diterima penyelenggara.", createdAt: at(-4), read: false },
      { id: "demo-n6", ownerId: demoIds.sponsor, title: "Proposal sedang ditinjau", body: "Penyelenggara sedang meninjau proposal Workshop Desain Poster Acara.", createdAt: at(-2), read: true },
      { id: "demo-n8", ownerId: demoIds.user, title: "Lamaran panitia Seminar Kepemimpinan Mahasiswa", body: "Lamaranmu diterima. Catatan penyelenggara: masuk ke grup WhatsApp panitia dan hadir di rapat perdana hari Sabtu.", createdAt: at(-2), read: false },
      { id: "demo-n9", ownerId: demoIds.sponsor, title: "Permintaan sponsorship baru", body: "Organisasi Demo Kampus mengajak Perusahaan Demo mendukung Temu Komunitas Relawan.", createdAt: at(-2), read: false },
      { id: "demo-n7", ownerId: demoIds.pending, title: "Dokumen diterima", body: "Dokumenmu sudah diterima dan sedang menunggu pemeriksaan admin.", createdAt: at(-1), read: false },
    ],
    proposals: [
      { id: "demo-p1", ownerId: demoIds.sponsor, eventId: "demo-event-1", eventTitle: "Seminar Kepemimpinan Mahasiswa", category: "Dana", offer: "Dukungan dana untuk konsumsi peserta dan logo pada materi acara.", amountLabel: "Rp10 juta", status: "ACCEPTED", createdAt: at(-20) },
      { id: "demo-p2", ownerId: demoIds.sponsor, eventId: "demo-event-2", eventTitle: "Workshop Desain Poster Acara", category: "Produk", offer: "Perangkat lunak desain untuk peserta workshop selama satu bulan.", amountLabel: null, status: "IN_REVIEW", createdAt: at(-8) },
      { id: "demo-p3", ownerId: demoIds.sponsor, eventId: "demo-event-6", eventTitle: "Festival Literasi Kota", category: "Media partner", offer: "Publikasi acara lewat kanal perusahaan selama dua minggu.", amountLabel: null, status: "SENT", createdAt: at(-2) },
    ],
    sponsorships: [
      { id: "demo-sp1", ownerId: demoIds.sponsor, eventId: "demo-event-1", eventTitle: "Seminar Kepemimpinan Mahasiswa", packageName: "Dukungan dana", benefits: [{ id: "demo-b1", label: "Logo pada poster acara", status: "VERIFIED" }, { id: "demo-b2", label: "Sebutan sponsor saat pembukaan", status: "PLANNED" }] },
    ],
    openings: [
      { id: "demo-o1", ownerId: demoIds.organizer, eventId: "demo-event-1", eventTitle: "Seminar Kepemimpinan Mahasiswa", organizationName: org, description: "Kami mencari panitia untuk hari pelaksanaan dan persiapan dua minggu sebelumnya.", divisions: [{ id: "demo-d1", name: "Acara" }, { id: "demo-d2", name: "Dokumentasi" }, { id: "demo-d3", name: "Humas" }, { id: "demo-d4", name: "Konsumsi" }], question: "Pengalaman kepanitiaan apa yang pernah kamu ikuti?", stages: [{ id: "demo-st1", name: "Daftar pendek" }, { id: "demo-st2", name: "Wawancara" }], status: "OPEN" },
      { id: "demo-o2", ownerId: demoIds.organizer, eventId: "demo-event-2", eventTitle: "Workshop Desain Poster Acara", organizationName: org, description: "Butuh bantuan untuk persiapan materi dan registrasi peserta.", divisions: [{ id: "demo-d5", name: "Materi" }, { id: "demo-d6", name: "Registrasi" }], question: null, stages: [{ id: "demo-st3", name: "Daftar pendek" }, { id: "demo-st4", name: "Wawancara" }], status: "OPEN" },
    ],
    applications: [
      { id: "demo-a1", ownerId: demoIds.user, applicantName: "Pengguna Demo", openingId: "demo-o1", eventId: "demo-event-1", eventTitle: "Seminar Kepemimpinan Mahasiswa", divisions: ["Acara", "Humas"], motivation: "Saya ingin belajar mengelola acara dari sisi persiapan.", question: "Pengalaman kepanitiaan apa yang pernah kamu ikuti?", answer: "Panitia konsumsi acara jurusan tahun lalu.", status: "ACCEPTED", stageId: null, note: "Selamat bergabung. Langkah berikutnya: masuk ke grup WhatsApp panitia (tautan dikirim lewat email) dan hadir di rapat perdana hari Sabtu pukul 10.00 di Aula Demo.", createdAt: at(-9) },
      { id: "demo-a2", ownerId: "demo-applicant-2", applicantName: "Calon Panitia Demo", openingId: "demo-o1", eventId: "demo-event-1", eventTitle: "Seminar Kepemimpinan Mahasiswa", divisions: ["Dokumentasi"], motivation: "Saya terbiasa memotret dan menyunting video untuk kegiatan kampus.", question: "Pengalaman kepanitiaan apa yang pernah kamu ikuti?", answer: "Dokumentasi dua acara himpunan.", status: "SUBMITTED", stageId: null, note: null, createdAt: at(-1) },
      { id: "demo-a3", ownerId: "demo-applicant-3", applicantName: "Pelamar Demo Lain", openingId: "demo-o1", eventId: "demo-event-1", eventTitle: "Seminar Kepemimpinan Mahasiswa", divisions: ["Humas", "Acara"], motivation: "Saya aktif mengelola media sosial organisasi dan siap membantu publikasi.", question: "Pengalaman kepanitiaan apa yang pernah kamu ikuti?", answer: "Humas UKM selama satu periode.", status: "IN_SELECTION", stageId: "demo-st1", note: null, createdAt: at(-3) },
    ],
    offers: [
      { id: "demo-so1", ownerId: demoIds.organizer, eventId: "demo-event-3", eventTitle: "Temu Komunitas Relawan", organizationName: org, sponsorId: demoIds.sponsor, sponsorName: "Perusahaan Demo", category: "Media partner", message: "Kami mengundang Perusahaan Demo menjadi media partner untuk publikasi acara relawan.", amountLabel: null, proposalUrl: null, status: "SENT", createdAt: at(-2) },
    ],
    idempotency: {},
    counter: 100,
  };
}
