/** Bundled illustrative photography. Never use these as company marks or profile identities. */
export const demoMedia = {
  seminar: { path: "/demo/photos/seminar.jpg", pexelsId: 1181406, description: "Diskusi dan kolaborasi di ruang pertemuan" },
  teamwork: { path: "/demo/photos/teamwork.jpg", pexelsId: 3184433, description: "Kerja sama tim di meja kerja" },
  library: { path: "/demo/photos/library.jpg", pexelsId: 590493, description: "Rak buku di perpustakaan" },
  volunteers: { path: "/demo/photos/volunteers.jpg", pexelsId: 5029923, description: "Relawan menanam pohon bersama" },
  design: { path: "/demo/photos/design.jpg", pexelsId: 196644, description: "Sketsa dan perencanaan desain" },
  photography: { path: "/demo/photos/photography.jpg", pexelsId: 274973, description: "Kamera untuk belajar fotografi" },
  food: { path: "/demo/photos/food.jpg", pexelsId: 1640777, description: "Sajian sayuran dan makanan sehat" },
  finance: { path: "/demo/photos/finance.jpg", pexelsId: 210607, description: "Papan informasi pasar keuangan" },
} as const;
export type DemoMediaKey = keyof typeof demoMedia;
