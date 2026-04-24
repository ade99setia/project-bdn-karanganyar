# Sistem Sales — Dokumentasi

## Overview

Aplikasi mobile-first untuk tim sales: presensi (check-in/out), laporan kunjungan pelanggan, pengiriman produk, manajemen stok sales, monitoring supervisor, dan integrasi WhatsApp. Diakses via `/sales` dengan middleware role `sales`.

---

## Arsitektur File

**Backend**
- `app/Http/Controllers/SalesAttendanceController.php` — check-in, check-out
- `app/Http/Controllers/SalesVisitController.php` — simpan kunjungan, update kontak
- `app/Http/Controllers/SalesUtilsController.php` — reverse geocode, nearby customers
- `app/Http/Controllers/SupervisorController.php` — monitoring tim
- `app/Http/Controllers/WhatsappController.php` — kirim teks/media via Evolution API
- `app/Http/Controllers/Api/WhatsappWebhookController.php` — terima webhook WA
- `app/Services/EvolutionApiService.php` — wrapper Evolution API (sendText, sendMedia)
- `app/Services/ReceiptService.php` — generate & kirim struk WA (dipakai POS juga)
- `app/Models/` — `SalesAttendance`, `SalesVisit`, `SalesVisitPhoto`, `SalesVisitProduct`, `SalesProductHistory`, `SalesProductStock`, `Customer`, `StockMovement`

**Frontend**
- `resources/js/pages/sales/visit-record.tsx` — halaman utama sales (check-in, kunjungan, produk)
- `resources/js/pages/sales/monitoring-record.tsx` — monitoring per-user (supervisor)
- `resources/js/pages/supervisor/` — dashboard supervisor
- `resources/js/pages/settings/stockist.tsx` — manajemen stok & gudang (admin)
- `resources/js/components/settings/stockist/` — komponen CRUD stok & warehouse
- `resources/js/lib/offline-http.ts` — offline queue (axios interceptor)
- `resources/js/pages/sync-center.tsx` — UI kelola antrean offline

---

## Routes

```
# Sales
GET  /sales/dashboard                        → DashboardController@sales
POST /sales/attendance/check-in              → SalesAttendanceController@checkIn
POST /sales/attendance/check-out             → SalesAttendanceController@checkOut
POST /sales/visits                           → SalesVisitController@store
PATCH /sales/customers/{id}/update-contact   → SalesVisitController@updateContact
POST /sales/utils/reverse-geocode            → SalesUtilsController@reverseGeocode
POST /sales/utils/nearby-customers           → Utils\NearbyCustomerController (invokable)

# Supervisor
GET  /supervisor/dashboard                   → SupervisorController@dashboard
GET  /sales/monitoring-record/{user_id}      → SalesController@monitoringRecord

# WhatsApp
POST /whatsapp/send                          → WhatsappController@sendText
POST /api/webhook/evolution/{any?}           → Api\WhatsappWebhookController@handle

# Settings — Stok & Gudang (admin)
GET  /settings/stockist                      → StockistManagementController@index
POST /settings/warehouses                    → StockistManagementController@storeWarehouse
PUT  /settings/warehouses/{id}               → StockistManagementController@updateWarehouse
DELETE /settings/warehouses/{id}             → StockistManagementController@destroyWarehouse
POST /settings/stocks/adjust                 → StockistManagementController@adjustStock

# Settings — Membership (admin)
GET  /settings/membership                    → MembershipController@index
POST /settings/membership/tiers              → MembershipController@storeTier
POST /settings/membership/members            → MembershipController@storeMember
GET  /settings/membership/members/search     → MembershipController@searchMembers
```

---

## Fitur Lengkap

### Presensi (Attendance)
- Check-in & check-out dengan koordinat GPS
- Validasi fake GPS via `capacitor-mock-location-checker` + `AppLauncher.canOpenUrl`
- Reverse geocode otomatis → simpan alamat kunjungan
- Face verification sebelum check-in/out (`FaceDescriptor` model)

### Laporan Kunjungan
- Input kunjungan: pilih pelanggan (database atau manual buat baru)
- Upload foto bukti kunjungan
- Input produk terjual/retur → update `SalesProductStock` + `StockMovement`
- Update kontak pelanggan (nama, telepon, alamat)
- Nearby customers: cari pelanggan terdekat berdasarkan koordinat

### Manajemen Stok Sales
- Stok sales (`SalesProductStock`) terpisah dari stok gudang (`ProductStock`)
- Admin bisa transfer stok: gudang → sales (type: `out`) atau masuk gudang (type: `in`)
- Setiap pergerakan tercatat di `StockMovement`

### Manajemen Gudang (Admin)
- CRUD warehouse: nama, kode, status aktif/nonaktif, logo, alamat, telepon
- Field struk: `receipt_header`, `receipt_footer` (custom per warehouse)
- Upload logo warehouse (dikompresi ke WebP via `browser-image-compression`)
- Tabel stok per warehouse dengan filter & pagination

### Membership
- Tier membership: nama, deskripsi, `default_discount_percentage`, `applies_to_all_products`
- Diskon per produk spesifik via `MembershipTierProductDiscount`
- Member: nomor member, nama, telepon, email, tier, status aktif
- Search member real-time (dipakai di POS checkout)

### WhatsApp Integration
- `EvolutionApiService::sendText` — kirim pesan teks dengan delay & link preview
- `EvolutionApiService::sendMedia` — kirim gambar/PDF (multi-format fallback: data URI, base64)
- Semua pesan keluar dicatat ke `WhatsappLog`
- Webhook handler untuk pesan masuk dari Evolution API
- Normalisasi nomor HP: `08xxx` / `+62xxx` / `62xxx` → `62xxx`

### Monitoring & Supervisor
- Supervisor bisa lihat aktivitas tim sales per hari
- Monitoring record per-user: kunjungan, presensi, produk
- Dashboard supervisor dengan rekap tim

### Offline-First & Sync
- `offline-http.ts`: intercept axios, queue request saat offline, flush saat online
- `sync-center.tsx`: UI untuk lihat antrean, retry manual, clear queue
- Service worker untuk caching asset (production/native only)

### Notifikasi & Push
- Device token management (FCM)
- Push notification terarah ke user list
- In-app notification: mark read/unread, buka via link
- Announcement: buat & tampilkan pengumuman ke user

---

## Database

```
sales_attendances       — id, user_id, check_in_at, check_out_at, lat, lng, address, is_fake_gps
sales_visits            — id, user_id, customer_id, visited_at, activity_type, notes, lat, lng, address
sales_visit_photos      — id, sales_visit_id, file_path, is_fake_gps
sales_visit_products    — id, sales_visit_id, product_id, quantity, type (sale/return)
sales_product_stocks    — id, user_id, product_id, quantity
sales_product_histories — id, user_id, product_id, quantity, type, sales_visit_id
stock_movements         — id, product_id, warehouse_id, user_id, type, quantity, reference, note, created_by
customers               — id, name, phone, address, lat, lng, ...
members                 — id, user_id, membership_tier_id, member_number, name, phone, email, is_active
membership_tiers        — id, name, default_discount_percentage, applies_to_all_products
whatsapp_logs           — id, type, target, message, keyword, payload, http_status
```

---

## Konfigurasi .env

```env
EVOLUTION_API_BASE_URL=https://...
EVOLUTION_API_INSTANCE_NAME=nama-instance
EVOLUTION_API_KEY=api-key

FCM_SERVICE_ACCOUNT_PATH=storage/app/firebase/xxx.json
FCM_PROJECT_ID=...
```
