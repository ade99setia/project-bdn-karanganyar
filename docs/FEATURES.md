# Fitur Project — Bagus Dinamika Nusantara

**Ringkasan singkat**: Aplikasi Laravel + Inertia + React (TypeScript) dengan dukungan Capacitor untuk mobile (Android), offline-first sync, face verification, attendance & sales visit workflow, notifikasi, dan integrasi WhatsApp.

**Backend (Laravel)**
- **Autentikasi**: Laravel Fortify (login, register, two-factor, email verification). (lihat routes: web.php)
- **Kiosk login**: login via token dan endpoint generate link (`AuthFlowController`).
- **Roles & akses**: model `Role.php` dan middleware role-based pada route `sales` / `supervisor`.
- **Notifications**: device token management, mark read/unread, push (controller `NotificationController`).
- **Announcements**: public announcement viewing (`AnnouncementController`).
- **WhatsApp**: send endpoint (`/whatsapp/send`) dan webhook handler di `routes/api.php` (controller `WhatsappWebhookController`).
- **Sales domain**: attendance, visits, visit photos, products, product history (models: `SalesAttendance`, `SalesVisit`, `SalesVisitPhoto`, `SalesVisitProduct`, `SalesProductHistory`, dll.).
- **Utilities / Geo**: reverse-geocode endpoint (`SalesUtilsController`) dan nearby-customer handler (`Utils\\NearbyCustomerController`).
- **Sync / Semi-offline**: halaman `sync-center` dan related logic untuk antrian offline (frontend + backend endpoints).

**Frontend (Inertia + React + TSX)**
- **Inertia app bootstrap**: `resources/js/app.tsx` — Inertia + Vite setup, SSR support (optional).
- **Halaman utama**: `resources/js/pages/` — `dashboard`, `notifications`, `announcements`, `sync-center`, `supervisor`, `sales/visit-record.tsx`, `sales/monitoring-record.tsx`, dsb.
- **Komponen & layout**: folder `resources/js/components/` dan `resources/js/layouts/` (mobile-first layout `AppLayoutMobile`).
- **Offline HTTP queue & cache**: `resources/js/lib/offline-http.ts` — intercept axios, enqueue request saat offline, flush saat online, offline page fallback.
- **Service worker**: pendaftaran di `resources/js/lib/service-worker.ts` dan `public/sw.js` (reg pada production/native).
- **Face verification**: modal face verification (komponen) + model `FaceDescriptor` untuk menyimpan descriptor wajah pengguna; digunakan pada check-in/out.
- **Image handling**: image preview, upload, react-easy-crop, sharp (build-time image processing), browser-image-compression.
- **Rich UI libs**: TipTap (rich text), Headless UI, Radix UI, Framer Motion, Lucide icons, TailwindCSS.
- **Pages mobile-specific**: visit record flow (check-in, add visit, upload photos, products pivot), mock-location detection, fake-gps blocking logic.

**Capacitor / Mobile integration**
- **Config**: `capacitor.config.ts` — `appId`, `appName`, `webDir: public`, `server.url` (production URL), allowNavigation.
- **Plugins digunakan** (lihat `package.json` dependencies): `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/local-notifications`, `@capacitor/push-notifications`, `@capacitor/preferences`, `@capacitor/app`, `@capacitor/app-launcher`, `@capacitor-community/sqlite`, `@capacitor/mlkit/barcode-scanning`, `capacitor-mock-location-checker`, `capacitor-plugin-safe-area`, dsb.
- **Deep links / appUrlOpen**: `resources/js/app.tsx` menggunakan `App.getLaunchUrl()` dan `appUrlOpen` listener untuk navigasi dari URL (email verification, assetlinks).
- **Android assets & app link**: route `/.well-known/assetlinks.json` disajikan lewat `AuthFlowController::assetLinks`.

**API / Routes (inti)**
- **Public / Home**: `/` → Inertia `welcome`.
- **Sales (prefix `/sales`)**: dashboard, `attendance/check-in`, `attendance/check-out`, `visits` (POST), update customer contact, `utils/reverse-geocode`, `utils/nearby-customers`.
- **Notifications**: manage device token, send targeted push.
- **WhatsApp**: `/whatsapp/send` (admin endpoint) + API webhook route untuk provider.
- **Two-factor & App login**: `/two-factor-challenge/app`, `/email/verification-notification/app`, kiosk endpoints.

