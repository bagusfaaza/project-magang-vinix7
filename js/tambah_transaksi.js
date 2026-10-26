/* Form Kasir: banyak item per transaksi, validasi stok, total langsung terhitung */
(function () {
    UI.initShell();

    const area = document.getElementById("form-area");
    let produk = [];
    let rows = [];
    let nextRowId = 1;

    function newRow() {
        return { id: nextRowId++, produkId: "", jumlah: "1" };
    }

    function optionsHTML(selectedId) {
        return '<option value="">Pilih produk</option>' + produk
            .map((p) => {
                const habis = p.stok <= 0;
                return '<option value="' + p.id + '"' + (String(p.id) === String(selectedId) ? " selected" : "") +
                    (habis ? " disabled" : "") + ">" + UI.esc(p.nama) + " - " + UI.rupiah(p.harga) +
                    (habis ? " (habis)" : " (stok " + p.stok + ")") + "</option>";
            })
            .join("");
    }

    function rowHTML(r, index) {
        return '<div class="item-row" data-row="' + r.id + '">' +
            '<div class="field"><label for="produk-' + r.id + '">Produk ' + (index + 1) + " *</label>" +
            '<select id="produk-' + r.id + '" data-field="produkId">' + optionsHTML(r.produkId) + "</select>" +
            '<p class="field-error"></p></div>' +
            '<div class="field"><label for="jumlah-' + r.id + '">Jumlah *</label>' +
            '<input type="number" id="jumlah-' + r.id + '" data-field="jumlah" inputmode="numeric" min="1" step="1" value="' + UI.esc(r.jumlah) + '">' +
            '<p class="field-error"></p></div>' +
            '<button type="button" class="btn btn-ghost btn-remove" data-remove="' + r.id + '" aria-label="Hapus item ' + (index + 1) + '"' +
            (rows.length === 1 ? " disabled" : "") + ">&times;</button></div>";
    }

    function renderRows() {
        document.getElementById("rows").innerHTML = rows.map(rowHTML).join("");
        updateTotal();
    }

    function buildForm() {
        area.innerHTML =
            '<form id="form-trx" novalidate>' +
            '<div class="field"><label for="pelanggan">Nama pelanggan *</label>' +
            '<input type="text" id="pelanggan" name="pelanggan" maxlength="60" autocomplete="off" placeholder="Contoh: Budi Santoso">' +
            '<p class="field-error"></p></div>' +
            '<div id="rows"></div>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btn-tambah-item" style="margin-bottom:16px">+ Tambah item</button>' +
            '<div class="field"><label for="status-bayar">Status pembayaran *</label>' +
            '<select id="status-bayar" name="status"><option value="Lunas">Lunas</option><option value="Belum Lunas">Belum Lunas</option></select>' +
            '<p class="field-error"></p></div>' +
            '<div class="summary-box"><span>Total bayar</span><strong id="total">Rp 0</strong></div>' +
            '<div class="form-actions"><button type="submit" class="btn" id="btn-proses">Proses Pembayaran</button>' +
            '<a class="btn btn-ghost" href="transaksi.html">Batal</a></div></form>';
        rows = [newRow()];
        renderRows();
        bindForm();
    }

    function findProduk(id) {
        return produk.find((p) => String(p.id) === String(id));
    }

    function updateTotal() {
        const total = rows.reduce((sum, r) => {
            const p = findProduk(r.produkId);
            const qty = /^\d+$/.test(r.jumlah) ? Number(r.jumlah) : 0;
            return sum + (p ? p.harga * qty : 0);
        }, 0);
        const el = document.getElementById("total");
        if (el) el.textContent = UI.rupiah(total);
    }

    function bindForm() {
        const form = document.getElementById("form-trx");
        const pelanggan = document.getElementById("pelanggan");
        const btn = document.getElementById("btn-proses");

        pelanggan.addEventListener("input", () => UI.clearFieldError(pelanggan));

        document.getElementById("btn-tambah-item").addEventListener("click", () => {
            if (rows.length >= 10) return UI.toast("Maksimal 10 item per transaksi.", "info");
            syncRowsFromDOM();
            rows.push(newRow());
            renderRows();
            const last = document.querySelector('.item-row:last-child select');
            if (last) last.focus();
        });

        form.addEventListener("click", (e) => {
            const rm = e.target.closest("[data-remove]");
            if (!rm || rows.length === 1) return;
            syncRowsFromDOM();
            rows = rows.filter((r) => String(r.id) !== rm.dataset.remove);
            renderRows();
        });

        // perubahan produk / jumlah: simpan ke state, hitung ulang total, bersihkan error
        form.addEventListener("input", (e) => {
            const field = e.target.dataset.field;
            if (!field) return;
            const row = rows.find((r) => String(r.id) === e.target.closest(".item-row").dataset.row);
            row[field] = e.target.value;
            UI.clearFieldError(e.target);
            updateTotal();
        });

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            syncRowsFromDOM();
            const data = validate(pelanggan);
            if (!data) return;

            UI.setBusy(btn, true, "Memproses...");
            try {
                const trx = await Store.addTransaksi({
                    pelanggan: data.pelanggan,
                    items: data.items,
                    status: document.getElementById("status-bayar").value,
                });
                UI.flash("Transaksi " + trx.id + " berhasil dicatat (" + UI.rupiah(trx.total) + ").");
                location.href = "transaksi.html";
            } catch (err) {
                UI.setBusy(btn, false);
                UI.toast(err.message, "error");
                // stok mungkin berubah dari tab lain: segarkan pilihan produk
                try {
                    produk = await Store.getProduk();
                    renderRows();
                } catch (e2) { /* biarkan */ }
            }
        });
    }

    function syncRowsFromDOM() {
        document.querySelectorAll(".item-row").forEach((el) => {
            const row = rows.find((r) => String(r.id) === el.dataset.row);
            if (!row) return;
            row.produkId = el.querySelector("select").value;
            row.jumlah = el.querySelector("input").value;
        });
    }

    function validate(pelangganInput) {
        let ok = true;
        let firstBad = null;
        const bad = (input, msg) => {
            UI.setFieldError(input, msg);
            ok = false;
            if (!firstBad) firstBad = input;
        };

        const nama = UI.clean(pelangganInput.value);
        pelangganInput.value = nama;
        UI.clearFieldError(pelangganInput);
        if (!nama) bad(pelangganInput, "Nama pelanggan wajib diisi.");
        else if (nama.length < 2) bad(pelangganInput, "Nama pelanggan minimal 2 karakter.");

        const items = [];
        const dipakai = new Map(); // produkId -> total jumlah (untuk cek stok jika produk sama dipilih ganda)

        document.querySelectorAll(".item-row").forEach((el) => {
            const select = el.querySelector("select");
            const input = el.querySelector("input");
            UI.clearFieldError(select);
            UI.clearFieldError(input);

            const p = findProduk(select.value);
            const qtyRaw = UI.clean(input.value);
            const qty = /^\d+$/.test(qtyRaw) ? Number(qtyRaw) : NaN;

            if (!select.value || !p) bad(select, "Pilih produk terlebih dahulu.");
            if (qtyRaw === "") bad(input, "Jumlah wajib diisi.");
            else if (isNaN(qty) || qty < 1) bad(input, "Jumlah minimal 1 (bilangan bulat).");
            else if (p) {
                const total = (dipakai.get(p.id) || 0) + qty;
                if (total > p.stok) bad(input, "Stok " + p.nama + " hanya " + p.stok + ".");
                else {
                    dipakai.set(p.id, total);
                    items.push({ produkId: p.id, jumlah: qty });
                }
            }
        });

        if (!ok) {
            if (firstBad) firstBad.focus();
            UI.toast("Periksa lagi isian yang ditandai merah.", "error");
            return null;
        }
        return { pelanggan: nama, items };
    }

    async function load() {
        try {
            produk = await Store.getProduk();
            if (!produk.some((p) => p.stok > 0)) {
                area.innerHTML = UI.emptyState({
                    icon: "📦",
                    title: "Belum ada produk yang bisa dijual",
                    text: "Semua produk kosong atau belum ada produk. Tambahkan atau isi stok dulu.",
                    actionLabel: "Ke Data Stok",
                    action: "stok",
                });
                return;
            }
            buildForm();
        } catch (err) {
            area.innerHTML = UI.errorState(err.message);
        }
    }

    area.addEventListener("click", (e) => {
        const act = e.target.closest("[data-action]");
        if (!act) return;
        if (act.dataset.action === "retry") {
            area.innerHTML = '<div class="skeleton" style="height:42px;margin-bottom:14px"></div><div class="skeleton" style="height:90px;margin-bottom:14px"></div><div class="skeleton" style="height:42px"></div>';
            load();
        }
        if (act.dataset.action === "stok") location.href = "stok.html";
    });

    load();
})();
