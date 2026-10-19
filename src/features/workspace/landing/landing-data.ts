/** Illustrative landing copy, not customer claims or measured results. */
export const faqItems = {
  umum: [
    { key: "siapa", question: "Siapa yang bisa memakai PartnerHub?", answer: "Penyelenggara acara, peserta atau calon panitia, dan perusahaan sponsor. Penyelenggara dan sponsor memerlukan verifikasi email dan pemeriksaan admin." },
    { key: "paket", question: "Bagaimana biaya untuk penyelenggara?", answer: "Pilih paket untuk setiap acara sebelum publikasi. Starter Rp149.000 dan Growth Rp499.000 per event. Rincian tersedia di halaman Harga." },
    { key: "sponsor", question: "Apakah sponsor bisa melihat acara tanpa akun?", answer: "Ya. Detail acara dan sponsor yang sudah mendukung dapat dilihat tanpa login. Masuk ke akun untuk mengajukan dukungan atau menanggapi ajakan." },
  ],
} as const;

export const roleRows = [
  { title: "Penyelenggara", body: "Kelola acara, panitia, dan dukungan sponsor.", href: "/register?role=organizer", action: "Siapkan acara" },
  { title: "Peserta & calon panitia", body: "Temukan acara atau ambil bagian di baliknya.", href: "/register?role=user", action: "Ikut bergabung" },
  { title: "Sponsor", body: "Cari acara yang sesuai dengan bidang perusahaanmu.", href: "/register?role=sponsor", action: "Temukan acara" },
] as const;

export const previewRows = [
  { title: "Seminar Kepemimpinan Mahasiswa", status: "Terpublikasi", tone: "success", filled: 125, capacity: 200, applications: 12, sponsors: 2 },
  { title: "Workshop Desain Poster Acara", status: "Terpublikasi", tone: "success", filled: 31, capacity: 40, applications: 8, sponsors: 1 },
  { title: "Temu Komunitas Relawan", status: "Terpublikasi", tone: "success", filled: 48, capacity: 120, applications: 5, sponsors: 0 },
] as const;