**Data models (ringkasan)**
- `User`, `Employee`, `Role`, `Customer`, `SalesVisit`, `SalesAttendance`, `SalesGpsLog`, `SalesProductStock`, `SalesVisitPhoto`, `FaceDescriptor`, `UserDeviceToken`, `Announcement`, `WhatsappLog`, `Warehouse`, dll. (lihat `app/Models/`).

**Developer / Build / Ops**
- **Vite + TypeScript**: `resources/js` + `vite.config.ts`, script `npm run dev|build|build:ssr`.
- **Scripts & setup**: composer `setup` script, `npm run dev` configured with concurrently for serve/queue/vite.
- **Testing**: Pest configured (`pestphp/pest`).

**Catatan penting / rekomendasi singkat**
- Untuk daftar halaman lengkap, lihat `resources/js/pages/`.
- Untuk daftar controllers & endpoint, lihat `app/Http/Controllers/` dan `routes/web.php` serta `routes/api.php`.
- Mobile behavior (fake GPS detection, deep linking, service worker) berada di `resources/js/pages/sales/` dan `resources/js/lib/`.

---
Dokumentasi ini dibuat otomatis berdasarkan pemindaian file utama. Jika Anda ingin saya memperluas tiap bagian (contoh: daftar endpoint lengkap dengan HTTP method dan controller, atau daftar halaman React lengkap dengan deskripsi tiap halaman), beritahu saya fitur mana yang mau diperdalam.

## Detail fitur (penjelasan & tujuan)

1) Attendance (Presensi Sales)
- Tujuan: Catat jam kerja sales (check-in / check-out) beserta lokasi untuk keperluan kehadiran dan audit.
- Endpoint: `POST /sales/attendance/check-in`, `POST /sales/attendance/check-out`
- Controller: `App\\Http\\Controllers\\SalesAttendanceController` (`checkIn`, `checkOut`)
- Frontend: `resources/js/pages/sales/visit-record.tsx` (UI check-in/out, face verification trigger)
- Model: `App\\Models\\SalesAttendance`
- Catatan: Validasi koordinat, transaction-safe, integrasi reverse-geocode untuk menyimpan alamat.

2) Sales Visit (Laporan Kunjungan / Pengiriman)
- Tujuan: Simpan laporan kunjungan pelanggan, foto bukti, transaksi produk (terjual/retur), dan update kontak pelanggan.
- Endpoint: `POST /sales/visits`, `PATCH /sales/customers/{id}/update-contact`
- Controller: `App\\Http\\Controllers\\SalesVisitController` (`store`, `updateContact`)
- Frontend: `resources/js/pages/sales/visit-record.tsx` + modal input dan komponen upload foto
- Models: `SalesVisit`, `SalesVisitPhoto`, `SalesVisitProduct`, `SalesProductHistory`, `Customer`, `StockMovement`, `SalesProductStock`
- Catatan: Mendukung mode pelanggan `database` atau `manual` (otomatis buat customer baru pada mode manual). Melakukan update stok dan pencatatan stock movement untuk aktivitas pengiriman.

3) Fake-GPS / Location Integrity
- Tujuan: Mendeteksi dan mencegah penggunaan aplikasi fake GPS serta memverifikasi lokasi perangkat sebelum presensi/kunjungan.
- Implementasi frontend: cek aplikasi terlarang via `AppLauncher.canOpenUrl`, `capacitor-mock-location-checker` dan logic per halaman `visit-record.tsx`.
- Catatan: Jika terdeteksi, UI menolak proses presensi/kunjungan.

4) Reverse Geocode & Nearby Customers
- Tujuan: Ubah koordinat menjadi alamat manusiawi dan cari pelanggan terdekat untuk memudahkan input.
- Endpoint: `POST /sales/utils/reverse-geocode`, `POST /sales/utils/nearby-customers`
- Controller: `App\\Http\\Controllers\\SalesUtilsController`, `App\\Http\\Controllers\\Utils\\NearbyCustomerController`
- Frontend: dipanggil dari `visit-record.tsx` dan util related.

