/** Illustrative copy for the landing page. Nothing here is a customer claim or a measured result. */

export const navLinks = [
  { href: "#fitur", label: "Cara kerja" },
  { href: "#keunggulan", label: "Keunggulan" },
  { href: "#faq", label: "Tanya jawab" },
] as const;

export const organizations = ["BEM", "Himpunan mahasiswa", "UKM", "Komunitas pemuda", "Panitia kampus", "Organizer acara kecil", "Komunitas relawan", "Perusahaan sponsor"] as const;

export const feed = [
  { title: "Pendaftar baru", detail: "Seminar Kepemimpinan: 1 pendaftar" },
  { title: "Lamaran panitia", detail: "Divisi Dokumentasi: 1 lamaran" },
  { title: "Tanggapan sponsor", detail: "Perusahaan contoh menerima permintaan" },
  { title: "Pelamar diterima", detail: "Catatan langkah berikutnya terkirim" },
  { title: "Proposal masuk", detail: "Penawaran untuk Workshop Poster" },
] as const;

export const modules = [
  { key: "registration", label: "Pendaftaran peserta", note: "Tiket berupa referensi", on: true },
  { key: "committee", label: "Rekrutmen panitia", note: "Divisi dan seleksi", on: true },
  { key: "attendance", label: "Kehadiran QR", note: "Dalam pengembangan", on: false },
  { key: "sponsorship", label: "Sponsorship", note: "Proposal dan permintaan", on: true },
] as const;

export const applicantNote = "Selamat bergabung. Langkah berikutnya: masuk ke grup WhatsApp panitia dan hadir di rapat perdana hari Sabtu pukul 10.00.";

export const flowSteps = ["Lamaran masuk", "Daftar pendek", "Wawancara", "Diterima"] as const;

export const questionIdeas = [
  "Pengalaman kepanitiaan apa yang pernah kamu ikuti?",
  "Alat apa yang kamu kuasai untuk tugas ini?",
  "Berapa jam per minggu kamu bisa membantu?",
  "Bagian acara mana yang ingin kamu pelajari?",
  "Apakah kamu bisa hadir di hari pelaksanaan?",
] as const;

export const noteIdeas = [
  "Masuk ke grup WhatsApp panitia.",
  "Hadir di rapat perdana hari Sabtu pukul 10.00.",
  "Isi formulir data panitia sebelum rapat.",
  "Hubungi koordinator divisi Dokumentasi.",
  "Bawa laptop untuk sesi pembagian tugas.",
] as const;

export const journey = [
  { key: "draft", title: "Draft acara disimpan", detail: "Judul, jadwal, lokasi, dan kapasitas.", tone: "success" },
  { key: "identity", title: "Identitas ditambahkan", detail: "Logo acara, organisasi, dan sponsor.", tone: "success" },
  { key: "opening", title: "Lowongan panitia dibuka", detail: "Divisi dan satu pertanyaan untuk pelamar.", tone: "active" },
  { key: "select", title: "Lamaran diseleksi", detail: "Daftar pendek, wawancara, lalu keputusan.", tone: "neutral" },
  { key: "offer", title: "Permintaan sponsor dikirim", detail: "Ke sponsor terverifikasi, dengan tautan proposal.", tone: "neutral" },
  { key: "answer", title: "Sponsor menanggapi", detail: "Menerima atau menolak satu kali.", tone: "neutral" },
  { key: "benefit", title: "Manfaat sponsor dicatat", detail: "Dalam pengembangan.", tone: "neutral" },
] as const;

export const compareTabs = [
  { key: "daftar", label: "Pendaftaran", title: "Peserta tidak perlu mengisi ulang.", before: "Formulir berbeda untuk setiap acara, data tersebar di spreadsheet.", after: "Peserta mendaftar dengan satu akun dan menyimpan referensi tiket di halaman tiketnya.", mock: "ticket" },
  { key: "panitia", label: "Panitia", title: "Seleksi panitia punya urutan yang jelas.", before: "Lamaran masuk lewat chat pribadi dan sulit dilacak statusnya.", after: "Pelamar memilih divisi dan menjawab pertanyaan. Penyelenggara menyeleksi, lalu menulis langkah berikutnya untuk yang diterima.", mock: "applicant" },
  { key: "sponsor", label: "Sponsor", title: "Penawaran berjalan dua arah.", before: "Proposal dikirim lewat email yang tercecer, tanpa status.", after: "Sponsor mengajukan dukungan ke acara, dan penyelenggara dapat mengajak sponsor terverifikasi. Tanggapannya tercatat.", mock: "offer" },
  { key: "tiket", label: "Tiket dan kehadiran", title: "QR dikirim per acara.", before: "Daftar hadir ditulis tangan dan dicocokkan belakangan.", after: "Penyelenggara membuat dan mengirim QR tanpa data pribadi ke peserta. Pemindaian di pintu masuk masih dalam pengembangan.", mock: "qr" },
] as const;

