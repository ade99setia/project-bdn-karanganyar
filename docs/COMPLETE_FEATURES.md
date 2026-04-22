# COMPLETE FEATURES — Ringkasan Fitur dan Mapping Routes / Controllers

Dokumen ini menyajikan ringkasan fitur utama aplikasi beserta mapping ke route dan controller yang relevan. Tujuan: memberikan gambaran cepat tentang apa yang aplikasi lakukan dan file backend/frontend utama yang mengimplementasikannya.

Cara baca singkat:
- Setiap fitur berisi: Tujuan singkat, Route(s) (path + HTTP method), Controller (class + method), Model(s) utama, dan Frontend (halaman/komponen) yang terkait.

1) Authentication & User Management
- Tujuan: Login, register, email verification, two-factor, profil dan manajemen user/role.
- Routes: Laravel Fortify routes (standar) + `settings/*` routes (lihat `routes/settings.php`).
- Controllers: `Settings\\ProfileController`, `Settings\\PasswordController`, `Settings\\TwoFactorAuthenticationController`, `Settings\\UserManagementController`.
- Models: `App\\Models\\User`, `App\\Models\\Role`.
- Frontend: `resources/js/pages/auth/*`, `resources/js/pages/settings/*`.

2) Kiosk Login & App Flow
- Tujuan: Login via token untuk kiosk, dan dukungan Android App Links.
- Routes: `GET /kiosk/{token}` → `AuthFlowController@kioskLogin`; `POST /kiosk/generate-link` → `AuthFlowController@generateKioskLink`; `GET /.well-known/assetlinks.json` → `AuthFlowController@assetLinks`.
- Controller: `App\\Http\\Controllers\\AuthFlowController`.
- Frontend: Inertia redirect flow; mobile deep-link handling di `resources/js/app.tsx`.

3) Attendance (Presensi Sales)
- Tujuan: Check-in / check-out sales dengan lokasi untuk audit dan jam kerja.
- Routes: `POST /sales/attendance/check-in` → `SalesAttendanceController@checkIn`; `POST /sales/attendance/check-out` → `SalesAttendanceController@checkOut`.
- Controller: `App\\Http\\Controllers\\SalesAttendanceController`.
- Models: `App\\Models\\SalesAttendance`.
- Frontend: `resources/js/pages/sales/visit-record.tsx` (UI presensi, pemicu face verification, pengiriman lokasi).

4) Sales Visit (Laporan Kunjungan / Pengiriman)
- Tujuan: Simpan laporan kunjungan, foto bukti, catat produk terjual/retur, dan update kontak pelanggan.
- Routes: `POST /sales/visits` → `SalesVisitController@store`; `PATCH /sales/customers/{id}/update-contact` → `SalesVisitController@updateContact`.
- Controller: `App\\Http\\Controllers\\SalesVisitController`.
- Models: `SalesVisit`, `SalesVisitPhoto`, `SalesVisitProduct`, `SalesProductHistory`, `SalesProductStock`, `StockMovement`, `Customer`.
- Frontend: `resources/js/pages/sales/visit-record.tsx` + modal input & upload components.

5) Reverse Geocode & Nearby Customers
- Tujuan: Konversi koordinat → alamat agar disimpan sebagai alamat kunjungan; temukan pelanggan terdekat.
- Routes: `POST /sales/utils/reverse-geocode` → `SalesUtilsController@reverseGeocode`; `POST /sales/utils/nearby-customers` → `App\\Http\\Controllers\\Utils\\NearbyCustomerController` (invokable).
- Controller: `App\\Http\\Controllers\\SalesUtilsController`, `App\\Http\\Controllers\\Utils\\NearbyCustomerController`.
- Frontend: dipanggil dari halaman kunjungan dan util frontend.

6) Fake-GPS / Location Integrity
- Tujuan: Deteksi aplikasi Fake GPS dan cek mock-location sebelum izinkan presensi/kunjungan.
- Implementasi: Frontend checks di `resources/js/pages/sales/visit-record.tsx` menggunakan `AppLauncher.canOpenUrl` dan `capacitor-mock-location-checker`.
- Backend: beberapa kolom `is_fake_gps` / `fake_gps_score` disimpan pada model (mis. `SalesVisit`, `SalesVisitPhoto`).

