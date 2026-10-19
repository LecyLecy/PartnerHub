import Link from "next/link";
import { SiteFrame } from "@/lib/ui";
import styles from "@/features/workspace/landing.module.css";

export default function GuidePage() {
  return <SiteFrame><article className={styles.info}>
    <h1>Satu acara, dari ide sampai laporan.</h1>
    <p>PartnerHub menyatukan pekerjaan penyelenggara, peserta, calon panitia, dan sponsor. Ikuti satu alur di bawah; gunakan pemilih peran di bagian atas untuk melihat sisi lainnya.</p>
    <h2>1. Siapkan acara sebagai penyelenggara</h2>
    <p>Pilih peran Penyelenggara, lalu Susun event baru. Isi nama, jadwal, lokasi, kapasitas, periode pendaftaran, dan identitas organisasi. Aktifkan hanya modul yang dibutuhkan. Klik Selesai susunan untuk menyimpannya di Arsip acara. Lengkapi detail, lalu unggah dengan pembayaran per event atau subscription yang sesuai.</p>
    <h2>2. Daftar sebagai peserta atau calon panitia</h2>
    <p>Ganti peran ke Peserta / calon panitia. Buka Detail acara dan Daftar acara. Data profil digunakan kembali; pertanyaan khusus acara tetap perlu dijawab. Untuk panitia, buka Panitia, pilih divisi, isi motivasi, lalu Kirim lamaran. Pantau hasil di Lamaran saya.</p>
    <h2>3. Tinjau pendaftaran dan siapkan tiket</h2>
    <p>Kembali sebagai Penyelenggara. Pendaftaran memperlihatkan data peserta. Untuk acara berbayar, konfirmasi atau tolak bukti pembayaran. Pada Kelola panitia, tinjau lamaran dan berikan langkah berikutnya. Buka QR tiket untuk mengirim kode; peserta melihatnya di Tiket saya. QR hanya tersedia jika modul pendaftaran dan presensi diaktifkan; panitia yang diterima dapat memindai dari Lamaran saya. Di Presensi, pilih tanpa QR, masuk saja, atau masuk dan keluar. Scan berulang tidak menggandakan catatan.</p>
    <h2>4. Bangun dukungan sponsor</h2>
    <p>Ajak sponsor dari detail acara, atau ganti peran ke Sponsor untuk mengirim penawaran. Status sponsor membantu penyelenggara meninjau proposal. Penerimaan merupakan keputusan kedua pihak, bukan hasil otomatis. Setelah diterima, catat benefit dan tautan bukti di Laporan & bukti sponsor.</p>
    <h2>5. Evaluasi dan laporkan</h2>
    <p>Buka Laporan & bukti sponsor untuk melihat ringkasan peserta, panitia, presensi, dan benefit. Periksa bukti sebelum menandainya terverifikasi. Gunakan Cetak / simpan PDF untuk laporan; daftar peserta dan pelamar juga dapat diekspor ke Excel dari modulnya.</p>
    <h2>Yang perlu kamu ketahui</h2>
    <section><h3>Siapa yang membayar?</h3><p>Penyelenggara membayar per event, kecuali subscription aktifnya sudah mencakup kapasitas dan jadwal acara. Peserta, calon panitia, dan sponsor tidak membeli paket penyelenggara. Buka Harga untuk membandingkan paket.</p></section>
    <section><h3>Bagaimana data profil digunakan?</h3><p>Nama tampilan digunakan untuk mengenali pendaftar; email tidak ikut diekspor dalam daftar peserta. QR berisi kode acak, bukan data profil. Periksa kembali data sebelum mengirim pendaftaran.</p></section>
    <section><h3>Apakah pembayaran diproses PartnerHub?</h3><p>Tidak. Bukti pembayaran contoh ditinjau penyelenggara sebelum pendaftaran dikonfirmasi.</p></section>
    <section><h3>Bagaimana menarik sponsor?</h3><p>Jelaskan audiens, tujuan acara, identitas penyelenggara, bentuk dukungan, dan benefit yang terukur. Catat bukti pelaksanaan setelah acara. Tidak ada jaminan sponsor menerima penawaran.</p></section>
    <p><Link href="/login">Masuk ke akun</Link> · <Link href="/">Kembali ke beranda</Link></p>
  </article></SiteFrame>;
}
