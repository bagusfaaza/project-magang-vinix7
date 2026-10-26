# StokKu - Sistem Pencatatan Stok UMKM (Modul 8)

Aplikasi web untuk mencatat stok dan penjualan UMKM secara real time.
Dibuat dengan **HTML + CSS + JavaScript biasa** (tanpa build step), data dinamis dari JSON yang disimpan terstruktur di `localStorage`.

> Link live web: **(isi setelah deploy, mis. https://nama-project.netlify.app)**
> Link Figma Modul 5: **(isi link Figma)**

## Fitur

| Target Modul 8 | Implementasi |
| --- | --- |
| Data dinamis | Produk dan transaksi diambil dari `data/*.json` lewat `fetch`, di-render dengan `.map()` (tanpa kartu/baris yang ditulis berulang). |
| Search / filter | Data Stok: cari nama, filter kategori, status stok, urutan. Riwayat Transaksi: cari ID/pelanggan + filter status. |
| CRUD | Tambah produk, edit stok/harga, hapus produk, impor CSV/JSON, catat transaksi (mengurangi stok), tandai lunas. |
| Form + validasi | Tambah Produk, Catat Transaksi, Edit Stok, Edit Profil, WhatsApp, Kata Sandi. `trim()`, cek kosong/angka/format, pesan error di bawah kolom, tombol terkunci saat mengirim. |
| UX states | Skeleton loading, empty state (+ tombol reset), error state (+ tombol coba lagi), toast (tanpa `alert()`). |
| Real time | Perubahan di satu tab otomatis muncul di tab lain (event `storage`). |

## Sumber data dan layanan form

- **Sumber data:** `data/produk.json` dan `data/transaksi.json`. Saat pertama dibuka, data di-`fetch` lalu disimpan ke `localStorage` (kunci `stokku_*_v1`). Setelah itu perubahan user disimpan di `localStorage`.
- **Layanan form:** state/`localStorage` terstruktur lewat `js/store.js` (lapisan data). Tidak ada API key, jadi tidak ada berkas `.env` yang dipakai. `.gitignore` tetap menyiapkan `.env*` jika nanti memakai MockAPI/Supabase.
- Latensi jaringan disimulasikan (0,6-0,7 detik) supaya skeleton dan status "Menyimpan..." terlihat.

## Menjalankan di lokal

`fetch` tidak bisa dipakai lewat `file://`, jadi jalankan lewat server lokal:

```bash
python3 -m http.server 8000     # lalu buka http://localhost:8000
# atau
npx serve .
```

## Panduan mencoba untuk mentor

1. **Data Stok** (`stok.html`): ketik "ayam" di kolom Cari, pilih filter Minuman / Menipis, ketik "zzzz" untuk melihat empty state, klik **Reset**.
2. Klik **Edit Stok** pada kartu: ubah stok (coba isi `-3` atau kosong untuk melihat error), simpan, lihat toast.
3. **+ Tambah Produk**: kirim form kosong untuk melihat validasi, lalu isi dengan benar. Nama yang sama ditolak.
4. **Impor Stok**: unggah `data/contoh-impor.csv`.
5. **Riwayat Transaksi → + Catat Transaksi Baru**: pilih beberapa produk, total terhitung otomatis, stok berkurang setelah disimpan. Coba jumlah melebihi stok.
6. **Analisis Stok**: grafik produk terlaris dan daftar stok menipis (tombol *Isi stok* membuka Data Stok dengan pencarian terisi).
7. **Error state**: tambahkan `?simulasi=error` di akhir URL halaman mana pun (mis. `stok.html?simulasi=error`).
8. **Sinkron real time**: buka `stok.html` di dua tab, ubah stok di satu tab, tab lain ikut berubah.
9. **Pengaturan → Kembalikan data contoh** untuk mengulang dari awal.

## Struktur

```
index.html  stok.html  tambah_produk.html  analisis_stok.html
transaksi.html  tambah_transaksi.html  pengaturan.html
css/style.css          gaya bersama + responsif
js/store.js            lapisan data (fetch JSON, localStorage, CRUD, sinkron antar tab)
js/ui.js               sidebar/topbar, toast, modal, skeleton, empty/error state, helper validasi
js/<halaman>.js        logika tiap halaman
data/                  produk.json, transaksi.json, contoh-impor.csv
assets/images/         foto produk (sudah dikompres)
```

Nama aplikasi dan menu diatur di satu tempat (`APP_NAME` dan `NAV` di `js/ui.js`).

## Catatan keterbatasan

- Prototipe belum punya backend dan login. Data hanya ada di browser masing-masing; "real time" berlaku antar tab di browser yang sama.
- Form **Ubah Kata Sandi** hanya memvalidasi input dan tidak menyimpan apa pun.

## Alur Git (sesuai brief)

```bash
git checkout -b feat/dynamic-data
# kerjakan bertahap, commit tiap fitur, push, lalu buka Pull Request ke main
```

## Log prompt AI dan perbaikan manual

Lihat `prompt-log-modul8.md`.
