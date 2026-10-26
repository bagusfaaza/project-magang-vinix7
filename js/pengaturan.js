/* Pengaturan: edit profil, kata sandi (hanya validasi), foto, WhatsApp, reset data demo */
(function () {
    UI.initShell();

    const modals = {
        profil: UI.modal(document.getElementById("modal-profil")),
        sandi: UI.modal(document.getElementById("modal-sandi")),
        wa: UI.modal(document.getElementById("modal-wa")),
    };

    const ringkas = document.getElementById("ringkas-profil");

    function renderRingkas() {
        const p = Store.getProfil();
        ringkas.textContent = p.nama + " · " + p.namaToko + (p.whatsapp ? " · WA " + p.whatsapp : "");
    }

    function watchInputs(form) {
        form.querySelectorAll("input").forEach((el) => el.addEventListener("input", () => UI.clearFieldError(el)));
    }

    function focusFirstError(inputs) {
        const bad = inputs.find((el) => el.getAttribute("aria-invalid") === "true");
        if (bad) bad.focus();
    }

    /* ----- Edit profil ----- */
    const fProfil = document.getElementById("form-profil");
    const pNama = document.getElementById("p-nama");
    const pEmail = document.getElementById("p-email");
    const pToko = document.getElementById("p-toko");
    watchInputs(fProfil);

    function openProfil() {
        const p = Store.getProfil();
        pNama.value = p.nama;
        pEmail.value = p.email;
        pToko.value = p.namaToko;
        [pNama, pEmail, pToko].forEach(UI.clearFieldError);
        modals.profil.open();
    }

    fProfil.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nama = UI.clean(pNama.value);
        const email = UI.clean(pEmail.value).toLowerCase();
        const toko = UI.clean(pToko.value);
        [pNama, pEmail, pToko].forEach(UI.clearFieldError);

        if (!nama) UI.setFieldError(pNama, "Nama admin wajib diisi.");
        else if (nama.length < 2) UI.setFieldError(pNama, "Nama admin minimal 2 karakter.");
        if (!email) UI.setFieldError(pEmail, "Email wajib diisi.");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) UI.setFieldError(pEmail, "Format email belum benar, contoh: nama@toko.id");
        if (!toko) UI.setFieldError(pToko, "Nama usaha wajib diisi.");

        if ([pNama, pEmail, pToko].some((el) => el.getAttribute("aria-invalid") === "true")) {
            return focusFirstError([pNama, pEmail, pToko]);
        }

        const btn = document.getElementById("btn-simpan-profil");
        UI.setBusy(btn, true, "Menyimpan...");
        try {
            await Store.saveProfil({ nama, email, namaToko: toko });
            modals.profil.close();
            UI.refreshAdmin();
            renderRingkas();
            UI.toast("Profil berhasil diperbarui.");
        } catch (err) {
            UI.toast(err.message, "error");
        } finally {
            UI.setBusy(btn, false);
        }
    });

    /* ----- Ubah kata sandi (hanya validasi) ----- */
    const fSandi = document.getElementById("form-sandi");
    const sLama = document.getElementById("s-lama");
    const sBaru = document.getElementById("s-baru");
    const sUlang = document.getElementById("s-ulang");
    watchInputs(fSandi);

    fSandi.addEventListener("submit", async (e) => {
        e.preventDefault();
        [sLama, sBaru, sUlang].forEach(UI.clearFieldError);

        // Kata sandi sengaja TIDAK di-trim/sanitasi karena spasi bisa jadi bagian sandi
        if (!sLama.value) UI.setFieldError(sLama, "Kata sandi lama wajib diisi.");
        if (!sBaru.value) UI.setFieldError(sBaru, "Kata sandi baru wajib diisi.");
        else if (sBaru.value.length < 8) UI.setFieldError(sBaru, "Minimal 8 karakter.");
        else if (!/[A-Za-z]/.test(sBaru.value) || !/\d/.test(sBaru.value)) UI.setFieldError(sBaru, "Harus mengandung huruf dan angka.");
        else if (sBaru.value === sLama.value) UI.setFieldError(sBaru, "Kata sandi baru tidak boleh sama dengan yang lama.");
        if (!sUlang.value) UI.setFieldError(sUlang, "Ulangi kata sandi baru.");
        else if (sUlang.value !== sBaru.value) UI.setFieldError(sUlang, "Kata sandi tidak sama.");

        if ([sLama, sBaru, sUlang].some((el) => el.getAttribute("aria-invalid") === "true")) {
            return focusFirstError([sLama, sBaru, sUlang]);
        }

        const btn = document.getElementById("btn-simpan-sandi");
        UI.setBusy(btn, true, "Memproses...");
        await new Promise((r) => setTimeout(r, 600));
        UI.setBusy(btn, false);
        fSandi.reset();
        modals.sandi.close();
        UI.toast("Validasi lolos. Belum ada sistem login, jadi kata sandi tidak disimpan.", "info");
    });

    /* ----- Foto profil ----- */
    const fileFoto = document.getElementById("file-foto");
    document.getElementById("btn-foto").addEventListener("click", () => fileFoto.click());

    function resizeToDataURL(file, size) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const side = Math.min(img.width, img.height);
                const canvas = document.createElement("canvas");
                canvas.width = canvas.height = size;
                canvas.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("File bukan gambar yang valid."));
            };
            img.src = url;
        });
    }

    fileFoto.addEventListener("change", async () => {
        const file = fileFoto.files[0];
        fileFoto.value = "";
        if (!file) return;
        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return UI.toast("Gunakan gambar PNG, JPG, atau WebP.", "error");
        if (file.size > 3 * 1024 * 1024) return UI.toast("Ukuran foto maksimal 3 MB.", "error");
        try {
            const foto = await resizeToDataURL(file, 160);
            await Store.saveProfil({ foto });
            UI.refreshAdmin();
            UI.toast("Foto profil diperbarui.");
        } catch (err) {
            UI.toast(err.message, "error");
        }
    });

    /* ----- WhatsApp ----- */
    const fWa = document.getElementById("form-wa");
    const wNomor = document.getElementById("w-nomor");
    const waLink = document.getElementById("wa-link");
    watchInputs(fWa);

    function updateWaLink(nomor) {
        waLink.href = "https://wa.me/" + nomor + "?text=" + encodeURIComponent("Halo, saya butuh bantuan soal stok.");
        waLink.setAttribute("aria-disabled", nomor ? "false" : "true");
    }

    function openWa() {
        const p = Store.getProfil();
        wNomor.value = p.whatsapp;
        UI.clearFieldError(wNomor);
        updateWaLink(p.whatsapp);
        modals.wa.open();
    }

    waLink.addEventListener("click", (e) => {
        if (waLink.getAttribute("aria-disabled") === "true") e.preventDefault();
    });

    fWa.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nomor = UI.clean(wNomor.value).replace(/[\s-]/g, "");
        UI.clearFieldError(wNomor);
        if (!nomor) return (UI.setFieldError(wNomor, "Nomor WhatsApp wajib diisi."), wNomor.focus());
        if (!/^\d+$/.test(nomor)) return (UI.setFieldError(wNomor, "Hanya angka, tanpa tanda + atau huruf."), wNomor.focus());
        if (!nomor.startsWith("62")) return (UI.setFieldError(wNomor, "Nomor harus diawali 62 (kode Indonesia)."), wNomor.focus());
        if (nomor.length < 10 || nomor.length > 15) return (UI.setFieldError(wNomor, "Panjang nomor 10 sampai 15 digit."), wNomor.focus());

        const btn = document.getElementById("btn-simpan-wa");
        UI.setBusy(btn, true, "Menyimpan...");
        try {
            await Store.saveProfil({ whatsapp: nomor });
            updateWaLink(nomor);
            modals.wa.close();
            renderRingkas();
            UI.toast("Nomor WhatsApp tersimpan.");
        } catch (err) {
            UI.toast(err.message, "error");
        } finally {
            UI.setBusy(btn, false);
        }
    });

    /* ----- Reset data demo ----- */
    document.getElementById("btn-reset-data").addEventListener("click", async () => {
        const ok = await UI.confirmDialog({
            title: "Kembalikan data contoh?",
            text: "Semua produk, transaksi, dan profil yang kamu ubah di browser ini akan diganti data contoh awal.",
            okLabel: "Ya, kembalikan",
            danger: true,
        });
        if (!ok) return;
        Store.resetData();
        UI.flash("Data dikembalikan ke contoh awal.", "info");
        location.href = "index.html";
    });

    document.querySelectorAll("[data-open]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const which = btn.dataset.open;
            if (which === "profil") openProfil();
            if (which === "wa") openWa();
            if (which === "sandi") {
                fSandi.reset();
                [sLama, sBaru, sUlang].forEach(UI.clearFieldError);
                modals.sandi.open();
            }
        });
    });

    renderRingkas();
})();
