# Log AI dan Catatan Perbaikan - Modul 8 (Data Dinamis dan Logika Aplikasi)

Nama project: StokKu - Sistem Manajemen Stok UMKM
Anggota: Bagus Faaza Azhar Amin
Repository: (isi link GitHub)
Link live web: (isi link deploy)

## 1. Alat AI
Claude (Claude Code), dipakai untuk membaca brief Modul 7 dan 8, membaca kode Modul 6, lalu membuat versi dinamis dari wireframe Figma Modul 5.

## 2. Prompt dan tanggapan

| No | Tujuan | Ringkasan prompt | Hasil |
| --- | --- | --- | --- |
| 1 | Memahami konteks | Mengirim zip Modul 6, PDF brief Modul 7 dan 8, lalu meminta AI membaca dan memahami isinya sebelum mengerjakan. | AI merangkum syarat Modul 8 dan temuan di kode: tanpa JS, data hardcode, link antarhalaman rusak, sidebar tidak konsisten. |
| 2 | Acuan desain | Mengirim 3 wireframe Figma (Dashboard, Data Stok, Pengaturan) sebagai acuan tampilan. | Tata letak sidebar, topbar (hamburger, home, cari, Impor Stok), panel filter, dan kartu produk mengikuti wireframe. |
| 3 | Implementasi | Meminta fitur Modul 8 dibangun dengan HTML + JS biasa dan data JSON + localStorage. | Lapisan data `store.js`, komponen `ui.js`, 7 halaman dinamis, validasi, skeleton/empty/error state, toast. |

> Lengkapi dengan prompt asli kamu sendiri jika ada prompt tambahan.

## 3. Catatan perbaikan manual (isi sendiri)

- [ ] Perubahan yang kamu lakukan sendiri (nama web, warna, teks, data produk asli).
- [ ] Bug yang kamu temukan saat mencoba, dan cara memperbaikinya.
- [ ] Hasil uji di layar HP dan hasil deploy.

## 4. Hasil pengujian yang sudah dijalankan

- Semua halaman dimuat tanpa error di console (Chromium, desktop 1280px dan mobile 375px).
- Tidak ada scroll horizontal di 7 halaman pada lebar 375px.
- Search, filter, empty state, edit stok, tambah produk (termasuk nama duplikat), impor CSV, transaksi multi-item yang mengurangi stok, validasi stok berlebih, error state (`?simulasi=error`), menu hamburger, dan modal (Esc/overlay) berjalan sesuai harapan.