7) Notifications & Push
- Tujuan: Kelola notifikasi in-app dan push, registrasi token perangkat, kirim push terarah, baca/tandai notifikasi.
- Routes (intinya):
  - `GET /notifications` → `NotificationController@index`
  - `POST /notifications/device-token` → `NotificationController@storeDeviceToken`
  - `GET /notifications/device-token/status` → `NotificationController@deviceTokenStatus`
  - `POST /notifications/device-token/deactivate` → `NotificationController@deactivateDeviceToken`
  - `PATCH /notifications/read-all` → `NotificationController@markAllAsRead`
  - `GET /notifications/{notification}/read` → `NotificationController@markAsReadFromLink`
  - `PATCH /notifications/{notification}/read` → `NotificationController@markAsRead`
  - `PATCH /notifications/{notification}/unread` → `NotificationController@markAsUnread`
  - `POST /notifications/targeted-push` → `NotificationController@sendTargetedPush`
- Controller: `App\\Http\\Controllers\\NotificationController`.
- Models: `UserNotification`, `UserDeviceToken`, `Announcement`.
- Frontend: `resources/js/pages/notifications.tsx`, hooks `usePushNotifications`, `PushNotificationService`.

8) WhatsApp Integration
- Tujuan: Kirim pesan teks/media melalui gateway (Evolution API) dan terima webhook masuk.
- Routes: `POST /whatsapp/send` → `WhatsappController@send` (controller method names vary: `sendText`, `sendMedia` in controller); API webhook: `POST /api/webhook/evolution/{any?}` → `App\\Http\\Controllers\\Api\\WhatsappWebhookController@handle`.
- Controller: `App\\Http\\Controllers\\WhatsappController`, `App\\Http\\Controllers\\Api\\WhatsappWebhookController`.
- Services: `App\\Services\\EvolutionApiService`.

9) Announcements (Pengumuman)
- Tujuan: Buat, sanitize, dan tampilkan pengumuman ke user.
- Routes: `GET /announcements/{announcement}` → `AnnouncementController@show`; admin announcement management under `settings/announcements`.
- Controllers: `App\\Http\\Controllers\\AnnouncementController`, `Settings\\NotificationManagementController`.
- Frontend: `resources/js/pages/announcements/*`.

10) Sync Center — Offline-first support
- Tujuan: Menyimpan request mutating saat offline, replay saat online, dan menyediakan UI untuk mengelola antrean lokal.
- Frontend core: `resources/js/lib/offline-http.ts` (axios interceptor, queue, cache), `resources/js/pages/sync-center.tsx` (UI untuk melihat/retry/clear antrean).
- Backend: tidak memerlukan endpoint khusus — antrean replay mengirim ulang ke endpoint yang ada.

11) Service Worker & PWA Assets
- Tujuan: Register service worker untuk caching asset & offline fallback, hanya di production/native.
- Lokasi: `resources/js/lib/service-worker.ts`, `public/sw.js`.

12) Supervisor / Monitoring
- Tujuan: Halaman untuk supervisor memantau aktivitas tim sales.
- Routes: prefixed `supervisor/*` di `routes/web.php` (e.g. `GET /supervisor/dashboard`, monitoring routes).
- Controller: `App\\Http\\Controllers\\SupervisorController`.
- Frontend: `resources/js/pages/supervisor/*`, `resources/js/pages/sales/monitoring-record.tsx`.

13) Product / Stock / Warehouse Management (Admin)
- Tujuan: CRUD produk, stok, stockist, penyesuaian stock, dan historis pergerakan stok.
- Routes: `settings/products`, `settings/warehouses`, `settings/stocks/adjust` (lihat `routes/settings.php`).
- Controllers: `Settings\\ProductManagementController`, `Settings\\StockistManagementController`.
- Models: `Product`, `ProductStock`, `SalesProductStock`, `StockMovement`, `Warehouse`.

16) POS Kasir (Point of Sale)
- Tujuan: Sistem kasir berbasis web untuk transaksi tunai, manajemen shift, diskon membership, dan cetak struk.
- Routes: prefix `/pos` — lihat `routes/web.php` (middleware: `auth`, `verified`, `posAccess`).
  - `GET /pos` → `POSController@index`
  - `GET /pos/products/search` → `POSController@searchProducts`
  - `POST /pos/cart/preview` → `POSController@previewCart`
  - `POST /pos/transactions/checkout` → `POSController@checkout`
  - `POST /pos/shifts/open` → `CashierShiftController@open`
  - `POST /pos/shifts/close` → `CashierShiftController@close`
  - `GET /pos/shifts/current` → `CashierShiftController@current`
