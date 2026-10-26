/* Riwayat Transaksi: tabel dari data, cari, filter status, tandai lunas */
(function () {
    UI.initShell();

    const area = document.getElementById("tabel-area");
    const info = document.getElementById("info-hasil");
    const qInput = document.getElementById("q");
    const statusSel = document.getElementById("status");

    // Struktur tabel disimpan supaya bisa dipulihkan setelah empty/error state
    const tableHTML = area.innerHTML;
    const filters = { q: "", status: "semua" };
    let transaksi = [];

    function tbody() {
        return document.getElementById("tabel-body");
    }

    function ensureTable() {
        if (!tbody()) area.innerHTML = tableHTML;
    }

    function filtered() {
        const q = filters.q.toLowerCase();
        return transaksi.filter((t) => {
            if (filters.status !== "semua" && t.status !== filters.status) return false;
            if (q && !(t.id.toLowerCase().includes(q) || t.pelanggan.toLowerCase().includes(q))) return false;
            return true;
        });
    }

    function rowHTML(t) {
        const ringkas = t.items.map((i) => UI.esc(i.nama) + " ×" + i.jumlah).join(", ");
        const lunas = t.status === "Lunas";
        return "<tr>" +
            "<td><strong>" + UI.esc(t.id) + "</strong></td>" +
            "<td>" + UI.tanggal(t.tanggal) + "</td>" +
            "<td>" + UI.esc(t.pelanggan) + "</td>" +
            '<td style="max-width:280px;overflow:hidden;text-overflow:ellipsis" title="' + ringkas.replace(/<[^>]+>/g, "") + '">' + ringkas + "</td>" +
            '<td class="num">' + UI.rupiah(t.total) + "</td>" +
            '<td><span class="badge ' + (lunas ? "badge-ok" : "badge-warn") + '">' + UI.esc(t.status) + "</span></td>" +
            "<td>" + (lunas ? "&ndash;" :
                '<button type="button" class="btn btn-sm btn-ghost" data-lunas="' + UI.esc(t.id) + '">Tandai lunas</button>') + "</td>" +
            "</tr>";
    }

    function render() {
        const list = filtered();
        info.textContent = list.length + " dari " + transaksi.length + " transaksi";

        if (!transaksi.length) {
            area.innerHTML = UI.emptyState({
                icon: "🧾",
                title: "Belum ada transaksi",
                text: "Catat penjualan pertama kamu.",
                actionLabel: "Catat Transaksi Baru",
                action: "catat",
            });
            return;
        }
        if (!list.length) {
            area.innerHTML = UI.emptyState({
                icon: "🔍",
                title: "Yah, transaksi tidak ditemukan",
                text: "Coba kata kunci lain atau ubah filter status.",
                actionLabel: "Reset pencarian & filter",
                action: "reset",
            });
            return;
        }
        ensureTable();
        tbody().innerHTML = list.map(rowHTML).join("");
    }

    async function load(options) {
        if (!(options && options.silent)) {
            ensureTable();
            tbody().innerHTML = UI.skeletonRows(7, 6);
            info.textContent = "Memuat data...";
        }
        try {
            transaksi = await Store.getTransaksi();
            render();
        } catch (err) {
            info.textContent = "";
            area.innerHTML = UI.errorState(err.message);
        }
    }

    function reset() {
        filters.q = "";
        filters.status = "semua";
        qInput.value = "";
        statusSel.value = "semua";
        render();
    }

    qInput.addEventListener("input", UI.debounce(() => {
        filters.q = UI.clean(qInput.value);
        render();
    }, 180));

    statusSel.addEventListener("change", () => {
        filters.status = statusSel.value;
        render();
    });

    area.addEventListener("click", async (e) => {
        const act = e.target.closest("[data-action]");
        if (act) {
            if (act.dataset.action === "retry") load();
            if (act.dataset.action === "reset") reset();
            if (act.dataset.action === "catat") location.href = "tambah_transaksi.html";
            return;
        }
        const lunas = e.target.closest("[data-lunas]");
        if (lunas) {
            UI.setBusy(lunas, true, "Menyimpan...");
            try {
                await Store.setStatusTransaksi(lunas.dataset.lunas, "Lunas");
                UI.toast("Transaksi " + lunas.dataset.lunas + " ditandai lunas.");
                await load({ silent: true });
            } catch (err) {
                UI.setBusy(lunas, false);
                UI.toast(err.message, "error");
            }
        }
    });

    Store.onExternalChange((key) => {
        if (key === Store.KEYS.transaksi) load({ silent: true });
    });

    load();
})();
