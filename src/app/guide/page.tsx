import Link from "next/link";
import { SiteFrame } from "@/lib/ui";
import styles from "@/features/workspace/landing.module.css";

export default function GuidePage() {
  return <SiteFrame><article className={styles.info}>
    <h1>Satu acara, dari ide sampai laporan.</h1>
    <p>PartnerHub menyatukan pekerjaan penyelenggara, peserta, calon panitia, dan sponsor. Ikuti satu alur di bawah; gunakan pemilih peran pada banner demo untuk melihat sisi lainnya.</p>
    <p><strong>Demo kelas:</strong> seluruh akun dan angka adalah contoh. Perubahan tersimpan di tab browser ini. Tidak ada email, pembayaran, atau kerja sama nyata yang diproses.</p>
    <h2>1. Siapkan acara sebagai penyelenggara</h2>
    <p>Pilih peran Penyelenggara, lalu Susun event baru. Isi nama, jadwal, lokasi, kapasitas, periode pendaftaran, dan identitas organisasi. Aktifkan hanya modul yang dibutuhkan. Simpan draft, lengkapi daftar persiapan pada detail acara, kemudian Publikasikan acara.</p>
    <h2>2. Daftar sebagai peserta atau calon panitia</h2>
    <p>Ganti peran ke Peserta / calon panitia. Buka Detail acara dan Daftar acara. Profil demo digunakan kembali; pertanyaan khusus acara tetap perlu dijawab. Untuk panitia, buka Panitia, pilih divisi, isi motivasi, lalu Kirim lamaran. Pantau hasil di Acara saya.</p>
    <h2>3. Tinjau pendaftaran dan siapkan tiket</h2>
    <p>Kembali sebagai Penyelenggara. Pendaftaran memperlihatkan data peserta. Untuk acara berbayar, konfirmasi atau tolak bukti pembayaran contoh. Pada Kelola panitia, tinjau lamaran dan berikan langkah berikutnya. Buka QR tiket untuk mengirim kode; peserta melihatnya di Acara saya. Di Presensi, pilih tanpa QR, masuk saja, atau masuk dan keluar. Scan berulang tidak menggandakan catatan.</p>
    <h2>4. Bangun dukungan sponsor</h2>
    <p>Ajak sponsor dari detail acara, atau ganti peran ke Sponsor untuk mengirim penawaran. Status sponsor membantu penyelenggara meninjau proposal. Penerimaan merupakan keputusan kedua pihak, bukan hasil otomatis. Setelah diterima, catat benefit dan tautan bukti di Laporan & bukti sponsor.</p>
    <h2>5. Evaluasi dan laporkan</h2>
    <p>Buka Laporan & bukti sponsor untuk melihat ringkasan peserta, panitia, presensi, dan benefit. Periksa bukti sebelum menandainya terverifikasi. Gunakan Cetak / simpan PDF untuk laporan; daftar peserta dan pelamar juga dapat diekspor ke Excel dari modulnya.</p>
    <h2>Yang perlu kamu ketahui</h2>
    <details><summary>Siapa yang membayar?</summary><p>Konsepnya adalah paket per event atau subscription bagi organizer, dengan opsi pelaporan premium. Harga dan persentase success fee belum final. Demo tidak menagih siapa pun.</p></details>
    <details><summary>Bagaimana data profil digunakan?</summary><p>Gunakan data fiktif saat mencoba demo. Nama tampilan digunakan untuk mengenali pendaftar; email tidak ikut diekspor dalam daftar peserta. QR berisi kode acak, bukan data profil. Reset data demo menghapus perubahan dari tab ini.</p></details>
    <details><summary>Apakah pembayaran diproses PartnerHub?</summary><p>Tidak. Bukti pembayaran contoh ditinjau penyelenggara untuk mensimulasikan konfirmasi tiket.</p></details>
    <details><summary>Bagaimana menarik sponsor?</summary><p>Jelaskan audiens, tujuan acara, identitas penyelenggara, bentuk dukungan, dan benefit yang terukur. Catat bukti pelaksanaan setelah acara. Tidak ada jaminan sponsor menerima penawaran.</p></details>
    <p><Link href="/login">Mulai dari akun demo</Link> · <Link href="/">Kembali ke beranda</Link></p>
  </article></SiteFrame>;
}