export const scenarios = [
  { title: "BEM menyiapkan seminar", body: "Membuka lowongan panitia dengan divisi Acara, Humas, dan Dokumentasi, lalu menyeleksi pelamar dari satu daftar." },
  { title: "UKM mencari sponsor", body: "Mengirim permintaan dukungan ke sponsor terverifikasi, lengkap dengan tautan proposal." },
  { title: "Komunitas relawan membuka acara", body: "Menyusun draft, menambahkan logo, lalu memantau pendaftar dari satu ruang kerja." },
  { title: "Sponsor memilih acara", body: "Melihat acara terbuka beserta penyelenggara, jadwal, dan lokasi sebelum mengajukan dukungan." },
  { title: "Himpunan merekrut panitia inti", body: "Menulis pertanyaan khusus untuk pelamar dan mengirim catatan langkah berikutnya ke yang diterima." },
  { title: "Peserta mengikuti banyak acara", body: "Satu akun menyimpan referensi tiket dari semua acara yang diikuti." },
] as const;

export const faqCategories = [
  { key: "umum", label: "Umum" },
  { key: "akun", label: "Akun dan data" },
  { key: "sponsor", label: "Sponsorship" },
] as const;

export const faqItems: Record<string, readonly { key: string; question: string; answer: string }[]> = {
  umum: [
    { key: "apa", question: "Apa itu PartnerHub?", answer: "Ruang kerja untuk menyiapkan acara: pendaftaran, rekrutmen panitia, dan sponsorship dalam satu tempat." },
    { key: "bayar", question: "Apakah PartnerHub menjual tiket atau memproses pembayaran?", answer: "Tidak. PartnerHub bukan marketplace tiket dan tidak memproses pembayaran." },
    { key: "qr", question: "Apakah tiket QR sudah tersedia?", answer: "Sebagian. Penyelenggara membuat dan mengirim QR per acara, dan peserta menampilkannya dari halaman tiket. Kodenya tidak memuat data pribadi. Pemindaian di pintu masuk masih dalam pengembangan." },
  ],
  akun: [
    { key: "siapa", question: "Siapa yang bisa mendaftar?", answer: "Peserta, penyelenggara, dan perusahaan sponsor. Satu akun memiliki satu peran. Penyelenggara dan sponsor perlu verifikasi email dan pemeriksaan admin." },
    { key: "data", question: "Data apa yang diminta?", answer: "Hanya data yang dibutuhkan untuk perannya. Kebijakan Privasi final belum tersedia, jadi halaman itu menjelaskan statusnya." },
    { key: "lupa", question: "Bagaimana jika lupa password?", answer: "Gunakan Lupa password di halaman masuk. Pengiriman email pemulihan bergantung pada layanan backend yang masih dalam pengembangan." },
  ],
  sponsor: [
    { key: "beda", question: "Apa bedanya proposal dan permintaan sponsor?", answer: "Proposal dikirim sponsor ke sebuah acara. Permintaan dikirim penyelenggara ke sponsor terverifikasi. Keduanya terpisah." },
    { key: "match", question: "Apakah ada pencocokan otomatis?", answer: "Belum. Sponsor melihat katalog acara terbuka, tetapi tidak ada pencocokan otomatis, chat, atau pembayaran." },
    { key: "manfaat", question: "Bagaimana manfaat sponsor dicatat?", answer: "Manfaat yang disepakati dicatat dan diverifikasi penyelenggara. Pencatatan otomatis dari permintaan yang diterima masih dalam pengembangan." },
  ],
};

export const roleRows = [
  { title: "Penyelenggara", body: "Susun draft, buka lowongan panitia, ajak sponsor, dan pantau pendaftar dari ruang kerjamu.", href: "/register?role=organizer", action: "Siapkan acaramu" },
  { title: "Peserta", body: "Temukan acara terbuka, tampilkan QR tiket, dan lamar jadi panitia. Pemindaian di pintu masuk masih dalam pengembangan.", href: "/register?role=user", action: "Ikuti acaranya" },
  { title: "Sponsor", body: "Kenali acara dan penyelenggaranya, kirim penawaran dukungan, lalu tanggapi permintaan dari penyelenggara.", href: "/register?role=sponsor", action: "Temukan acara untuk didukung" },
] as const;

export const previewRows = [
  { title: "Seminar Kepemimpinan Mahasiswa", status: "Terpublikasi", tone: "success", filled: 125, capacity: 200, applications: 12, sponsors: 2 },
  { title: "Workshop Desain Poster Acara", status: "Terpublikasi", tone: "success", filled: 31, capacity: 40, applications: 8, sponsors: 1 },
  { title: "Temu Komunitas Relawan", status: "Terpublikasi", tone: "success", filled: 48, capacity: 120, applications: 5, sponsors: 0 },
  { title: "Rencana Pelatihan Panitia", status: "Draft", tone: "neutral", filled: 0, capacity: 60, applications: 0, sponsors: 0 },
  { title: "Diskusi Akhir Tahun Lalu", status: "Selesai", tone: "neutral", filled: 72, capacity: 80, applications: 14, sponsors: 1 },
] as const;
