/* Data Stok: render kartu dari data, search + filter, edit stok, hapus, impor */
(function () {
    UI.initShell({ search: true, importBtn: true });

    const grid = document.getElementById("grid");
    const filterGrid = document.getElementById("filter-grid");
    const resultInfo = document.getElementById("result-info");
    const searchInput = document.getElementById("cari");

    const STATUS_OPTIONS = [
        { value: "semua", label: "Semua status" },
        { value: "aman", label: "Aman" },
        { value: "menipis", label: "Menipis" },
        { value: "habis", label: "Habis" },
    ];

    const SORT_OPTIONS = [
        { value: "nama", label: "Nama (A-Z)" },
        { value: "stok-asc", label: "Stok terendah" },
        { value: "stok-desc", label: "Stok tertinggi" },
        { value: "harga-asc", label: "Harga termurah" },
    ];

    // Di layar kecil panel filter ditutup dulu supaya daftar produk langsung terlihat
    if (window.matchMedia("(max-width: 860px)").matches) {
        document.getElementById("filter-panel").removeAttribute("open");
    }

    const filters = { q: "", kategori: "semua", status: "semua", urut: "nama" };

    // Bisa dibuka dari halaman lain dengan ?cari=nama produk (mis. dari Analisis Stok)
    const awal = UI.clean(new URLSearchParams(location.search).get("cari") || "");
    if (awal) {
        filters.q = awal;
        searchInput.value = awal;
    }
    let produk = [];
    let editing = null;

    /* ---------------- Filter panel ---------------- */
    function radioGroup(name, legend, options) {
        return '<div class="filter-group"><fieldset><legend>' + UI.esc(legend) + "</legend>" +
            options.map((o) =>
                '<label class="radio-row"><input type="radio" name="' + name + '" value="' + UI.esc(o.value) + '"' +
                (filters[name] === o.value ? " checked" : "") + "> " + UI.esc(o.label) + "</label>"
            ).join("") + "</fieldset></div>";
    }

    function renderFilters() {
        const kategori = Array.from(new Set(produk.map((p) => p.kategori))).sort();
        const kategoriOptions = [{ value: "semua", label: "Semua kategori" }]
            .concat(kategori.map((k) => ({ value: k, label: k })));
        // jika kategori terpilih sudah tidak ada (mis. produk terakhirnya dihapus)
        if (filters.kategori !== "semua" && !kategori.includes(filters.kategori)) filters.kategori = "semua";

        filterGrid.innerHTML =
            radioGroup("kategori", "Kategori", kategoriOptions) +
            radioGroup("status", "Status stok", STATUS_OPTIONS) +
            radioGroup("urut", "Urutkan", SORT_OPTIONS);
    }

    function applyFilters() {
        const q = filters.q.toLowerCase();
        const list = produk.filter((p) => {
            if (q && !p.nama.toLowerCase().includes(q)) return false;
            if (filters.kategori !== "semua" && p.kategori !== filters.kategori) return false;
            if (filters.status !== "semua" && UI.stokStatus(p).key !== filters.status) return false;
            return true;
        });
        const sorters = {
            "nama": (a, b) => a.nama.localeCompare(b.nama, "id"),
            "stok-asc": (a, b) => a.stok - b.stok,
            "stok-desc": (a, b) => b.stok - a.stok,
            "harga-asc": (a, b) => a.harga - b.harga,
        };
        return list.sort(sorters[filters.urut]);
    }

    function filterActive() {
        return filters.q !== "" || filters.kategori !== "semua" || filters.status !== "semua";
    }

    /* ---------------- Render kartu ---------------- */
    function cardHTML(p) {
        const s = UI.stokStatus(p);
        const img = p.gambar
            ? '<img src="' + UI.esc(p.gambar) + '" alt="Foto ' + UI.esc(p.nama) + '" loading="lazy">'
            : '<div class="no-img" aria-hidden="true">' + UI.esc(p.nama.charAt(0).toUpperCase()) + "</div>";
        return '<article class="product-card">' +
            '<div class="thumb">' + img + '<span class="badge ' + s.cls + '">' + s.label + "</span></div>" +
            '<div class="info"><h3>' + UI.esc(p.nama) + "</h3>" +
            '<div class="meta"><span>' + UI.esc(p.kategori) + " &middot; " + UI.rupiah(p.harga) + "</span>" +
            "<span>Stok <strong>" + p.stok + "</strong></span></div></div>" +
            '<div class="actions"><button type="button" class="btn btn-ghost" data-edit="' + p.id + '">Edit Stok</button></div>' +
            "</article>";
    }

    function render() {
        grid.setAttribute("aria-busy", "false");

        if (!produk.length) {
            grid.innerHTML = UI.emptyState({
                icon: "📦",
                title: "Belum ada produk",
                text: "Tambahkan produk pertama kamu atau impor dari file CSV/JSON.",
                actionLabel: "+ Tambah Produk",
                action: "tambah",
            });
            resultInfo.textContent = "";
            return;
        }

        const list = applyFilters();
        resultInfo.textContent = "Menampilkan " + list.length + " dari " + produk.length + " produk";

        if (!list.length) {
            grid.innerHTML = UI.emptyState({
                icon: "🔍",
                title: "Yah, produk tidak ditemukan",
                text: "Coba kata kunci lain atau hapus filter yang sedang aktif.",
                actionLabel: "Reset pencarian & filter",
                action: "reset",
            });
            return;
        }

        grid.innerHTML = list.map(cardHTML).join("");
        grid.querySelectorAll("img").forEach((img) => {
            img.addEventListener("error", () => {
                img.replaceWith(Object.assign(document.createElement("div"), {
                    className: "no-img",
                    textContent: img.alt.replace("Foto ", "").charAt(0).toUpperCase(),
                }));
            }, { once: true });
        });
    }

    async function load(options) {
        const silent = options && options.silent;
        if (!silent) {
            grid.setAttribute("aria-busy", "true");
            grid.innerHTML = UI.skeletonCards(6);
            resultInfo.textContent = "Memuat data...";
        }
        try {
            produk = await Store.getProduk();
            renderFilters();
            render();
        } catch (err) {
            grid.setAttribute("aria-busy", "false");
            grid.innerHTML = UI.errorState(err.message);
            resultInfo.textContent = "";
        }
    }

    function resetFilters() {
        filters.q = "";
        filters.kategori = "semua";
        filters.status = "semua";
        filters.urut = "nama";
        searchInput.value = "";
        renderFilters();
        render();
    }

    /* ---------------- Event: filter, cari, aksi ---------------- */
    searchInput.addEventListener("input", UI.debounce(() => {
        filters.q = UI.clean(searchInput.value);
        render();
    }, 180));

    filterGrid.addEventListener("change", (e) => {
        if (e.target.matches('input[type="radio"]')) {
            filters[e.target.name] = e.target.value;
            render();
        }
    });

    document.getElementById("btn-reset").addEventListener("click", () => {
        resetFilters();
        UI.toast("Filter direset", "info");
    });

    grid.addEventListener("click", (e) => {
        const edit = e.target.closest("[data-edit]");
        if (edit) return openEdit(Number(edit.dataset.edit));
        const act = e.target.closest("[data-action]");
        if (!act) return;
        if (act.dataset.action === "reset") resetFilters();
        if (act.dataset.action === "retry") load();
        if (act.dataset.action === "tambah") location.href = "tambah_produk.html";
    });

    /* ---------------- Modal Edit Stok ---------------- */
    const modal = UI.modal(document.getElementById("modal-edit"));
    const form = document.getElementById("form-edit");
    const inStok = document.getElementById("edit-stok");
    const inHarga = document.getElementById("edit-harga");
    const inMin = document.getElementById("edit-min");
    const btnSimpan = document.getElementById("btn-simpan");
    const btnHapus = document.getElementById("btn-hapus");

    function openEdit(id) {
        editing = produk.find((p) => p.id === id);
        if (!editing) return;
        document.getElementById("edit-nama").textContent = editing.nama;
        inStok.value = editing.stok;
        inHarga.value = editing.harga;
        inMin.value = editing.stokMinimum;
        [inStok, inHarga, inMin].forEach(UI.clearFieldError);
        modal.open();
    }

    function nudge(delta) {
        const now = parseInt(inStok.value, 10);
        inStok.value = Math.max(0, (isNaN(now) ? 0 : now) + delta);
        UI.clearFieldError(inStok);
    }

    document.getElementById("stok-min").addEventListener("click", () => nudge(-1));
    document.getElementById("stok-plus").addEventListener("click", () => nudge(1));

    /* Validasi bilangan bulat tidak negatif. Mengembalikan angka atau null (dan menampilkan error). */
    function readInt(input, label, opts) {
        const raw = UI.clean(input.value);
        UI.clearFieldError(input);
        if (raw === "") {
            UI.setFieldError(input, label + " wajib diisi.");
            return null;
        }
        if (!/^\d+$/.test(raw)) {
            UI.setFieldError(input, label + " harus berupa bilangan bulat, tanpa titik atau minus.");
            return null;
        }
        const n = Number(raw);
        if (opts && opts.min !== undefined && n < opts.min) {
            UI.setFieldError(input, label + " minimal " + opts.min + ".");
            return null;
        }
        if (opts && opts.max !== undefined && n > opts.max) {
            UI.setFieldError(input, label + " maksimal " + opts.max.toLocaleString("id-ID") + ".");
            return null;
        }
        return n;
    }

    [inStok, inHarga, inMin].forEach((el) => el.addEventListener("input", () => UI.clearFieldError(el)));

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!editing) return;
        const stok = readInt(inStok, "Jumlah stok", { min: 0, max: 100000 });
        const harga = readInt(inHarga, "Harga", { min: 100, max: 100000000 });
        const stokMinimum = readInt(inMin, "Batas stok menipis", { min: 0, max: 10000 });
        if (stok === null || harga === null || stokMinimum === null) {
            const firstBad = [inStok, inHarga, inMin].find((el) => el.getAttribute("aria-invalid") === "true");
            if (firstBad) firstBad.focus();
            return;
        }

        UI.setBusy(btnSimpan, true, "Menyimpan...");
        btnHapus.disabled = true;
        try {
            const baru = await Store.updateProduk(editing.id, { stok, harga, stokMinimum });
            produk = produk.map((p) => (p.id === baru.id ? baru : p));
            modal.close();
            render();
            UI.toast("Stok " + editing.nama + " diperbarui menjadi " + stok + ".");
            await load({ silent: true });
        } catch (err) {
            UI.toast(err.message, "error");
        } finally {
            UI.setBusy(btnSimpan, false);
            btnHapus.disabled = false;
        }
    });

    btnHapus.addEventListener("click", async () => {
        if (!editing) return;
        const target = editing;
        const ok = await UI.confirmDialog({
            title: "Hapus produk ini?",
            text: "\"" + target.nama + "\" akan dihapus dari daftar stok. Riwayat transaksi lama tidak ikut terhapus.",
            okLabel: "Ya, hapus",
            danger: true,
        });
        if (!ok) return;
        try {
            await Store.deleteProduk(target.id);
            produk = produk.filter((p) => p.id !== target.id);
            modal.close();
            renderFilters();
            render();
            UI.toast("Produk " + target.nama + " dihapus.");
            await load({ silent: true });
        } catch (err) {
            UI.toast(err.message, "error");
        }
    });

    /* ---------------- Impor Stok (CSV / JSON) ---------------- */
    const btnImpor = document.getElementById("btn-impor");
    const fileImpor = document.getElementById("file-impor");
    const MAX_BYTES = 1024 * 1024;
    const MAX_ROWS = 500;

    function parseCSV(text) {
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) throw new Error("File CSV kosong atau hanya berisi header.");
        const sep = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
        const header = lines[0].split(sep).map((h) => h.trim().toLowerCase());
        return lines.slice(1).map((line) => {
            const cells = line.split(sep).map((c) => c.trim());
            const row = {};
            header.forEach((h, i) => (row[h] = cells[i]));
            return row;
        });
    }

    function normalizeRows(rawRows) {
        const rows = [];
        const problems = [];
        rawRows.forEach((r, i) => {
            const nama = UI.clean(r.nama);
            const kategori = UI.clean(r.kategori) || "Lainnya";
            const harga = Number(String(r.harga).replace(/[^\d]/g, ""));
            const stok = Number(String(r.stok).replace(/[^\d]/g, ""));
            const stokMinimum = r.stokminimum !== undefined && r.stokminimum !== ""
                ? Number(String(r.stokminimum).replace(/[^\d]/g, "")) : undefined;
            const baris = "Baris " + (i + 1);
            if (!nama) return problems.push(baris + ": nama kosong");
            if (String(r.harga).trim() === "" || !(harga >= 100)) return problems.push(baris + " (" + nama + "): harga tidak valid");
            if (String(r.stok).trim() === "" || isNaN(stok)) return problems.push(baris + " (" + nama + "): stok tidak valid");
            rows.push({ nama, kategori, harga, stok, stokMinimum });
        });
        return { rows, problems };
    }

    btnImpor.addEventListener("click", () => fileImpor.click());

    fileImpor.addEventListener("change", async () => {
        const file = fileImpor.files[0];
        fileImpor.value = "";
        if (!file) return;

        if (file.size > MAX_BYTES) return UI.toast("File terlalu besar (maksimal 1 MB).", "error");
        const isJSON = /\.json$/i.test(file.name);
        const isCSV = /\.csv$/i.test(file.name);
        if (!isJSON && !isCSV) return UI.toast("Format file harus .csv atau .json.", "error");

        UI.setBusy(btnImpor, true, "Mengimpor...");
        try {
            const text = await file.text();
            let rawRows;
            if (isJSON) {
                const parsed = JSON.parse(text);
                if (!Array.isArray(parsed)) throw new Error("JSON harus berupa daftar (array) produk.");
                rawRows = parsed.map((o) => ({
                    nama: o.nama, kategori: o.kategori, harga: o.harga, stok: o.stok, stokminimum: o.stokMinimum,
                }));
            } else {
                rawRows = parseCSV(text);
            }
            if (rawRows.length > MAX_ROWS) throw new Error("Maksimal " + MAX_ROWS + " baris per impor.");

            const { rows, problems } = normalizeRows(rawRows);
            if (!rows.length) throw new Error(problems[0] || "Tidak ada baris yang bisa diimpor.");

            const hasil = await Store.importProduk(rows);
            UI.toast(hasil.ditambah + " produk ditambah, " + hasil.diperbarui + " diperbarui" +
                (problems.length ? ", " + problems.length + " baris dilewati." : "."));
            if (problems.length) UI.toast(problems[0] + (problems.length > 1 ? " (dan lainnya)" : ""), "info");
            await load({ silent: true });
        } catch (err) {
            const msg = err instanceof SyntaxError ? "Isi file JSON tidak valid." : err.message;
            UI.toast("Impor gagal: " + msg, "error");
        } finally {
            UI.setBusy(btnImpor, false);
        }
    });

    /* ---------------- Sinkron antar tab ("real time") ---------------- */
    Store.onExternalChange(async (key) => {
        if (key !== Store.KEYS.produk) return;
        await load({ silent: true });
        UI.toast("Data stok diperbarui dari tab lain.", "info");
    });

    load();
})();
