# Panduan Sales Delivery

## 1. Overview

Sistem Sales Delivery adalah aplikasi mobile-first untuk sales lapangan yang melakukan pengiriman barang ke pelanggan. Sales dapat mencatat kunjungan, foto bukti pengiriman, update stok, dan melakukan presensi dengan verifikasi lokasi.

### Fitur Utama Sales:
- ✅ Presensi (Check-in/Check-out) dengan GPS
- ✅ Laporan kunjungan pelanggan
- ✅ Foto bukti pengiriman
- ✅ Pencatatan produk terjual/retur
- ✅ Update kontak pelanggan
- ✅ Deteksi Fake GPS
- ✅ Offline-first (sync saat online)
- ✅ Face verification (optional)

---

## 2. Login Sales

### Kredensial Default
Setelah menjalankan seeder, sales dapat login dengan:

**Sales User:**
- Email: `sales@example.com` (atau sesuai data di database)
- Password: `password` (default)

### Akses
- **Platform:** Mobile app (Android/iOS via Capacitor)
- **URL:** Sama dengan aplikasi utama, tapi dengan role "sales"
- **Dashboard:** `/sales/dashboard`

---

## 3. Workflow Sales Harian

### A. Check-in (Mulai Kerja)

**Langkah:**
1. Buka aplikasi di pagi hari
2. Pastikan GPS aktif
3. Klik tombol "Check-in"
4. Sistem akan:
   - Ambil lokasi GPS saat ini
   - Deteksi fake GPS (jika ada)
   - Verifikasi wajah (optional)
   - Catat waktu check-in

**Endpoint:** `POST /sales/attendance/check-in`

**Data yang dicatat:**
- Waktu check-in
- Lokasi GPS (latitude, longitude)
- Alamat (reverse geocode)
- Fake GPS score
- Foto wajah (optional)

### B. Kunjungan Pelanggan

**Langkah:**
1. Pilih pelanggan dari daftar atau cari pelanggan terdekat
2. Navigasi ke lokasi pelanggan
3. Saat tiba, klik "Mulai Kunjungan"
4. Isi form kunjungan:
   - **Foto bukti pengiriman** (wajib, minimal 1 foto)
   - **Produk terjual** (pilih produk + quantity)
   - **Produk retur** (jika ada)
   - **Catatan kunjungan**
   - **Update kontak pelanggan** (jika berubah)
5. Klik "Simpan Kunjungan"

**Endpoint:** `POST /sales/visits`

**Data yang dicatat:**
- Customer ID
- Lokasi kunjungan (GPS + alamat)
- Foto-foto bukti (multiple)
- Produk terjual (dengan quantity)
- Produk retur (dengan quantity)
- Catatan
- Fake GPS detection

### C. Foto Bukti Pengiriman

**Requirements:**
- Minimal 1 foto per kunjungan
- Maksimal 10 foto per kunjungan
- Format: JPG/PNG
- Ukuran: Max 5MB per foto

**Tips:**
- Foto produk yang dikirim
- Foto bersama pelanggan
- Foto tanda terima (jika ada)
- Foto kondisi toko/lokasi

### D. Pencatatan Produk

**Produk Terjual:**
- Pilih produk dari daftar
- Input quantity yang terjual
- Sistem akan:
  - Kurangi stok sales
  - Buat record di `sales_product_history`
  - Buat `stock_movement` dengan type "sales_delivery"

**Produk Retur:**
- Pilih produk yang diretur
- Input quantity retur
- Input alasan retur
- Sistem akan:
  - Tambah kembali stok sales
  - Catat retur di history

### E. Update Kontak Pelanggan

Jika kontak pelanggan berubah:
1. Klik "Update Kontak"
2. Edit nomor telepon/WhatsApp
3. Klik "Simpan"

**Endpoint:** `PATCH /sales/customers/{id}/update-contact`

### F. Check-out (Selesai Kerja)

**Langkah:**
1. Di akhir hari, klik tombol "Check-out"
2. Sistem akan:
   - Ambil lokasi GPS saat ini
   - Catat waktu check-out
   - Hitung total jam kerja
   - Deteksi fake GPS

**Endpoint:** `POST /sales/attendance/check-out`

---

## 4. Fitur Khusus Sales

### A. Nearby Customers (Pelanggan Terdekat)

**Fungsi:** Mencari pelanggan dalam radius tertentu dari lokasi sales saat ini.

**Cara Pakai:**
1. Klik "Cari Pelanggan Terdekat"
2. Sistem akan menampilkan daftar pelanggan terurut berdasarkan jarak
3. Pilih pelanggan untuk kunjungan

**Endpoint:** `POST /sales/utils/nearby-customers`