- Controllers: `App\\Http\\Controllers\\POSController`, `App\\Http\\Controllers\\CashierShiftController`, `App\\Http\\Controllers\\ReceiptController`.
- Services: `App\\Services\\POSService`, `App\\Services\\DiscountService`, `App\\Services\\ShiftService`, `App\\Services\\ReceiptService`.
- Models: `PosTransaction`, `PosTransactionItem`, `CashierShift`, `Member`, `MembershipTier`, `MembershipTierProductDiscount`.
- Middleware: `App\\Http\\Middleware\\CheckPOSAccess` (role: admin, kasir).
- Frontend: `resources/js/pages/pos/index.tsx` (layout 3 kolom responsif), `resources/js/components/pos/ShiftManager.tsx`, `resources/js/components/pos/ReceiptModal.tsx`.
- Hook: `resources/js/hooks/use-hid-scanner.ts` (deteksi scanner USB/Bluetooth HID).
- Fitur utama:
  - Layout 3 kolom desktop / bottom tab mobile
  - Pencarian produk real-time + HID barcode scanner + kamera scanner (mobile)
  - Keranjang dengan diskon membership otomatis
  - Shift management dengan hide/show info (privasi pelanggan)
  - Quick cash 6 pilihan berdasarkan pecahan uang standar
  - Kembalian real-time + tombol kurangi nominal
  - Live clock per detik

17) Membership Management
- Tujuan: Kelola tier membership, diskon per tier/produk, dan data member.
- Routes: prefix `settings/membership` — lihat `routes/settings.php`.
  - `GET /settings/membership` → `MembershipController@index`
  - `POST /settings/membership/tiers` → `MembershipController@storeTier`
  - `POST /settings/membership/members` → `MembershipController@storeMember`
  - `GET /settings/membership/members/search` → `MembershipController@searchMembers`
- Controller: `App\\Http\\Controllers\\Settings\\MembershipController`.
- Models: `MembershipTier`, `Member`, `MembershipTierProductDiscount`.
- Frontend: `resources/js/pages/settings/membership/index.tsx`.

14) Developer tooling / Build scripts
- Tujuan: Development & build flow (Vite, TypeScript, concurrent dev script, SSR optional).
- Files: `package.json` scripts (`dev`, `build`, `build:ssr`), `vite.config.ts`, `resources/js/app.tsx` (Inertia bootstrap), `composer.json` scripts (setup, dev).

15) Capacitor / Mobile plugins & behavior
- Tujuan: Native mobile features (camera, geolocation, push, local notifications, preferences, sqlite, app launcher, status bar, push notifications, barcode-scanning).
- Config: `capacitor.config.ts` (appId, appName, webDir, server.url).
- Plugins (diperlihatkan di `package.json` dependencies): `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/local-notifications`, `@capacitor/push-notifications`, `@capacitor/preferences`, `@capacitor/app`, `@capacitor/app-launcher`, `@capacitor-community/sqlite`, `@capacitor-mlkit/barcode-scanning`, `capacitor-mock-location-checker`, dsb.
- Frontend: deep link handling di `resources/js/app.tsx`, status bar handling, native-only UI behaviors.

Referensi file utama:
- Routes: [routes/web.php](routes/web.php), [routes/settings.php](routes/settings.php), [routes/api.php](routes/api.php)
- Controllers: `app/Http/Controllers/` (mis. `SalesAttendanceController.php`, `SalesVisitController.php`, `NotificationController.php`, `AuthFlowController.php`, `WhatsappController.php`, `SupervisorController.php`, `DashboardController.php`)
- Frontend entry: `resources/js/app.tsx` dan folder `resources/js/pages/`, `resources/js/components/`, `resources/js/lib/`.

Catatan & rekomendasi singkat
- Dokumen ini merangkum fitur secara garis besar dan mapping ke route/controller utama. Untuk dokumentasi API terperinci (mis. daftar semua route + param + response), saya dapat menghasilkan `docs/API.md` yang mengekstrak semua route secara lengkap dari file `routes/*.php`.
- Jika Anda ingin, saya bisa juga menambahkan tabel model → kolom penting (ringkasan skema) atau mengekspor endpoint ke CSV/Markdown table.

File ini dibuat otomatis berdasarkan pemindaian file proyek. Untuk melihat ringkasan singkat lain, lihat juga `docs/FEATURES.md`, `docs/ENDPOINTS.md`, dan `docs/FRONTEND_PAGES.md`.
