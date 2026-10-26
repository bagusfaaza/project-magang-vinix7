/* Analisis Stok: produk terlaris (dari transaksi) dan daftar stok menipis */
(function () {
    UI.initShell();

    const area = document.getElementById("analisis-area");
    const template = area.innerHTML;

    function skeleton() {
        area.innerHTML = template;
        document.getElementById("stats").innerHTML = [1, 2, 3]
            .map(() => '<div class="stat" aria-hidden="true"><div class="skeleton sk-line w40"></div>' +
                '<div class="skeleton" style="height:32px;width:50%;margin-top:12px"></div></div>')
            .join("");
        document.getElementById("chart").innerHTML = [1, 2, 3, 4, 5]
            .map(() => '<div class="skeleton" style="height:14px;margin:16px 0" aria-hidden="true"></div>').join("");
        document.getElementById("low-list").innerHTML = [1, 2, 3]
            .map(() => '<li aria-hidden="true"><div class="skeleton sk-line" style="width:100%"></div></li>').join("");
    }

    function render(produk, transaksi) {
        // jumlah terjual per produk (dijumlahkan dari semua item transaksi)
        const terjual = new Map();
        transaksi.forEach((t) => t.items.forEach((i) => {
            terjual.set(i.nama, (terjual.get(i.nama) || 0) + i.jumlah);
        }));
        const ranking = Array.from(terjual, ([nama, jumlah]) => ({ nama, jumlah }))
            .sort((a, b) => b.jumlah - a.jumlah)
            .slice(0, 8);
        const max = ranking.length ? ranking[0].jumlah : 1;

        const habis = produk.filter((p) => p.stok <= 0).length;
        const menipis = produk.filter((p) => p.stok > 0 && p.stok <= p.stokMinimum).length;
        const nilai = produk.reduce((sum, p) => sum + p.harga * p.stok, 0);

        document.getElementById("stats").innerHTML = [
            ["Nilai Persediaan", UI.rupiah(nilai), "Harga × stok semua produk"],
            ["Stok Menipis", menipis, "Di bawah batas minimum"],
            ["Stok Habis", habis, "Perlu segera diisi"],
        ].map((c) => '<div class="stat"><div class="label">' + UI.esc(c[0]) + '</div><div class="value" style="font-size:' +
            (typeof c[1] === "string" ? "22px" : "30px") + '">' + UI.esc(c[1]) + '</div><div class="hint">' + UI.esc(c[2]) + "</div></div>").join("");

        const chart = document.getElementById("chart");
        if (!ranking.length) {
            chart.innerHTML = UI.emptyState({
                icon: "📊",
                title: "Belum ada data penjualan",
                text: "Grafik muncul setelah ada transaksi.",
                actionLabel: "Catat Transaksi",
                action: "catat",
            });
        } else {
            chart.innerHTML = ranking.map((r) =>
                '<div class="bar-row"><span class="bar-label" title="' + UI.esc(r.nama) + '">' + UI.esc(r.nama) + "</span>" +
                '<div class="bar-track" role="img" aria-label="' + UI.esc(r.nama) + ": " + r.jumlah + ' unit terjual">' +
                '<div class="bar-fill" style="width:' + Math.max(4, Math.round((r.jumlah / max) * 100)) + '%"></div></div>' +
                "<strong>" + r.jumlah + "</strong></div>"
            ).join("");
        }

        const low = produk
            .filter((p) => p.stok <= p.stokMinimum)
            .sort((a, b) => a.stok - b.stok);
        const list = document.getElementById("low-list");
        if (!low.length) {
            list.innerHTML = '<li style="justify-content:center;color:#66706a">Semua stok aman 🎉</li>';
        } else {
            list.innerHTML = low.map((p) => {
                const s = UI.stokStatus(p);
                return "<li><span><strong>" + UI.esc(p.nama) + "</strong><br><small>Sisa " + p.stok + " &middot; min. " + p.stokMinimum + "</small></span>" +
                    '<span style="display:flex;gap:8px;align-items:center"><span class="badge ' + s.cls + '">' + s.label + "</span>" +
                    '<a class="btn btn-sm btn-ghost" href="stok.html?cari=' + encodeURIComponent(p.nama) + '">Isi stok</a></span></li>';
            }).join("");
        }
    }

    async function load(options) {
        if (!(options && options.silent)) skeleton();
        try {
            const [produk, transaksi] = await Promise.all([Store.getProduk(), Store.getTransaksi()]);
            if (!document.getElementById("stats")) area.innerHTML = template;
            render(produk, transaksi);
        } catch (err) {
            area.innerHTML = UI.errorState(err.message);
        }
    }

    area.addEventListener("click", (e) => {
        const act = e.target.closest("[data-action]");
        if (!act) return;
        if (act.dataset.action === "retry") load();
        if (act.dataset.action === "catat") location.href = "tambah_transaksi.html";
    });

    Store.onExternalChange(() => load({ silent: true }));
    load();
})();
