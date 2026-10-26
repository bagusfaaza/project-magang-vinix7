/* Dashboard: ringkasan angka + 5 transaksi terbaru */
(function () {
    UI.initShell();

    const statsEl = document.getElementById("stats");
    const bodyEl = document.getElementById("tabel-body");
    const wrapEl = document.getElementById("tabel-wrap");

    function showLoading() {
        statsEl.innerHTML = [1, 2, 3]
            .map(() => '<div class="stat" aria-hidden="true"><div class="skeleton sk-line w40"></div>' +
                '<div class="skeleton" style="height:32px;width:50%;margin-top:12px"></div>' +
                '<div class="skeleton sk-line w60" style="margin-top:12px"></div></div>')
            .join("");
        bodyEl.innerHTML = UI.skeletonRows(6, 5);
    }

    function statCard(label, value, hint) {
        return '<div class="stat"><div class="label">' + UI.esc(label) + "</div>" +
            '<div class="value">' + UI.esc(value) + "</div>" +
            '<div class="hint">' + UI.esc(hint) + "</div></div>";
    }

    function renderStats(produk, transaksi) {
        const totalUnit = produk.reduce((sum, p) => sum + p.stok, 0);
        const menipis = produk.filter((p) => p.stok <= p.stokMinimum).length;
        const cards = [
            ["Total Produk", produk.length, menipis + " produk perlu diisi ulang"],
            ["Jumlah Produk", totalUnit.toLocaleString("id-ID"), "Total unit di semua stok"],
            ["Jumlah Transaksi", transaksi.length, "Tercatat sejak awal"],
        ];
        statsEl.innerHTML = cards.map((c) => statCard(c[0], c[1], c[2])).join("");
    }

    function renderTransaksi(transaksi) {
        const terbaru = transaksi.slice(0, 5);
        if (!terbaru.length) {
            wrapEl.innerHTML = UI.emptyState({
                icon: "🧾",
                title: "Belum ada transaksi",
                text: "Catat penjualan pertama kamu supaya muncul di sini.",
                actionLabel: "Catat Transaksi",
                action: "catat",
            });
            return;
        }
        bodyEl.innerHTML = terbaru
            .map((t) => {
                const ringkas = t.items.map((i) => UI.esc(i.nama) + " ×" + i.jumlah).join(", ");
                const cls = t.status === "Lunas" ? "badge-ok" : "badge-warn";
                return "<tr>" +
                    "<td><strong>" + UI.esc(t.id) + "</strong></td>" +
                    "<td>" + UI.tanggal(t.tanggal) + "</td>" +
                    "<td>" + UI.esc(t.pelanggan) + "</td>" +
                    '<td style="max-width:260px;overflow:hidden;text-overflow:ellipsis">' + ringkas + "</td>" +
                    '<td class="num">' + UI.rupiah(t.total) + "</td>" +
                    '<td><span class="badge ' + cls + '">' + UI.esc(t.status) + "</span></td></tr>";
            })
            .join("");
    }

    async function load() {
        showLoading();
        try {
            const [produk, transaksi] = await Promise.all([Store.getProduk(), Store.getTransaksi()]);
            renderStats(produk, transaksi);
            renderTransaksi(transaksi);
        } catch (err) {
            statsEl.innerHTML = "";
            wrapEl.innerHTML = UI.errorState(err.message);
        }
    }

    document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        if (btn.dataset.action === "retry") {
            // kembalikan struktur tabel sebelum memuat ulang
            location.reload();
        }
        if (btn.dataset.action === "catat") location.href = "tambah_transaksi.html";
    });

    // Sinkron antar tab: kalau tab lain mengubah data, muat ulang angka di sini
    Store.onExternalChange(() => load());

    load();
})();
