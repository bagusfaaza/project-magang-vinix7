Log AI & Evaluasi Refaktorisasi - Modul 6 (Slicing Web UMKM)

Nama Project: Sistem Manajemen UMKM (Web Inventaris & Stok)

Anggota Tim / Mahasiswa: Bagus Faaza Azhar Amin

Repository GitHub: project-magang-vinix7

1. Ringkasan Penggunaan AI

Selama pengerjaan Modul 6, Generative AI digunakan sebagai asisten dalam:

Menghasilkan struktur awal halaman web berbasis wireframe dan PRD proyek UMKM.

Melakukan evaluasi dan refaktorisasi kode HTML agar sesuai dengan standar HTML5 Semantik murni.

Memperbaiki kesalahan (errors) dan peringatan (warnings) hasil validasi W3C Nu HTML Checker.

2. Catatan Prompt & Tanggapan

Prompt 1: Inisialisasi Tampilan Web UMKM

Tujuan: Membuat draf struktur HTML dasar untuk halaman Dashboard berdasarkan wireframe proyek UMKM.

Prompt:

"Bertindaklah sebagai Senior Frontend Engineer dan UI/UX Expert. Buatkan kode antarmuka web responsif menggunakan HTML5 semantik untuk sistem manajemen UMKM dengan tiga halaman utama: Dashboard, Data Stok, dan Pengaturan."

Hasil: Dihasilkan struktur awal file HTML beserta layout CSS pendukung.

Prompt 2: Pemecahan Error Validasi W3C (Obsolete Attribute)

Tujuan: Menghilangkan peringatan atribut usang pada tabel HTML (table border="1").

Prompt:

"Mengapa W3C Validator memberikan warning The border attribute on the table element is obsolete?"

Tindakan Refaktorisasi: Menghapus atribut border="1" dari tag <table> dan menggantinya dengan styling berbasis CSS inline/style tag agar sesuai standar W3C.

Prompt 3: Pemecahan Error Validasi W3C (Hierarki Heading & Section)

Tujuan: Memperbaiki peringatan Section lacks heading dan error The heading h3 follows heading h1.

Prompt:

"Bisa perbaiki code tersebut, itu code yang saya pakai dari yang kamu kirim tadi... [lampiran kode index.html]"

Tindakan Refaktorisasi:

Mengubah tag <section class="stats-container"> menjadi elemen <div> karena hanya bertindak sebagai layout container dan tidak memerlukan heading.

Mengubah elemen <h3>Tabel Riwayat Transaksi</h3> menjadi <h2> untuk menjaga urutan hierarki heading yang benar dari <h1> ke <h2>.

3. Hasil Refaktorisasi Kode

Setelah perbaikan berbasis feedback AI dan uji validasi W3C:

Status Validasi W3C: Document checking completed. No errors or warnings to show.

Elemen HTML5 Semantik yang Terpakai: header, aside, main, section, h1, h2, p, ul, li, table, form, input, button, img, a.

4. Kesimpulan Evaluasi

Penggunaan AI membantu mempercepat proses pembuatan kerangka HTML semantik, mengidentifikasi kesalahan hierarki dokumen, serta memastikan seluruh elemen mematuhi standar accessibility dan standar kualitas kode dari W3C.