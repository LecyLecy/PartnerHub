import type { OrganizerType, Role } from "@/contracts/account";

export const roles: readonly { value: Role; title: string; description: string; can: readonly string[] }[] = [
  { value: "user", title: "Peserta", description: "Cari acara dan ikuti pendaftaranmu.", can: ["Mendaftar ke acara", "Melihat referensi tiket", "Menerima pembaruan acara"] },
  { value: "organizer", title: "Penyelenggara", description: "Siapkan acara dan tampilkan identitas organisasimu.", can: ["Menyusun dan mengelola acara", "Mengunggah logo acara dan sponsor", "Melihat pendaftar acaramu"] },
  { value: "sponsor", title: "Perusahaan sponsor", description: "Temukan acara dan ajukan proposal dukungan.", can: ["Menjelajahi acara", "Mengirim proposal dukungan", "Memantau manfaat sponsor"] },
];

export const organizerTypes: readonly { value: OrganizerType; label: string; description: string }[] = [
  { value: "individual", label: "Individu", description: "Kamu menyelenggarakan atas nama pribadi." },
  { value: "organization", label: "Organisasi", description: "BEM, himpunan, UKM, atau organisasi lain." },
  { value: "community", label: "Komunitas", description: "Komunitas hobi, profesi, atau sosial." },
  { value: "institution", label: "Institusi", description: "Kampus, sekolah, atau lembaga resmi." },
];

export const interests = ["Seminar & diskusi", "Workshop", "Kegiatan komunitas"].map((value) => ({ value, label: value }));

export const industries = ["Teknologi", "Makanan & minuman", "Keuangan & perbankan", "Pendidikan", "Kesehatan", "Media & hiburan", "Ritel & FMCG", "Transportasi & logistik", "Energi & manufaktur", "Lainnya"].map((value) => ({ value, label: value }));

export const scales = [
  { value: "startup", label: "Startup" },
  { value: "umkm", label: "UKM" },
  { value: "corporate", label: "Korporasi" },
] as const;

export const sponsorCategories = ["Dana", "Produk", "Jasa atau layanan", "Media partner", "Tempat atau fasilitas"].map((value) => ({ value, label: value }));

export const budgets = ["Di bawah Rp5 juta", "Rp5 juta sampai Rp25 juta", "Rp25 juta sampai Rp100 juta", "Di atas Rp100 juta"].map((value) => ({ value, label: value }));

export const documentLabels = {
  identity: "Identitas penanggung jawab (KTP)",
  legal: "Surat tugas atau legalitas organisasi",
  company: "Dokumen legalitas perusahaan (NIB, SIUP, atau akta)",
} as const;