**Parameter:**
- `latitude`: Lokasi sales saat ini
- `longitude`: Lokasi sales saat ini
- `radius`: Radius pencarian (default: 5km)

### B. Reverse Geocode

**Fungsi:** Konversi koordinat GPS menjadi alamat lengkap.

**Endpoint:** `POST /sales/utils/reverse-geocode`

**Digunakan untuk:**
- Alamat check-in/check-out
- Alamat kunjungan pelanggan
- Verifikasi lokasi

### C. Fake GPS Detection

**Fungsi:** Mendeteksi aplikasi fake GPS untuk mencegah kecurangan lokasi.

**Cara Kerja:**
1. Cek aplikasi fake GPS yang terinstall
2. Cek mock location setting
3. Hitung fake GPS score (0-100)
4. Jika terdeteksi, beri warning atau tolak presensi

**Apps yang dideteksi:**
- Fake GPS Location
- GPS Joystick
- Mock Locations
- Dan lainnya

### D. Offline Mode

**Fungsi:** Sales dapat bekerja tanpa koneksi internet, data akan di-sync saat online.

**Cara Kerja:**
1. Saat offline, semua request disimpan di local queue
2. Saat online, queue akan di-replay otomatis
3. UI menampilkan status sync

**Endpoint Sync:** Semua endpoint mutating (POST, PATCH, DELETE)

**Lihat Queue:** `/sync-center`

---

## 5. Monitoring Sales (Supervisor)

### A. Dashboard Supervisor

**Akses:** `/supervisor/dashboard`

**Fitur:**
- Real-time lokasi sales
- Status presensi (check-in/check-out)
- Jumlah kunjungan hari ini
- Total produk terjual
- Grafik performa

### B. Monitoring Team

**Akses:** `/supervisor/monitoring-team`

**Fitur:**
- Daftar semua sales di tim
- Status aktif/tidak aktif
- Lokasi terakhir
- Kunjungan hari ini

### C. Monitoring Record (Detail Sales)

**Akses:** `/supervisor/monitoring-record/{user_id}`

**Fitur:**
- History presensi
- History kunjungan
- Foto-foto bukti
- Produk terjual/retur
- GPS tracking
- Fake GPS detection log

---

## 6. Setup Sales User

### A. Buat Role Sales (Jika Belum Ada)

```sql
INSERT INTO roles (name, description, rank) 
VALUES ('sales', 'Sales Delivery - Kunjungan dan pengiriman barang', 4);
```

### B. Buat User Sales

Via Seeder (buat file `database/seeders/SalesSeeder.php`):

```php
<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SalesSeeder extends Seeder
{
    public function run(): void
    {
        $salesRole = Role::where('name', 'sales')->first();
        
        if (!$salesRole) {
            $salesRole = Role::create([
                'name' => 'sales',
                'description' => 'Sales Delivery',
                'rank' => 4,
            ]);
        }

        // Create demo sales users
        for ($i = 1; $i <= 3; $i++) {
            $user = User::firstOrCreate(
                ['email' => "sales{$i}@example.com"],
                [
                    'name' => "Sales {$i}",
                    'phone' => '0812345678' . str_pad($i, 2, '0', STR_PAD_LEFT),
                    'password' => Hash::make('password'),
                    'role_id' => $salesRole->id,
                    'email_verified_at' => now(),
                ]
            );

            // Create employee record (required for sales)
            Employee::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'status' => 'active',
                    'join_date' => now(),
                ]
            );
        }
    }
}
```

Jalankan:
```bash
php artisan db:seed --class=SalesSeeder
```

### C. Assign Sales ke Area (Optional)

```sql
-- Assign sales ke area tertentu
INSERT INTO sales_area_user (sales_area_id, user_id) 
VALUES (1, (SELECT id FROM users WHERE email = 'sales1@example.com'));
```

---

## 7. Stok Sales

### A. Assign Stok ke Sales

Sales memiliki stok produk sendiri yang terpisah dari warehouse.

**Via Settings > Stockist:**
1. Pilih sales
2. Pilih produk
3. Input quantity
4. Klik "Assign Stok"

**Via SQL:**
```sql
INSERT INTO sales_product_stocks (user_id, product_id, quantity) 
VALUES (
    (SELECT id FROM users WHERE email = 'sales1@example.com'),
    1, -- product_id
    100 -- quantity
);
```

### B. Adjust Stok Sales

```sql
UPDATE sales_product_stocks 
SET quantity = 150 
WHERE user_id = (SELECT id FROM users WHERE email = 'sales1@example.com')
AND product_id = 1;
```

---

## 8. Troubleshooting Sales

