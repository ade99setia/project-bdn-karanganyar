# Panduan Lengkap User - Kasir & Sales

## 📋 Daftar Isi

1. [Overview Sistem](#1-overview-sistem)
2. [Setup Awal](#2-setup-awal)
3. [Login & Akses](#3-login--akses)
4. [Mode Kasir (POS)](#4-mode-kasir-pos)
5. [Mode Sales (Delivery)](#5-mode-sales-delivery)
6. [Role & Permission](#6-role--permission)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Overview Sistem

Aplikasi ini memiliki **2 mode utama**:

### 🏪 Mode Kasir (POS)
- **Platform:** Web (PC/Tablet)
- **Lokasi:** Toko/Cabang fisik
- **Fungsi:** Transaksi penjualan langsung di kasir
- **Fitur:**
  - Scan barcode produk
  - Keranjang belanja
  - Membership & diskon
  - Shift management
  - Struk digital via WhatsApp
  - Multi-cabang

### 🚚 Mode Sales (Delivery)
- **Platform:** Mobile App (Android/iOS)
- **Lokasi:** Lapangan (kunjungan pelanggan)
- **Fungsi:** Pengiriman barang ke pelanggan
- **Fitur:**
  - Presensi GPS (check-in/check-out)
  - Laporan kunjungan
  - Foto bukti pengiriman
  - Pencatatan produk terjual/retur
  - Offline mode
  - Fake GPS detection

---

## 2. Setup Awal

### Quick Setup (Recommended)

**Windows:**
```bash
setup-pos.bat
```

**Linux/Mac:**
```bash
chmod +x setup-pos.sh
./setup-pos.sh
```

### Manual Setup

```bash
# 1. Install dependencies
composer install
npm install

# 2. Setup database
php artisan migrate

# 3. Seed data
php artisan db:seed --class=POSSetupSeeder    # Kasir & Admin
php artisan db:seed --class=SalesSeeder       # Sales
php artisan db:seed --class=MembershipSeeder  # Membership (optional)

# 4. Build assets
npm run build

# 5. Start server
php artisan serve
```

---

## 3. Login & Akses

### 🔑 Kredensial Default

#### Admin (Full Access)
- **Email:** admin@example.com
- **Password:** admin123
- **Akses:** Semua fitur (POS, Sales Monitoring, Settings, Reports)
- **URL:** http://localhost:8000/login

#### Kasir (POS Only)
- **Email:** kasir01@example.com (kasir02, kasir03, dst)
- **Password:** password
- **Akses:** POS untuk cabang yang ditugaskan
- **URL:** http://localhost:8000/pos

#### Sales (Delivery Only)
- **Email:** sales01@example.com (sales02, sales03, dst)
- **Password:** password
- **Akses:** Sales dashboard, kunjungan, presensi
- **URL:** http://localhost:8000/sales/dashboard

---

## 4. Mode Kasir (POS)

### 📍 Akses
- **URL:** `/pos`
- **Role:** kasir, admin, supervisor

### 🔄 Workflow Harian

#### A. Buka Shift
```
1. Login sebagai kasir
2. Buka /pos
3. Klik "Buka Shift"
4. Input modal awal (misal: 100000)
5. Klik "Simpan"
```

#### B. Transaksi
```
1. Cari Produk
   - Ketik nama/SKU
   - Atau scan barcode
   
2. Tambah ke Keranjang
   - Klik produk
   - Atur quantity
   
3. Terapkan Member (Optional)
   - Cari member by nomor/nama/phone
   - Pilih member
   - Diskon otomatis diterapkan
   
4. Input Uang Diterima
   - Masukkan nominal
   - Sistem hitung kembalian otomatis
   
5. Checkout
   - Klik "Checkout"
   - Transaksi tersimpan
   
6. Cetak/Kirim Struk
   - Cetak ke printer
   - Atau kirim via WhatsApp
```

#### C. Tutup Shift
```
1. Klik "Tutup Shift"
2. Hitung uang di laci kasir
3. Input jumlah aktual
4. Sistem tampilkan selisih
5. Klik "Simpan"
```

### 📊 Fitur Kasir

| Fitur | Deskripsi |
|-------|-----------|
| **Product Search** | Cari produk by nama/SKU/barcode |
| **Cart Management** | Tambah, ubah quantity, hapus item |
| **Member Discount** | Diskon otomatis untuk member |
| **Multi-Discount** | Diskon bertingkat per produk |
| **Shift Management** | Buka/tutup shift dengan rekonsiliasi |
| **Receipt Print** | Cetak struk thermal/USB printer |
| **WhatsApp Receipt** | Kirim struk digital via WA |
| **Stock Real-time** | Stok update otomatis per transaksi |
| **Multi-Branch** | Isolasi stok per cabang |

### 📖 Dokumentasi Lengkap
Baca **POS_SETUP_GUIDE.md** untuk detail lengkap.

---

## 5. Mode Sales (Delivery)

### 📍 Akses
- **URL:** `/sales/dashboard`
- **Role:** sales
- **Platform:** Mobile App (recommended)

### 🔄 Workflow Harian

#### A. Check-in (Pagi)
```
1. Buka aplikasi
2. Aktifkan GPS
3. Klik "Check-in"
4. Sistem catat lokasi & waktu
```

#### B. Kunjungan Pelanggan
```
1. Pilih Pelanggan
   - Dari daftar
   - Atau "Cari Terdekat"
   
2. Navigasi ke Lokasi
   - Gunakan GPS/Maps
   
3. Mulai Kunjungan
   - Klik "Mulai Kunjungan"
   
4. Isi Form:
   - Foto bukti (min 1, max 10)
   - Produk terjual + quantity
   - Produk retur (jika ada)
   - Catatan
   - Update kontak (jika perlu)
   
5. Simpan Kunjungan
   - Klik "Simpan"
   - Data tersimpan (online/offline)
```

#### C. Check-out (Sore)
```
1. Klik "Check-out"
2. Sistem catat lokasi & waktu
3. Hitung total jam kerja
```

### 📊 Fitur Sales

| Fitur | Deskripsi |
|-------|-----------|
| **GPS Attendance** | Check-in/out dengan lokasi |
| **Visit Report** | Laporan kunjungan pelanggan |
| **Photo Proof** | Foto bukti pengiriman (wajib) |
| **Product Tracking** | Catat produk terjual/retur |
| **Nearby Customers** | Cari pelanggan terdekat |
| **Offline Mode** | Kerja tanpa internet, sync nanti |
| **Fake GPS Detection** | Deteksi aplikasi fake GPS |
| **Contact Update** | Update kontak pelanggan |
| **Stock Management** | Stok personal sales |

### 📖 Dokumentasi Lengkap
Baca **SALES_GUIDE.md** untuk detail lengkap.

---

## 6. Role & Permission

### 📊 Tabel Akses

| Role | POS | Sales | Settings | Reports | Multi-Branch |
|------|-----|-------|----------|---------|--------------|
| **admin** | ✅ | ✅ (monitoring) | ✅ | ✅ (semua) | ✅ |
| **supervisor** | ✅ | ✅ (monitoring) | ❌ | ✅ (cabang sendiri) | ❌ |
| **kasir** | ✅ | ❌ | ❌ | ❌ | ❌ (cabang sendiri) |
| **sales** | ❌ | ✅ | ❌ | ❌ | ❌ |

### 🔐 Middleware

**POS Routes:** `posAccess` middleware
- Mengizinkan: kasir, admin, supervisor
- Validasi: warehouse assignment untuk kasir

**Sales Routes:** `roleUser:sales,active` middleware
- Mengizinkan: sales dengan status active
- Validasi: employee record harus ada

---

## 7. Troubleshooting

### 🏪 Kasir Issues

#### "Akses ditolak"
```sql
-- Cek role
SELECT u.email, r.name 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'kasir01@example.com';

-- Fix: Update role
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'kasir') 
WHERE email = 'kasir01@example.com';
```

#### "Belum ditugaskan ke cabang"
```sql
-- Assign warehouse
UPDATE users 
SET warehouse_id = 1 
WHERE email = 'kasir01@example.com';
```

#### "Harus membuka shift terlebih dahulu"
**Solusi:** Klik tombol "Buka Shift" di halaman POS

#### "Stok tidak mencukupi"
**Solusi:** 
- Cek stok di Settings > Stockist
- Atau kurangi quantity di keranjang

---

### 🚚 Sales Issues

#### "Data karyawan tidak ditemukan"
```sql
-- Cek employee
SELECT u.email, e.status 
FROM users u 
LEFT JOIN employees e ON u.id = e.user_id 
WHERE u.email = 'sales01@example.com';

-- Fix: Buat employee
INSERT INTO employees (user_id, status, join_date) 
VALUES (
    (SELECT id FROM users WHERE email = 'sales01@example.com'),
    'active',
    NOW()
);
```

#### "Status akun inactive"
```sql
-- Update status
UPDATE employees 
SET status = 'active' 
WHERE user_id = (SELECT id FROM users WHERE email = 'sales01@example.com');
```

#### Tidak bisa check-in
**Kemungkinan:**
1. GPS tidak aktif → Aktifkan GPS
2. Fake GPS terdeteksi → Uninstall fake GPS app
3. Permission ditolak → Izinkan akses lokasi

#### Data tidak tersync
**Solusi:**
1. Buka `/sync-center`
2. Klik "Retry All"
3. Jika gagal, "Clear Queue" dan input ulang

---

## 8. Perbandingan Kasir vs Sales

| Aspek | Kasir | Sales |
|-------|-------|-------|
| **Platform** | Web (PC/Tablet) | Mobile App |
| **Lokasi** | Toko/Cabang | Lapangan |
| **Presensi** | Shift-based | GPS check-in/out |
| **Transaksi** | POS (jual langsung) | Delivery (kirim barang) |
| **Stok** | Warehouse-based | Personal stock |
| **GPS** | Tidak perlu | Wajib |
| **Offline** | Optional | Penting |
| **Foto** | Tidak perlu | Wajib (bukti) |
| **Customer** | Walk-in | Kunjungan terjadwal |
| **Payment** | Cash/QRIS | COD/Transfer |

---

## 9. Quick Commands

### Setup
```bash
# Full setup
./setup-pos.sh  # atau setup-pos.bat

# Seed kasir only
php artisan db:seed --class=POSSetupSeeder

# Seed sales only
php artisan db:seed --class=SalesSeeder

# Seed membership
php artisan db:seed --class=MembershipSeeder
```

### Development
```bash
# Start server
php artisan serve

# Build assets
npm run build

# Watch assets (development)
npm run dev

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Database
```bash
# Fresh migration
php artisan migrate:fresh

# Fresh + seed
php artisan migrate:fresh --seed

# Rollback
php artisan migrate:rollback

# Tinker (console)
php artisan tinker
```

---

## 10. Support & Resources

### 📚 Dokumentasi
- **POS_SETUP_GUIDE.md** - Panduan lengkap POS Kasir
- **SALES_GUIDE.md** - Panduan lengkap Sales Delivery
- **POS_QUICK_START.md** - Quick reference POS

### 🆘 Support
- **Email:** support@example.com
- **WhatsApp:** 0812-3456-7890
- **GitHub Issues:** [Link to repo]

### 🔗 Links
- **Admin Panel:** http://localhost:8000/settings
- **POS:** http://localhost:8000/pos
- **Sales Dashboard:** http://localhost:8000/sales/dashboard
- **Sync Center:** http://localhost:8000/sync-center

---

## 11. Best Practices

### Untuk Kasir:
- ✅ Buka shift di awal, tutup di akhir
- ✅ Verifikasi total sebelum checkout
- ✅ Hitung uang dengan teliti
- ✅ Cetak struk untuk customer
- ✅ Cek stok sebelum transaksi

### Untuk Sales:
- ✅ Check-in/out setiap hari
- ✅ Ambil foto bukti yang jelas
- ✅ Catat produk dengan akurat
- ✅ Update kontak pelanggan
- ✅ Sync data saat online
- ✅ Jangan gunakan fake GPS

### Untuk Admin:
- ✅ Assign warehouse ke kasir
- ✅ Assign stok ke sales
- ✅ Monitor shift dengan selisih besar
- ✅ Review foto bukti sales
- ✅ Backup database rutin
- ✅ Update membership tier berkala

---

**Happy Working! 🚀**

**Version:** 1.0  
**Last Updated:** 2026-04-22
