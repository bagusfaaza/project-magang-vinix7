/* ==========================================================
   ui.js - komponen UI yang dipakai semua halaman
   (shell sidebar/topbar, toast, modal, skeleton, empty/error
   state, helper validasi form, format angka & tanggal)
   ========================================================== */

const APP_NAME = "StokKu";

/* Menu ditulis SATU kali di sini, lalu di-render ke semua halaman. */
const NAV = [
    { key: "dashboard", label: "Dashboard", href: "index.html", icon: "🏠" },
    { key: "stok", label: "Data Stok", href: "stok.html", icon: "📦" },
    { key: "analisis", label: "Analisis Stok", href: "analisis_stok.html", icon: "📊" },
    { key: "transaksi", label: "Riwayat Transaksi", href: "transaksi.html", icon: "🧾" },
    { key: "pengaturan", label: "Pengaturan", href: "pengaturan.html", icon: "⚙️" },
];

const UI = (() => {
    /* ---------------- Teks, format, sanitasi ---------------- */
    const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    /* Escape HTML: semua teks dari user/data wajib lewat sini sebelum masuk innerHTML */
    function esc(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /* Bersihkan input: trim, rapikan spasi ganda, buang < dan > */
    function clean(value) {
        return String(value == null ? "" : value)
            .replace(/[<>]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function rupiah(n) {
        return "Rp " + Number(n || 0).toLocaleString("id-ID");
    }

    function tanggal(iso) {
        const [y, m, d] = String(iso).split("-").map(Number);
        if (!y || !m || !d) return String(iso);
        return d + " " + BULAN[m - 1] + " " + y;
    }

    function stokStatus(p) {
        if (p.stok <= 0) return { key: "habis", label: "Habis", cls: "badge-danger" };
        if (p.stok <= p.stokMinimum) return { key: "menipis", label: "Menipis", cls: "badge-warn" };
        return { key: "aman", label: "Aman", cls: "badge-ok" };
    }

    function debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    }

    /* ---------------- Shell: sidebar + topbar ---------------- */
    function initShell(options) {
        const opts = Object.assign({ search: false, importBtn: false }, options);
        const page = document.body.dataset.page;
        const current = NAV.find((n) => n.key === page);
        const profil = Store.getProfil();

        const sidebar = document.getElementById("sidebar");
        const topbar = document.getElementById("topbar");
        if (!sidebar || !topbar) return;

        sidebar.innerHTML =
            '<div>' +
            '<p class="sidebar-title">' + esc(current ? current.label : APP_NAME) + "</p>" +
            '<nav aria-label="Menu utama"><ul class="nav">' +
            NAV.map((n) =>
                '<li><a href="' + n.href + '"' + (n.key === page ? ' aria-current="page"' : "") + ">" +
                '<span class="ico" aria-hidden="true">' + n.icon + "</span>" + esc(n.label) + "</a></li>"
            ).join("") +
            "</ul></nav></div>" +
            '<a class="admin-box" href="pengaturan.html" style="text-decoration:none;color:inherit" aria-label="Profil admin">' +
            '<span class="avatar" id="admin-avatar">' + avatarHTML(profil) + "</span>" +
            '<span id="admin-name">' + esc(profil.nama) + "</span></a>";

        let extras = "";
        if (opts.search) {
            extras +=
                '<div class="search-box">' +
                '<label class="sr-only" for="cari">Cari produk</label>' +
                '<input type="search" id="cari" placeholder="Cari produk..." autocomplete="off">' +
                '<span class="search-ico" aria-hidden="true">🔍</span></div>';
        }
        if (opts.importBtn) {
            extras +=
                '<button type="button" class="btn btn-ghost btn-sm" id="btn-impor">Impor Stok</button>' +
                '<input type="file" id="file-impor" accept=".csv,.json,application/json,text/csv" hidden>';
        }

        topbar.innerHTML =
            '<button type="button" class="icon-btn" id="btn-menu" aria-label="Buka atau tutup menu" aria-controls="sidebar" aria-expanded="false">&#9776;</button>' +
            '<a class="icon-btn" href="index.html" aria-label="Ke Dashboard">&#8962;</a>' +
            '<span class="brand">' + esc(APP_NAME) + "</span>" +
            '<span class="topbar-spacer"></span>' + extras;

        document.title = (current ? current.label + " - " : "") + APP_NAME;
        setupMenuToggle();
        ensureToastRegion();
        showFlash();
    }

    function avatarHTML(profil) {
        if (profil.foto) return '<img src="' + esc(profil.foto) + '" alt="">';
        return esc((profil.nama || "A").charAt(0).toUpperCase());
    }

    function refreshAdmin() {
        const profil = Store.getProfil();
        const name = document.getElementById("admin-name");
        const avatar = document.getElementById("admin-avatar");
        if (name) name.textContent = profil.nama;
        if (avatar) avatar.innerHTML = avatarHTML(profil);
    }

    function setupMenuToggle() {
        const btn = document.getElementById("btn-menu");
        const mobile = window.matchMedia("(max-width: 860px)");
        let backdrop = document.getElementById("backdrop");
        if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.id = "backdrop";
            backdrop.className = "backdrop";
            document.body.appendChild(backdrop);
        }

        function isOpen() {
            return mobile.matches
                ? document.body.classList.contains("nav-open")
                : !document.body.classList.contains("nav-collapsed");
        }

        function sync() {
            btn.setAttribute("aria-expanded", String(isOpen()));
        }

        function toggle(force) {
            const open = typeof force === "boolean" ? force : !isOpen();
            if (mobile.matches) {
                document.body.classList.toggle("nav-open", open);
            } else {
                document.body.classList.toggle("nav-collapsed", !open);
            }
            sync();
        }

        btn.addEventListener("click", () => toggle());
        backdrop.addEventListener("click", () => toggle(false));
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && mobile.matches && document.body.classList.contains("nav-open")) {
                toggle(false);
                btn.focus();
            }
        });
        mobile.addEventListener("change", () => {
            document.body.classList.remove("nav-open", "nav-collapsed");
            sync();
        });
        sync();
    }

    /* ---------------- Toast ---------------- */
    function ensureToastRegion() {
        let region = document.getElementById("toasts");
        if (!region) {
            region = document.createElement("div");
            region.id = "toasts";
            region.className = "toast-region";
            region.setAttribute("aria-live", "polite");
            document.body.appendChild(region);
        }
        return region;
    }

    function toast(message, type) {
        const kind = type || "success";
        const region = ensureToastRegion();
        const icons = { success: "✅", error: "⚠️", info: "ℹ️" };
        const el = document.createElement("div");
        el.className = "toast " + (kind === "success" ? "" : kind);
        el.setAttribute("role", kind === "error" ? "alert" : "status");
        el.innerHTML =
            '<span aria-hidden="true">' + icons[kind] + "</span><span>" + esc(message) + "</span>" +
            '<button type="button" aria-label="Tutup notifikasi">&times;</button>';
        region.appendChild(el);

        function remove() {
            el.classList.add("out");
            setTimeout(() => el.remove(), 260);
        }
        el.querySelector("button").addEventListener("click", remove);
        setTimeout(remove, kind === "error" ? 5500 : 3600);
    }

    /* Toast yang tampil setelah pindah halaman (mis. setelah simpan form) */
    const FLASH_KEY = "stokku_flash";

    function flash(message, type) {
        try {
            sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, type: type || "success" }));
        } catch (e) { /* abaikan */ }
    }

    function showFlash() {
        try {
            const raw = sessionStorage.getItem(FLASH_KEY);
            if (!raw) return;
            sessionStorage.removeItem(FLASH_KEY);
            const data = JSON.parse(raw);
            toast(data.message, data.type);
        } catch (e) { /* abaikan */ }
    }

    /* ---------------- Skeleton, empty, error ---------------- */
    function skeletonCards(n) {
        let html = "";
        for (let i = 0; i < n; i++) {
            html +=
                '<div class="sk-card" aria-hidden="true">' +
                '<div class="skeleton sk-img"></div>' +
                '<div class="sk-body"><div class="skeleton sk-line w60"></div>' +
                '<div class="skeleton sk-line w40"></div><div class="skeleton sk-btn"></div></div></div>';
        }
        return html;
    }

    function skeletonRows(cols, rows) {
        let html = "";
        for (let r = 0; r < rows; r++) {
            html += "<tr>";
            for (let c = 0; c < cols; c++) {
                html += '<td><div class="skeleton sk-line" style="min-width:60px"></div></td>';
            }
            html += "</tr>";
        }
        return html;
    }

    function emptyState(o) {
        return (
            '<div class="state-box">' +
            '<div class="big" aria-hidden="true">' + (o.icon || "🔍") + "</div>" +
            "<h3>" + esc(o.title) + "</h3>" +
            "<p>" + esc(o.text) + "</p>" +
            (o.actionLabel
                ? '<button type="button" class="btn" data-action="' + esc(o.action || "reset") + '">' + esc(o.actionLabel) + "</button>"
                : "") +
            "</div>"
        );
    }

    function errorState(detail) {
        return (
            '<div class="state-box error" role="alert">' +
            '<div class="big" aria-hidden="true">⚠️</div>' +
            "<h3>Gagal memuat data</h3>" +
            "<p>Sepertinya ada gangguan. Coba lagi sebentar.<br><small>" + esc(detail || "") + "</small></p>" +
            '<button type="button" class="btn" data-action="retry">Coba lagi ↻</button></div>'
        );
    }

    /* ---------------- Helper form ---------------- */
    function fieldOf(input) {
        return input.closest(".field");
    }

    function errorEl(input) {
        const field = fieldOf(input);
        let el = field.querySelector(".field-error");
        if (!el) {
            el = document.createElement("p");
            el.className = "field-error";
            field.appendChild(el);
        }
        if (!el.id) el.id = (input.id || input.name) + "-error";
        return el;
    }

    function setFieldError(input, message) {
        const el = errorEl(input);
        fieldOf(input).classList.add("invalid");
        el.textContent = message;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", el.id);
    }

    function clearFieldError(input) {
        const field = fieldOf(input);
        field.classList.remove("invalid");
        const el = field.querySelector(".field-error");
        if (el) el.textContent = "";
        input.removeAttribute("aria-invalid");
    }

    /* Tombol sibuk: nonaktif + spinner + teks "Mengirim..." */
    function setBusy(button, busy, busyLabel) {
        if (busy) {
            button.dataset.label = button.innerHTML;
            button.disabled = true;
            button.setAttribute("aria-busy", "true");
            button.innerHTML = '<span class="spinner" aria-hidden="true"></span> ' + esc(busyLabel || "Mengirim...");
        } else {
            button.disabled = false;
            button.removeAttribute("aria-busy");
            if (button.dataset.label) button.innerHTML = button.dataset.label;
        }
    }

    /* ---------------- Modal ---------------- */
    function modal(overlay) {
        let lastFocus = null;
        const focusable = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

        function open() {
            lastFocus = document.activeElement;
            overlay.classList.add("open");
            document.body.style.overflow = "hidden";
            const first = overlay.querySelector("input:not([readonly]), select, textarea") || overlay.querySelector(focusable);
            if (first) setTimeout(() => first.focus(), 30);
        }

        function close() {
            overlay.classList.remove("open");
            document.body.style.overflow = "";
            if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
        }

        overlay.addEventListener("mousedown", (e) => {
            if (e.target === overlay) close();
        });

        overlay.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                close();
            } else if (e.key === "Tab") {
                const items = Array.from(overlay.querySelectorAll(focusable)).filter((el) => el.offsetParent !== null);
                if (!items.length) return;
                const first = items[0];
                const last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        overlay.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", close));
        return { open, close, el: overlay };
    }

    /* Dialog konfirmasi sebagai pengganti confirm() bawaan browser */
    function confirmDialog(o) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "modal-overlay";
            overlay.innerHTML =
                '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" aria-describedby="cf-text">' +
                '<h2 id="cf-title">' + esc(o.title) + "</h2>" +
                '<p class="sub" id="cf-text">' + esc(o.text) + "</p>" +
                '<div class="modal-actions">' +
                '<button type="button" class="btn btn-ghost" data-no>Batal</button>' +
                '<button type="button" class="btn ' + (o.danger ? "btn-danger" : "") + '" data-yes>' + esc(o.okLabel || "Ya") + "</button>" +
                "</div></div>";
            document.body.appendChild(overlay);
            const m = modal(overlay);
            let answered = false;

            function done(value) {
                if (answered) return;
                answered = true;
                m.close();
                setTimeout(() => overlay.remove(), 50);
                resolve(value);
            }

            overlay.querySelector("[data-yes]").addEventListener("click", () => done(true));
            overlay.querySelector("[data-no]").addEventListener("click", () => done(false));
            overlay.addEventListener("mousedown", (e) => {
                if (e.target === overlay) done(false);
            });
            overlay.addEventListener("keydown", (e) => {
                if (e.key === "Escape") done(false);
            });
            m.open();
            overlay.querySelector("[data-no]").focus();
        });
    }

    return {
        esc, clean, rupiah, tanggal, stokStatus, debounce,
        initShell, refreshAdmin,
        toast, flash, skeletonCards, skeletonRows, emptyState, errorState,
        setFieldError, clearFieldError, setBusy,
        modal, confirmDialog,
    };
})();