### Problem: "Data karyawan tidak ditemukan"

**Solusi:** Sales harus memiliki record di tabel `employees`

```sql
-- Cek employee
SELECT u.email, e.status 
FROM users u 
LEFT JOIN employees e ON u.id = e.user_id 
WHERE u.email = 'sales1@example.com';

-- Buat employee jika tidak ada
INSERT INTO employees (user_id, status, join_date) 
VALUES (
    (SELECT id FROM users WHERE email = 'sales1@example.com'),
    'active',
    NOW()
);
```

### Problem: "Status akun saat ini adalah inactive"

**Solusi:** Update status employee menjadi active

```sql
UPDATE employees 
SET status = 'active' 
WHERE user_id = (SELECT id FROM users WHERE email = 'sales1@example.com');
```

### Problem: Tidak bisa check-in

**Kemungkinan:**
1. GPS tidak aktif → Aktifkan GPS
2. Fake GPS terdeteksi → Uninstall aplikasi fake GPS
3. Permission lokasi ditolak → Izinkan akses lokasi

### Problem: Foto tidak bisa diupload

**Kemungkinan:**
1. Ukuran file terlalu besar → Compress foto
2. Format tidak didukung → Gunakan JPG/PNG
3. Storage penuh → Hapus file yang tidak perlu

### Problem: Data tidak tersync

**Solusi:**
1. Buka `/sync-center`
2. Cek queue yang pending
3. Klik "Retry All" untuk sync ulang
4. Jika gagal terus, klik "Clear Queue" dan input ulang

---

## 9. Perbedaan Kasir vs Sales

| Aspek | Kasir | Sales |
|-------|-------|-------|
| **Platform** | Web (PC/Tablet) | Mobile App |
| **Lokasi Kerja** | Toko/Cabang | Lapangan |
| **Presensi** | Shift-based | Check-in/Check-out |
| **Transaksi** | POS (jual langsung) | Delivery (kirim barang) |
| **Stok** | Warehouse-based | Personal stock |
| **GPS** | Tidak perlu | Wajib |
| **Offline Mode** | Optional | Penting |
| **Foto** | Tidak perlu | Wajib (bukti) |
| **Customer** | Walk-in | Kunjungan terjadwal |

---

## 10. Best Practices Sales

### Untuk Sales:
- ✅ Check-in di awal hari, check-out di akhir hari
- ✅ Selalu ambil foto bukti pengiriman
- ✅ Update kontak pelanggan jika berubah
- ✅ Catat produk terjual/retur dengan akurat
- ✅ Gunakan "Nearby Customers" untuk efisiensi rute
- ✅ Sync data saat ada koneksi internet
- ✅ Jangan gunakan fake GPS (akan terdeteksi)

### Untuk Supervisor:
- ✅ Monitor presensi sales setiap hari
- ✅ Review foto bukti pengiriman
- ✅ Cek fake GPS detection log
- ✅ Verifikasi produk terjual vs stok
- ✅ Follow up sales yang tidak check-out
- ✅ Analisis performa berdasarkan kunjungan

---

## 11. API Endpoints Sales

### Presensi
- `POST /sales/attendance/check-in` - Check-in
- `POST /sales/attendance/check-out` - Check-out

### Kunjungan
- `POST /sales/visits` - Simpan kunjungan
- `PATCH /sales/customers/{id}/update-contact` - Update kontak

### Utils
- `POST /sales/utils/reverse-geocode` - Konversi GPS ke alamat
- `POST /sales/utils/nearby-customers` - Cari pelanggan terdekat

### Dashboard
- `GET /sales/dashboard` - Dashboard sales
- `GET /sales/monitoring-record/{user_id}` - Detail monitoring

---

## 12. Mobile App Setup (Capacitor)

### Build Android App

```bash
# 1. Build web assets
npm run build

# 2. Sync to Capacitor
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. Build APK/AAB di Android Studio
```

### Permissions Required

**AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## 13. Tips Optimasi

### Untuk Performa:
- Compress foto sebelum upload (max 1MB)
- Sync data di WiFi jika memungkinkan
- Clear cache secara berkala
- Hapus foto lama yang sudah tersync

### Untuk Akurasi:
- Pastikan GPS akurat sebelum check-in
- Ambil foto dengan pencahayaan baik
- Verifikasi alamat pelanggan
- Catat quantity dengan teliti

---

## 14. Support

Jika ada pertanyaan atau masalah:
- Email: support@example.com
- WhatsApp: 0812-3456-7890
- Dokumentasi: Baca file ini dan POS_SETUP_GUIDE.md

---

**Version:** 1.0  
**Last Updated:** 2026-04-22
