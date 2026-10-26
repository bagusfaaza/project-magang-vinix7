/* ==========================================================
   store.js - lapisan data (data layer)

   Sumber data: file JSON di folder /data (diambil dengan fetch)
   dan disimpan terstruktur di localStorage supaya perubahan
   (tambah/edit/hapus produk, transaksi) tetap ada setelah refresh.

   - Pertama kali dibuka  -> fetch data/*.json -> simpan ke localStorage
   - Berikutnya           -> baca dari localStorage
   - Antar tab            -> event "storage" (sinkron "real time")

   Semua fungsi async dan mensimulasikan latensi jaringan kecil
   supaya skeleton loading dan status "Menyimpan..." terlihat.

   Tambahkan ?simulasi=error di URL untuk mencoba error state.
   ========================================================== */

const Store = (() => {
    const KEYS = {
        produk: "stokku_produk_v1",
        transaksi: "stokku_transaksi_v1",
        profil: "stokku_profil_v1",
    };

    const URLS = {
        produk: "data/produk.json",
        transaksi: "data/transaksi.json",
    };

    const DEFAULT_PROFIL = {
        nama: "Admin UMKM",
        email: "admin@stokku.id",
        namaToko: "Warung UMKM Berkah",
        whatsapp: "6281234567890",
        foto: "",
    };

    const READ_DELAY = 700;
    const WRITE_DELAY = 600;

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    /* localStorage bisa melempar error (mode privat / diblokir),
       jadi dibungkus dan punya cadangan di memori. */
    const memory = {};

    function readRaw(key) {
        try {
            const raw = localStorage.getItem(key);
            if (raw !== null) return raw;
        } catch (e) { /* abaikan */ }
        return key in memory ? memory[key] : null;
    }

    function writeRaw(key, value) {
        memory[key] = value;
        try {
            localStorage.setItem(key, value);
        } catch (e) { /* tetap tersimpan di memori */ }
    }

    function readJSON(key) {
        const raw = readRaw(key);
        if (raw === null) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function writeJSON(key, value) {
        writeRaw(key, JSON.stringify(value));
    }

    function simulateErrorIfRequested() {
        if (new URLSearchParams(location.search).get("simulasi") === "error") {
            throw new Error("Simulasi gagal memuat data (parameter ?simulasi=error aktif).");
        }
    }

    async function loadCollection(name) {
        await wait(READ_DELAY);
        simulateErrorIfRequested();

        const cached = readJSON(KEYS[name]);
        if (Array.isArray(cached)) return cached;

        let response;
        try {
            response = await fetch(URLS[name], { cache: "no-store" });
        } catch (e) {
            throw new Error("Tidak bisa mengambil " + URLS[name] + ". Jalankan lewat server lokal (bukan file://).");
        }
        if (!response.ok) {
            throw new Error("Server menjawab " + response.status + " saat mengambil " + URLS[name] + ".");
        }
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Format " + URLS[name] + " tidak valid.");
        writeJSON(KEYS[name], data);
        return data;
    }

    /* ---------------- Produk ---------------- */
    async function getProduk() {
        return loadCollection("produk");
    }

    async function addProduk(input) {
        await wait(WRITE_DELAY);
        simulateErrorIfRequested();
        const list = await getProdukCepat();
        const dupe = list.some((p) => p.nama.toLowerCase() === input.nama.toLowerCase());
        if (dupe) {
            const err = new Error("Produk dengan nama \"" + input.nama + "\" sudah ada.");
            err.field = "nama";
            throw err;
        }
        const id = list.reduce((max, p) => Math.max(max, p.id), 0) + 1;
        const produk = {
            id,
            nama: input.nama,
            kategori: input.kategori,
            harga: input.harga,
            stok: input.stok,
            stokMinimum: input.stokMinimum,
            gambar: input.gambar || "",
        };
        list.push(produk);
        writeJSON(KEYS.produk, list);
        return produk;
    }

    async function updateProduk(id, patch) {
        await wait(WRITE_DELAY);
        simulateErrorIfRequested();
        const list = await getProdukCepat();
        const idx = list.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error("Produk tidak ditemukan (mungkin sudah dihapus).");
        list[idx] = Object.assign({}, list[idx], patch);
        writeJSON(KEYS.produk, list);
        return list[idx];
    }

    async function deleteProduk(id) {
        await wait(WRITE_DELAY);
        simulateErrorIfRequested();
        const list = await getProdukCepat();
        const next = list.filter((p) => p.id !== id);
        if (next.length === list.length) throw new Error("Produk tidak ditemukan (mungkin sudah dihapus).");
        writeJSON(KEYS.produk, next);
    }

    /* Impor massal: cocokkan berdasarkan nama. Nama sama -> perbarui, baru -> tambah. */
    async function importProduk(rows) {
        await wait(WRITE_DELAY);
        simulateErrorIfRequested();
        const list = await getProdukCepat();
        let ditambah = 0;
        let diperbarui = 0;
        rows.forEach((row) => {
            const found = list.find((p) => p.nama.toLowerCase() === row.nama.toLowerCase());
            if (found) {
                found.kategori = row.kategori;
                found.harga = row.harga;
                found.stok = row.stok;
                diperbarui++;
            } else {
                const id = list.reduce((max, p) => Math.max(max, p.id), 0) + 1;
                list.push({
                    id,
                    nama: row.nama,
                    kategori: row.kategori,
                    harga: row.harga,
                    stok: row.stok,
                    stokMinimum: row.stokMinimum || 5,
                    gambar: "",
                });
                ditambah++;
            }
        });
        writeJSON(KEYS.produk, list);
        return { ditambah, diperbarui };
    }

    /* Baca cepat tanpa delay (dipakai di dalam operasi tulis) */
    async function getProdukCepat() {
        const cached = readJSON(KEYS.produk);
        if (Array.isArray(cached)) return cached;
        const response = await fetch(URLS.produk, { cache: "no-store" });
        const data = await response.json();
        writeJSON(KEYS.produk, data);
        return data;
    }

    async function getTransaksiCepat() {
        const cached = readJSON(KEYS.transaksi);
        if (Array.isArray(cached)) return cached;
        const response = await fetch(URLS.transaksi, { cache: "no-store" });
        const data = await response.json();
        writeJSON(KEYS.transaksi, data);
        return data;
    }

    /* ---------------- Transaksi ---------------- */
    async function getTransaksi() {
        return loadCollection("transaksi");
    }

    /* Mencatat transaksi sekaligus mengurangi stok. Semua dicek dulu,
       baru disimpan, supaya tidak ada stok yang terpotong setengah jalan. */
    async function addTransaksi(input) {
        await wait(WRITE_DELAY);
        simulateErrorIfRequested();
        const produk = await getProdukCepat();
        const transaksi = await getTransaksiCepat();

        const items = [];
        // jumlahkan jika produk yang sama dipilih lebih dari sekali
        const perProduk = new Map();
        input.items.forEach((it) => {
            perProduk.set(it.produkId, (perProduk.get(it.produkId) || 0) + it.jumlah);
        });

        for (const [produkId, jumlah] of perProduk) {
            const p = produk.find((x) => x.id === produkId);
            if (!p) throw new Error("Salah satu produk tidak ditemukan.");
            if (jumlah > p.stok) {
                throw new Error("Stok " + p.nama + " tidak cukup (sisa " + p.stok + ").");
            }
            items.push({ produkId: p.id, nama: p.nama, harga: p.harga, jumlah });
        }

        items.forEach((it) => {
            produk.find((x) => x.id === it.produkId).stok -= it.jumlah;
        });

        const maxNo = transaksi.reduce((max, t) => {
            const n = parseInt(String(t.id).replace(/\D/g, ""), 10) || 0;
            return Math.max(max, n);
        }, 0);

        const trx = {
            id: "TRX-" + String(maxNo + 1).padStart(3, "0"),
            tanggal: new Date().toISOString().slice(0, 10),
            pelanggan: input.pelanggan,
            items,
            total: items.reduce((sum, it) => sum + it.harga * it.jumlah, 0),
            status: input.status,
        };

        transaksi.unshift(trx);
        writeJSON(KEYS.produk, produk);
        writeJSON(KEYS.transaksi, transaksi);
        return trx;
    }

    async function setStatusTransaksi(id, status) {
        await wait(WRITE_DELAY);
        simulateErrorIfRequested();
        const list = await getTransaksiCepat();
        const trx = list.find((t) => t.id === id);
        if (!trx) throw new Error("Transaksi tidak ditemukan.");
        trx.status = status;
        writeJSON(KEYS.transaksi, list);
        return trx;
    }

    /* ---------------- Profil (sinkron, kecil) ---------------- */
    function getProfil() {
        return Object.assign({}, DEFAULT_PROFIL, readJSON(KEYS.profil) || {});
    }

    async function saveProfil(patch) {
        await wait(WRITE_DELAY);
        simulateErrorIfRequested();
        const next = Object.assign(getProfil(), patch);
        writeJSON(KEYS.profil, next);
        return next;
    }

    /* ---------------- Utilitas ---------------- */
    function resetData() {
        Object.values(KEYS).forEach((key) => {
            delete memory[key];
            try {
                localStorage.removeItem(key);
            } catch (e) { /* abaikan */ }
        });
    }

    /* Panggil callback ketika tab lain mengubah data (sinkron antar tab) */
    function onExternalChange(callback) {
        window.addEventListener("storage", (event) => {
            if (Object.values(KEYS).includes(event.key)) callback(event.key);
        });
    }

    return {
        KEYS,
        getProduk,
        addProduk,
        updateProduk,
        deleteProduk,
        importProduk,
        getTransaksi,
        addTransaksi,
        setStatusTransaksi,
        getProfil,
        saveProfil,
        resetData,
        onExternalChange,
    };
})();
