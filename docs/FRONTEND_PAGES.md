# Daftar Halaman Frontend (Inertia + React)

Berikut ringkasan halaman React/TSX utama di `resources/js/pages/` beserta tanggung jawab singkat tiap halaman.

- `welcome.tsx` — Halaman landing/public (Inertia welcome page).
- `dashboard.tsx` & `resources/js/pages/sales/visit-record.tsx` — Dashboard sales; menampilkan status presensi, daftar kunjungan hari ini, produk, dan aksi check-in/check-out.
- `sales/visit-record.tsx` — Form input kunjungan (photo upload, produk, customer manual/database), face verification trigger, fake-GPS checks.
- `sales/monitoring-record.tsx` — Tampilan monitoring kunjungan per-user (untuk supervisor atau monitoring manager).
- `notifications.tsx` — Daftar notifikasi in-app; toggle push (mobile), tandai baca/belum, buka detail.
- `sync-center.tsx` — UI Sync Center untuk menampilkan antrean offline, retry, clear queue, clear local app data.
- `select-monitoring.tsx` — UI pemilihan user untuk monitoring (helper page).
- `settings/*` — Halaman profil, password, appearance, two-factor, dan admin settings (users, roles, products, warehouses, whatsapp blasting).
- `announcements/*` — Halaman daftar dan detail pengumuman.
- `supervisor/*` — Halaman dashboard/monitoring untuk supervisor (monitoring-team, monitoring-record).
- `mataram.tsx` — Variant/dashboard untuk subdomain Mataram (alternatif pada beberapa host).
- `sync-center.tsx` — (telah disebut) menangani offline queue UI dan clear data.
- `auth/*` — Halaman login, register, two-factor, email verification flows (dari Fortify + Inertia).

Komponen & utilities penting:
- `resources/js/layouts/*` — layout utama (desktop) dan mobile (`AppLayoutMobile`).
- `resources/js/components/*` — modal (alert, image preview, face verification), UI atoms, form controls.
- `resources/js/lib/offline-http.ts` — offline queue & cache logic (dipakai oleh form/submit di halaman kunjungan dan settings).
- `resources/js/lib/service-worker.ts` — pendaftaran service worker.
- `resources/js/hooks/*` — custom hooks (appearance, push notifications, offline sync status).

Catatan: Untuk penjelasan props & struktur state tiap halaman, saya bisa ekstrak tiap file komponen jika Anda mau (opsi: buat satu file per-halaman yang menjelaskan props, API yang dipanggil, dan komponen utama).
