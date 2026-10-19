import { DEMO_PROOF_IMAGE } from "./proof-image";
import type { DemoDb, StoredForm } from "./types";
import { demoPeople } from "./data/people";
import { demoOrganizations, demoSponsors } from "./data/organizations";
import { createAccounts } from "./data/accounts";
import { createEvents, demoEvents } from "./data/events";
export type * from "./types";

/** Public throwaway credentials, available only in demo builds. */
export const DEMO_PASSWORD = "DemoPass-2026!";

export const demoIds = { user: "demo-user", organizer: "demo-organizer", sponsor: "demo-sponsor", pending: "demo-pending", otherOrganizer: "demo-other-organizer" } as const;

const DAY = 86400000;
const at = (days: number, hours = 0) => {
  const base = new Date();
  base.setUTCHours(2, 0, 0, 0); // 09:00 WIB
  return new Date(base.getTime() + days * DAY + hours * 3600000).toISOString();
};

export function seed(): DemoDb {
  const org = demoOrganizations[demoIds.organizer].name;
  const company = demoSponsors[0].companyName;
  const events = createEvents(at);
  const prices = Object.fromEntries(demoEvents.map(item => [item.id, item.priceIdr]));
  return {
    version: 3,
    fixtureRevision: 1,
    eventMatchingFields: Object.fromEntries(demoEvents.map(item => [item.id, [...item.fields]])),
    sponsorMatchingProfiles: Object.fromEntries(demoSponsors.map(item => [item.id, { ...item.profile, fields: [...item.profile.fields] }])),
    forms: {
      ...Object.fromEntries(events.map((item) => [item.id, {
        priceIdr: prices[item.id],
        paymentNote: "Harga contoh untuk demo. Ikuti arahan pembayaran dari panitia dan unggah bukti pembayaran. PartnerHub tidak memproses pembayaran.",
        fields: [{ id: "demo-ticket-proof", label: "Bukti pembayaran", type: "image", required: true, hint: "PNG, JPG, atau WebP, maksimal 2 MB.", options: [] }],
      } satisfies StoredForm])),
      "demo-event-2": { priceIdr: prices["demo-event-2"], paymentNote: "Bayar langsung ke panitia (detail diberikan panitia lewat WhatsApp), lalu unggah bukti pembayaran di form ini. PartnerHub tidak memproses pembayaran.", fields: [
        { id: "demo-f1", label: "Asal institusi atau komunitas", type: "text", required: true, hint: null, options: [] },
        { id: "demo-f2", label: "Tingkat pengalaman desain", type: "choice", required: true, hint: null, options: ["Pemula", "Menengah", "Mahir"] },
        { id: "demo-f3", label: "Bukti pembayaran", type: "image", required: true, hint: "PNG, JPG, atau WebP, maksimal 2 MB.", options: [] },
      ] },
      "demo-event-7": { priceIdr: prices["demo-event-7"], paymentNote: "Transfer sesuai arahan panitia setelah mendaftar, lalu unggah bukti di form ini. PartnerHub tidak memproses pembayaran.", fields: [
        { id: "demo-f4", label: "Membawa kamera sendiri?", type: "choice", required: true, hint: null, options: ["Ya", "Tidak"] },
        { id: "demo-f5", label: "Bukti pembayaran", type: "image", required: true, hint: null, options: [] },
      ] },
    },
    accounts: createAccounts(at(-30), at(-1)),
    sessionAccountId: null,
    events,
    baseRegistered: { "demo-event-1": 122, "demo-event-2": 30, "demo-event-3": 48, "demo-event-5": 72, "demo-event-6": 210, "demo-event-7": 18, "demo-event-8": 96 },
    registrations: [
      { id: "demo-reg-1", ownerId: demoIds.user, eventId: "demo-event-1", ticketReference: "PH-K7M2-Q9DA", status: "REGISTERED", createdAt: at(-6), qrSecret: null, answers: [], registrantName: null },
      { id: "demo-reg-2", ownerId: demoIds.user, eventId: "demo-event-6", ticketReference: "PH-R4T8-W3LN", status: "REGISTERED", createdAt: at(-3), qrSecret: "demoSecretK7m2Q9daX4pLw8Rt", answers: [], registrantName: null },
      { id: "demo-reg-3", ownerId: demoIds.user, eventId: "demo-event-5", ticketReference: "PH-B2X6-H5VC", status: "CANCELLED", createdAt: at(-50), qrSecret: null, answers: [], registrantName: null },
      { id: "demo-reg-4", ownerId: "demo-registrant-1", eventId: "demo-event-1", ticketReference: "PH-M3N7-A2QX", status: "REGISTERED", createdAt: at(-5), qrSecret: null, answers: [{ fieldId: "field-default-1", label: "Asal institusi atau komunitas", type: "text", value: "Himpunan Mahasiswa Teknologi" }], registrantName: demoPeople["demo-registrant-1"].name },
      { id: "demo-reg-5", ownerId: "demo-registrant-2", eventId: "demo-event-1", ticketReference: "PH-T8W4-K6RD", status: "REGISTERED", createdAt: at(-4), qrSecret: null, answers: [{ fieldId: "field-default-1", label: "Asal institusi atau komunitas", type: "text", value: "Lingkar Baca Sore" }], registrantName: demoPeople["demo-registrant-2"].name },
      { id: "demo-reg-6", ownerId: "demo-registrant-3", eventId: "demo-event-2", ticketReference: "PH-C5P9-L2ZE", status: "REGISTERED", createdAt: at(-2), qrSecret: null, answers: [{ fieldId: "demo-f1", label: "Asal institusi atau komunitas", type: "text", value: "Kolektif Rupa Kampus" }, { fieldId: "demo-f2", label: "Tingkat pengalaman desain", type: "choice", value: "Menengah" }], registrantName: demoPeople["demo-registrant-3"].name },
      { id: "demo-reg-7", ownerId: "demo-registrant-1", eventId: "demo-event-2", ticketReference: "PH-D4F8-N3VK", status: "PENDING", createdAt: at(-1), qrSecret: null, answers: [{ fieldId: "demo-f1", label: "Asal institusi atau komunitas", type: "text", value: "Kolektif Rupa Kampus" }, { fieldId: "demo-f2", label: "Tingkat pengalaman desain", type: "choice", value: "Pemula" }, { fieldId: "demo-f3", label: "Bukti pembayaran", type: "image", value: DEMO_PROOF_IMAGE }], registrantName: demoPeople["demo-registrant-1"].name },
      { id: "demo-reg-8", ownerId: "demo-registrant-2", eventId: "demo-event-2", ticketReference: "PH-G9H2-R5TB", status: "PENDING", createdAt: at(-0.5), qrSecret: null, answers: [{ fieldId: "demo-f1", label: "Asal institusi atau komunitas", type: "text", value: "Ruang Kreasi Muda" }, { fieldId: "demo-f2", label: "Tingkat pengalaman desain", type: "choice", value: "Menengah" }, { fieldId: "demo-f3", label: "Bukti pembayaran", type: "image", value: DEMO_PROOF_IMAGE }], registrantName: demoPeople["demo-registrant-2"].name },
    ],
    notifications: [
      { id: "demo-n1", ownerId: demoIds.user, title: "Pendaftaran dikonfirmasi", body: "Tiket Seminar Kepemimpinan Mahasiswa sudah tersedia di halaman tiketmu.", createdAt: at(-6), read: true },
      { id: "demo-n2", ownerId: demoIds.user, title: "Pengingat acara", body: "Festival Literasi Kota dimulai dalam beberapa minggu.", createdAt: at(-1), read: false },
      { id: "demo-n3", ownerId: demoIds.organizer, title: "Pendaftar baru", body: "Seminar Kepemimpinan Mahasiswa menerima pendaftar baru hari ini.", createdAt: at(-1), read: false },
      { id: "demo-n4", ownerId: demoIds.organizer, title: "Proposal sponsor masuk", body: `${company} mengirim proposal dukungan untuk Workshop Desain Poster Acara.`, createdAt: at(-2), read: true },
      { id: "demo-n5", ownerId: demoIds.sponsor, title: "Proposal diterima", body: "Proposal untuk Seminar Kepemimpinan Mahasiswa diterima penyelenggara.", createdAt: at(-4), read: false },
      { id: "demo-n6", ownerId: demoIds.sponsor, title: "Proposal sedang ditinjau", body: "Penyelenggara sedang meninjau proposal Workshop Desain Poster Acara.", createdAt: at(-2), read: true },
      { id: "demo-n8", ownerId: demoIds.user, title: "Lamaran panitia Seminar Kepemimpinan Mahasiswa", body: "Lamaranmu diterima. Catatan penyelenggara: masuk ke grup WhatsApp panitia dan hadir di rapat perdana hari Sabtu.", createdAt: at(-2), read: false },
      { id: "demo-n9", ownerId: demoIds.sponsor, title: "Permintaan sponsorship baru", body: `${org} mengajak ${company} mendukung Temu Komunitas Relawan.`, createdAt: at(-2), read: false },
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
      { id: "demo-a1", ownerId: demoIds.user, applicantName: demoPeople["demo-user"].name, openingId: "demo-o1", eventId: "demo-event-1", eventTitle: "Seminar Kepemimpinan Mahasiswa", divisions: ["Acara", "Humas"], motivation: "Saya ingin belajar mengelola acara dari sisi persiapan.", question: "Pengalaman kepanitiaan apa yang pernah kamu ikuti?", answer: "Panitia konsumsi acara jurusan tahun lalu.", status: "ACCEPTED", stageId: null, note: "Selamat bergabung. Langkah berikutnya: masuk ke grup WhatsApp panitia (tautan dikirim lewat email) dan hadir di rapat perdana hari Sabtu pukul 10.00 di Auditorium Cakrawala.", createdAt: at(-9) },
      { id: "demo-a2", ownerId: "demo-applicant-2", applicantName: demoPeople["demo-applicant-2"].name, openingId: "demo-o1", eventId: "demo-event-1", eventTitle: "Seminar Kepemimpinan Mahasiswa", divisions: ["Dokumentasi"], motivation: "Saya terbiasa memotret dan menyunting video untuk kegiatan kampus.", question: "Pengalaman kepanitiaan apa yang pernah kamu ikuti?", answer: "Dokumentasi dua acara himpunan.", status: "SUBMITTED", stageId: null, note: null, createdAt: at(-1) },
      { id: "demo-a3", ownerId: "demo-applicant-3", applicantName: demoPeople["demo-applicant-3"].name, openingId: "demo-o1", eventId: "demo-event-1", eventTitle: "Seminar Kepemimpinan Mahasiswa", divisions: ["Humas", "Acara"], motivation: "Saya aktif mengelola media sosial organisasi dan siap membantu publikasi.", question: "Pengalaman kepanitiaan apa yang pernah kamu ikuti?", answer: "Humas UKM selama satu periode.", status: "IN_SELECTION", stageId: "demo-st1", note: null, createdAt: at(-3) },
    ],
    offers: [
      { id: "demo-so1", ownerId: demoIds.organizer, eventId: "demo-event-3", eventTitle: "Temu Komunitas Relawan", organizationName: org, sponsorId: demoIds.sponsor, sponsorName: company, category: "Media partner", message: `Kami mengundang ${company} menjadi media partner untuk publikasi acara relawan.`, amountLabel: null, proposalUrl: null, status: "SENT", createdAt: at(-2) },
    ],
    idempotency: {},
    counter: 100,
  };
}
