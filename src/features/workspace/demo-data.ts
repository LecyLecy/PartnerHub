export type PreviewState = "demo" | "empty" | "loading" | "error";
export type WorkspaceSection =
  | "overview"
  | "event"
  | "registration"
  | "committee"
  | "attendance"
  | "sponsorship";

export const demoEvents = [
  {
    id: "demo-forum",
    title: "Forum Kolaborasi Kampus",
    category: "Seminar & diskusi",
    date: "14 November 2026",
    time: "09.00–15.00 WIB",
    venue: "Auditorium contoh",
    status: "PUBLISHED",
    registrations: 128,
    capacity: 200,
    applications: 12,
    checkIns: 0,
    benefitsVerified: 2,
    benefitsTotal: 4,
  },
  {
    id: "demo-workshop",
    title: "Workshop Kepanitiaan",
    category: "Workshop",
    date: "28 November 2026",
    time: "10.00–13.00 WIB",
    venue: "Ruang komunitas contoh",
    status: "DRAFT",
    registrations: 0,
    capacity: 60,
    applications: 0,
    checkIns: 0,
    benefitsVerified: 0,
    benefitsTotal: 0,
  },
] as const;

export type DemoEvent = (typeof demoEvents)[number];

export const demoSponsors = [
  {
    name: "Mitra contoh A",
    stage: "NEGOTIATING",
    label: "Negosiasi",
    action: "Tinjau proposal paket utama",
    date: "6 Nov",
    initials: "A",
  },
  {
    name: "Mitra contoh B",
    stage: "AGREED",
    label: "Sepakat",
    action: "Lengkapi bukti penempatan logo",
    date: "8 Nov",
    initials: "B",
  },
  {
    name: "Mitra contoh C",
    stage: "CONTACTED",
    label: "Dihubungi",
    action: "Konfirmasi ketertarikan sponsor",
    date: "10 Nov",
    initials: "C",
  },
] as const;

export const sections: {
  id: WorkspaceSection;
  label: string;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Ringkasan",
    description: "Persiapan event dan komitmen sponsor dalam satu pandangan.",
  },
  {
    id: "event",
    label: "Event",
    description: "Tinjau jadwal, kapasitas, dan status publikasi event contoh.",
  },
  {
    id: "registration",
    label: "Registrasi",
    description:
      "Registrasi peserta, jawaban khusus event, dan tiket QR yang tidak memuat data pribadi.",
  },
  {
    id: "committee",
    label: "Panitia",
    description:
      "Pilihan divisi, aplikasi, dan keputusan rekrutmen untuk setiap event.",
  },
  {
    id: "attendance",
    label: "Kehadiran",
    description:
      "Pencatatan masuk yang opsional, dengan perlindungan terhadap scan berulang.",
  },
  {
    id: "sponsorship",
    label: "Sponsorship",
    description:
      "Tindak lanjut prospek, komitmen benefit, dan bukti pemenuhannya.",
  },
];

export const preparationSteps = [
  {
    title: "Tentukan dasar event",
    detail: "Siapkan judul, deskripsi, jadwal, lokasi, dan kapasitas.",
  },
  {
    title: "Rancang registrasi peserta",
    detail:
      "Tentukan periode registrasi, pertanyaan khusus, dan consent yang diperlukan.",
  },
  {
    title: "Siapkan rekrutmen panitia",
    detail: "Susun divisi, pertanyaan aplikasi, dan alur keputusan.",
  },
  {
    title: "Pilih mode kehadiran",
    detail: "Tanpa scan atau scan masuk. QR tidak boleh memuat data pribadi.",
  },
  {
    title: "Catat komitmen sponsor",
    detail:
      "Siapkan prospek, URL proposal, benefit yang dijanjikan, dan bukti pemenuhan.",
  },
];

export function filterDemoEvents(
  query: string,
  status: string,
): readonly DemoEvent[] {
  const normalized = query.trim().toLocaleLowerCase("id-ID");
  return demoEvents.filter(
    (event) =>
      event.title.toLocaleLowerCase("id-ID").includes(normalized) &&
      (status === "all" || event.status === status),
  );
}

export function getDemoTotals() {
  return demoEvents.reduce(
    (totals, event) => ({
      registrations: totals.registrations + event.registrations,
      applications: totals.applications + event.applications,
      checkIns: totals.checkIns + event.checkIns,
      benefitsVerified: totals.benefitsVerified + event.benefitsVerified,
      benefitsTotal: totals.benefitsTotal + event.benefitsTotal,
    }),
    {
      registrations: 0,
      applications: 0,
      checkIns: 0,
      benefitsVerified: 0,
      benefitsTotal: 0,
    },
  );
}