5) Notifications & Push
- Tujuan: Kelola notifikasi in-app dan push (registrasi token perangkat, kirim push terarah, baca/tandai).
- Endpoints: banyak endpoint terkait notifikasi (lihat `routes/web.php` — storeDeviceToken, deviceTokenStatus, deactivateDeviceToken, patch mark read/unread, post targeted-push).
- Controller: `App\\Http\\Controllers\\NotificationController`
- Frontend: `resources/js/pages/notifications.tsx`, hooks `usePushNotifications`, service `PushNotificationService`.
- Models: `UserNotification`, `UserDeviceToken`, `Announcement` (opsional buat konten announcement saat kirim push)
- Catatan: Menggunakan FCM service wrapper (`App\\Services\\FcmPushService`) untuk pengiriman.

6) WhatsApp Integration
- Tujuan: Kirim pesan teks/media via gateway (Evolution API) dan terima webhook provider.
- Endpoints: `POST /whatsapp/send`, API webhook route di `routes/api.php`.
- Controller: `App\\Http\\Controllers\\WhatsappController`, webhook handler `App\\Http\\Controllers\\Api\\WhatsappWebhookController`.
- Catatan: Controller berinteraksi dengan service `EvolutionApiService`.

7) Kiosk Login & App Flow (Deep link / assetlinks)
- Tujuan: Masuk tanpa password via token untuk kiosk, dan dukungan app links untuk Android.
- Endpoints: `GET /kiosk/{token}`, `POST /kiosk/generate-link`, `GET /.well-known/assetlinks.json`
- Controller: `App\\Http\\Controllers\\AuthFlowController`
- Frontend: Kiosks biasanya membuka route `kiosk` yang akan auto-login.

8) Face Verification
- Tujuan: Verifikasi identitas user dengan descriptor wajah sebelum melakukan check-in/out.
- Backend: `App\\Models\\FaceDescriptor` menyimpan descriptor & path foto.
- Frontend: `resources/js/components/modal/face-verification-modal` dipanggil dari `visit-record.tsx`.

9) Sync Center / Offline-first support
- Tujuan: Menyimpan mutating requests saat offline dan sinkronisasi saat online; UI untuk melihat & mengelola antrean lokal.
- Frontend core: `resources/js/lib/offline-http.ts` (axios interceptor, queue, flush), `resources/js/pages/sync-center.tsx` (UI pengelolaan antrean)
- Backend: endpoint tetap sama; antrean replay akan mengirim request ke endpoint yang ada.

10) Service Worker & App Assets
- Tujuan: Daftarkan service worker untuk caching dan offline page; pendaftaran hanya di production/native.
- Implementasi: `resources/js/lib/service-worker.ts` + `public/sw.js`.

11) Supervisor / Monitoring
- Tujuan: Halaman untuk supervisor memantau tim sales, melihat monitoring per-user dan rekap.
- Controller: `App\\Http\\Controllers\\SupervisorController`
- Frontend: `resources/js/pages/supervisor/*` dan `resources/js/pages/sales/monitoring-record.tsx`.

12) Admin / Announcement
- Tujuan: Buat dan tampilkan pengumuman ke user; sanitasi HTML yang aman.
- Controller: `App\\Http\\Controllers\\AnnouncementController`, `NotificationController::sendTargetedPush` dapat membuat announcement.
- Frontend: halaman pengumuman di `resources/js/pages/announcements/`.

13) Developer / Build features
- Tujuan: Kemudahan development dan build (Vite, TypeScript, SSR optional, concurrent dev script)
- File & scripts: `package.json` scripts (`dev`, `build`, `build:ssr`), `composer.json` setup scripts.

---
Jika bagian di atas sudah sesuai, saya bisa:
- Buat tabel endpoint lengkap (method, path, controller, ringkasan) — saya akan ekstrak dari `routes/web.php` dan tiap controller.
- Buat daftar halaman React lengkap beserta prop input & komponen utama.
- Buat diagram singkat alur check-in → visit → sync.

Pilih salah satu opsi di atas untuk saya kerjakan berikutnya.
