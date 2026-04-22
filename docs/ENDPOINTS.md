# Daftar Endpoint (Ringkasan)

Berikut ringkasan endpoint penting yang ada di proyek, termasuk path, method, controller, dan tujuan singkat.

-- Public / App flow
- POST `/whatsapp/send` — `WhatsappController@send` — Kirim pesan WhatsApp via gateway.
- GET `/` — Inertia `welcome` — Halaman landing public.

-- Sales (prefix `/sales`)
- GET `/sales/dashboard` — `DashboardController@sales` — Halaman dashboard sales (mobile).
- GET `/sales/monitoring-record/{user_id}` — `SalesController@monitoringRecord` — Lihat monitoring per-user.
- POST `/sales/attendance/check-in` — `SalesAttendanceController@checkIn` — Check-in presensi (lat,lng,address).
- POST `/sales/attendance/check-out` — `SalesAttendanceController@checkOut` — Check-out presensi.
- POST `/sales/utils/reverse-geocode` — `SalesUtilsController@reverseGeocode` — Konversi koordinat → alamat.
- POST `/sales/visits` — `SalesVisitController@store` — Simpan laporan kunjungan / pengiriman + foto + produk.
- PATCH `/sales/customers/{id}/update-contact` — `SalesVisitController@updateContact` — Perbarui data kontak pelanggan.
- POST `/sales/utils/nearby-customers` — `Utils\\NearbyCustomerController` (invokable) — Cari pelanggan terdekat.

-- Notifications & Announcements
- GET `/notifications` — `NotificationController@index` — Halaman daftar notifikasi.
- POST `/notifications/device-token` — `NotificationController@storeDeviceToken` — Registrasi token perangkat.
- GET `/notifications/device-token/status` — `NotificationController@deviceTokenStatus` — Cek status token.
- POST `/notifications/device-token/deactivate` — `NotificationController@deactivateDeviceToken` — Nonaktifkan token.
- PATCH `/notifications/read-all` — `NotificationController@markAllAsRead` — Tandai semua notifikasi dibaca.
- GET `/notifications/{notification}/read` — `NotificationController@markAsReadFromLink` — Buka notifikasi via link dan tandai dibaca.
- PATCH `/notifications/{notification}/read` — `NotificationController@markAsRead` — Tandai notifikasi sebagai dibaca.
- PATCH `/notifications/{notification}/unread` — `NotificationController@markAsUnread` — Tandai notifikasi belum dibaca.
- POST `/notifications/targeted-push` — `NotificationController@sendTargetedPush` — Kirim push terarah ke user list.
- GET `/announcements/{announcement}` — `AnnouncementController@show` — Lihat pengumuman.

-- Auth / App utilities
- GET `/dashboard` — redirect ke `profile.edit` (role-based redirect).
- GET `/kiosk/{token}` — `AuthFlowController@kioskLogin` — Login via kiosk token.
- POST `/kiosk/generate-link` — `AuthFlowController@generateKioskLink` — Buat link kiosk (AJAX).
- GET `/.well-known/assetlinks.json` — `AuthFlowController@assetLinks` — Android assetlinks untuk App Links.

-- Email verification & 2FA (app-friendly)
- POST `/email/verification-notification/app` — `AuthFlowController@sendVerificationFromApp` — Kirim ulang verifikasi email dari app.
- GET `/email/verification-status` — `AuthFlowController@verificationStatus` — Cek status verifikasi user.
- POST `/two-factor-challenge/app` — `Laravel\\Fortify\\Http\\Controllers\\TwoFactorAuthenticatedSessionController@store` — 2FA challenge untuk app.

-- Settings / Admin (prefix `settings/*`)
Routes di `routes/settings.php` — beberapa endpoint utama:
- GET/ PATCH `settings/profile` — `Settings\\ProfileController@edit|update` — Edit profil, upload avatar, update face-id.
- DELETE `settings/profile` — `Settings\\ProfileController@destroy` — Hapus akun.
- GET/PUT `settings/password` — `Settings\\PasswordController@edit|update` — Ubah password.
- GET `settings/appearance` — render Inertia page untuk appearance.
- GET/PUT/DELETE `settings/users`, `settings/roles/*` — user & role management (`Settings\\UserManagementController`).
- Product CRUD: `settings/products` — `Settings\\ProductManagementController`.
- Announcement management: `settings/announcements` — `Settings\\NotificationManagementController@index`.
- WhatsApp blasting: `settings/whatsapp-blasting` & `settings/whatsapp-blasting/send` — `Settings\\WhatsappBlastingController`.
- Stockist & warehouse management: `settings/stockist`, `settings/warehouses`, `settings/stocks/adjust` — `Settings\\StockistManagementController`.

-- API routes
- GET `/api/user` (middleware `auth:sanctum`) — returns authenticated user info.
- POST `/api/webhook/evolution/{any?}` — `Api\\WhatsappWebhookController@handle` — webhook handler for WhatsApp provider.

Catatan: file `routes/web.php` mengimpor `settings.php` yang menambah banyak route admin/settings; untuk daftar lengkap, lihat file tersebut.
