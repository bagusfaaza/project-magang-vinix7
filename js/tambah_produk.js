/* Form Tambah Produk: validasi, sanitasi, simpan, lalu kembali ke Data Stok */
(function () {
    UI.initShell();

    const form = document.getElementById("form-produk");
    const btn = document.getElementById("btn-simpan");
    const f = {
        nama: document.getElementById("nama"),
        kategori: document.getElementById("kategori"),
        harga: document.getElementById("harga"),
        stok: document.getElementById("stok"),
        min: document.getElementById("min"),
    };

    const KATEGORI_VALID = ["Makanan", "Minuman", "Lainnya"];

    // Hapus pesan error begitu user memperbaiki isian
    Object.values(f).forEach((el) => {
        el.addEventListener("input", () => UI.clearFieldError(el));
        el.addEventListener("change", () => UI.clearFieldError(el));
    });

    function toInt(raw) {
        return /^\d+$/.test(raw) ? Number(raw) : NaN;
    }

    function validate() {
        const errors = [];
        const data = {};

        data.nama = UI.clean(f.nama.value);
        f.nama.value = data.nama; // tampilkan hasil trim ke user
        if (!data.nama) errors.push([f.nama, "Nama produk wajib diisi."]);
        else if (data.nama.length < 3) errors.push([f.nama, "Nama produk minimal 3 karakter."]);
        else if (data.nama.length > 60) errors.push([f.nama, "Nama produk maksimal 60 karakter."]);

        data.kategori = f.kategori.value;
        if (!data.kategori) errors.push([f.kategori, "Pilih salah satu kategori."]);
        else if (!KATEGORI_VALID.includes(data.kategori)) errors.push([f.kategori, "Kategori tidak dikenal."]);

        const hargaRaw = UI.clean(f.harga.value);
        data.harga = toInt(hargaRaw);
        if (hargaRaw === "") errors.push([f.harga, "Harga wajib diisi."]);
        else if (isNaN(data.harga)) errors.push([f.harga, "Harga harus berupa angka bulat positif."]);
        else if (data.harga < 100) errors.push([f.harga, "Harga minimal Rp 100."]);
        else if (data.harga > 100000000) errors.push([f.harga, "Harga terlalu besar (maksimal Rp 100.000.000)."]);

        const stokRaw = UI.clean(f.stok.value);
        data.stok = toInt(stokRaw);
        if (stokRaw === "") errors.push([f.stok, "Jumlah stok awal wajib diisi (isi 0 jika kosong)."]);
        else if (isNaN(data.stok)) errors.push([f.stok, "Stok harus berupa angka bulat, tidak boleh negatif."]);
        else if (data.stok > 100000) errors.push([f.stok, "Stok terlalu besar (maksimal 100.000)."]);

        const minRaw = UI.clean(f.min.value);
        data.stokMinimum = minRaw === "" ? 5 : toInt(minRaw);
        if (minRaw !== "" && isNaN(data.stokMinimum)) errors.push([f.min, "Batas stok menipis harus berupa angka bulat."]);
        else if (data.stokMinimum > 10000) errors.push([f.min, "Batas stok menipis terlalu besar."]);

        return { errors, data };
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        Object.values(f).forEach(UI.clearFieldError);

        const { errors, data } = validate();
        if (errors.length) {
            errors.forEach(([el, msg]) => UI.setFieldError(el, msg));
            errors[0][0].focus();
            UI.toast("Periksa lagi " + errors.length + " kolom yang belum benar.", "error");
            return;
        }

        UI.setBusy(btn, true, "Menyimpan...");
        try {
            const produk = await Store.addProduk(data);
            UI.flash("Produk \"" + produk.nama + "\" berhasil ditambahkan.");
            location.href = "stok.html";
        } catch (err) {
            UI.setBusy(btn, false);
            if (err.field && f[err.field]) {
                UI.setFieldError(f[err.field], err.message);
                f[err.field].focus();
            }
            UI.toast(err.message, "error");
        }
    });
})();
