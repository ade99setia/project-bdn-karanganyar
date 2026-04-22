# Panduan Setup POS Kasir

## 1. Persiapan Database

### Jalankan Migrations
```bash
php artisan migrate
```

Ini akan membuat tabel-tabel baru:
- `membership_tiers` - Tier membership (Bronze, Silver, Gold)
- `membership_tier_product_discounts` - Diskon produk spesifik per tier
- `members` - Data member
- `pos_transactions` - Transaksi POS
- `pos_transaction_items` - Item transaksi
- `cashier_shifts` - Shift kasir

### Jalankan Seeders

#### 1. Setup POS (Role & Users)
```bash
php artisan db:seed --class=POSSetupSeeder
```

Ini akan membuat:
- Role "kasir" dan "admin"
- User admin: `admin@example.com` / `admin123`
- User kasir untuk setiap warehouse: `kasir01@example.com` / `password`

#### 2. Setup Membership (Optional)
```bash
php artisan db:seed --class=MembershipSeeder
```

Ini akan membuat:
- 3 tier membership (Bronze 3%, Silver 5%, Gold 10%)
- 3 sample members
- Beberapa diskon produk spesifik

## 2. Login & Akses

### Kredensial Login

**Admin (Full Access):**
- Email: `admin@example.com`
- Password: `admin123`
- Akses: Semua fitur (POS, Settings, Reports, Membership Management)

**Kasir (POS Only):**
- Email: `kasir01@example.com` (sesuai nomor warehouse)
- Password: `password`
- Akses: Hanya POS untuk warehouse yang ditugaskan

### Role & Permission

| Role | Akses POS | Akses Settings | Akses Reports | Multi-Warehouse |
|------|-----------|----------------|---------------|-----------------|
| **admin** | ✅ | ✅ | ✅ (semua cabang) | ✅ |
| **supervisor** | ✅ | ❌ | ✅ (cabang sendiri) | ❌ |
| **kasir** | ✅ | ❌ | ❌ | ❌ (hanya cabang sendiri) |

## 3. Workflow Kasir

### A. Login
1. Buka aplikasi
2. Login dengan email kasir: `kasir01@example.com`
3. Password: `password`

### B. Buka Shift
Sebelum melakukan transaksi, kasir **HARUS** buka shift terlebih dahulu:

1. Masuk ke halaman POS: `/pos`
2. Klik tombol "Buka Shift"
3. Input modal awal (uang di laci kasir), misal: `100000`
4. Klik "Buka Shift"

**Catatan:** Kasir hanya bisa melakukan transaksi jika shift sudah dibuka.

### C. Transaksi POS
1. **Cari Produk:**
   - Ketik nama produk atau SKU di search box
   - Atau scan barcode (jika menggunakan scanner)
   - Klik produk untuk menambahkan ke keranjang

2. **Kelola Keranjang:**
   - Ubah quantity dengan tombol +/-
   - Hapus item dengan tombol trash
   - Kosongkan keranjang dengan tombol "Kosongkan"

3. **Terapkan Member (Optional):**
   - Klik "Cari Member"
   - Input nomor member atau nama
   - Pilih member dari hasil pencarian
   - Diskon otomatis diterapkan

4. **Checkout:**
   - Pastikan keranjang sudah benar
   - Input jumlah uang yang diterima dari pelanggan
   - Sistem akan menghitung kembalian otomatis
   - Klik tombol "Checkout"

5. **Cetak/Kirim Struk:**
   - Setelah checkout berhasil, pilih:
     - Cetak struk (printer)
     - Kirim via WhatsApp
     - Atau keduanya

### D. Tutup Shift
Setelah selesai bertugas:

1. Klik tombol "Tutup Shift"
2. Hitung total uang di laci kasir
3. Input jumlah uang aktual
4. Sistem akan menampilkan:
   - Expected cash (seharusnya)
   - Actual cash (aktual)
   - Difference (selisih)
5. Klik "Tutup Shift"

**Catatan:** Jika selisih > Rp 10.000, mungkin perlu approval supervisor.

## 4. Workflow Admin

### A. Kelola Membership

**Akses:** `/settings/membership`

#### Membership Tiers
1. Klik tab "Membership Tiers"
2. Klik "Tambah Tier"
3. Isi form:
   - Nama tier (misal: "Platinum")
   - Deskripsi
   - Diskon default (%)
   - Berlaku untuk semua produk? (Ya/Tidak)
4. Klik "Simpan"

#### Diskon Produk Spesifik
1. Klik tab "Product Discounts"
2. Pilih tier membership
3. Pilih produk
4. Input diskon khusus (%)
5. Klik "Tambah"

**Contoh:**
- Tier Gold: diskon default 10%
- Produk A untuk Gold: diskon khusus 15% (override default)

#### Kelola Member
1. Klik tab "Members"
2. Klik "Tambah Member"
3. Isi form:
   - Nama
   - Nomor member (auto-generate atau manual)
   - Nomor WhatsApp
   - Email (optional)
   - Tier membership
4. Klik "Simpan"

### B. Kelola User & Warehouse

#### Assign Kasir ke Warehouse
```sql
-- Via database (sementara, nanti bisa via UI)
UPDATE users 
SET warehouse_id = 1 
WHERE email = 'kasir01@example.com';
```

Atau via Tinker:
```bash
php artisan tinker
```

```php
$kasir = User::where('email', 'kasir01@example.com')->first();
$warehouse = Warehouse::first();
$kasir->warehouse_id = $warehouse->id;
$kasir->save();
```

### C. Lihat Laporan

**Akses:** `/pos/reports` (coming soon)

- Total transaksi per hari/bulan
- Omzet per cabang
- Produk terlaris
- Performa kasir
- Member vs non-member

## 5. Troubleshooting

### Kasir tidak bisa akses POS
**Error:** "Akses ditolak. Hanya kasir, admin, dan supervisor yang dapat mengakses POS."

**Solusi:**
1. Pastikan user memiliki role "kasir"
```sql
SELECT u.email, r.name as role 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'kasir01@example.com';
```

2. Jika role salah, update:
```sql
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'kasir') 
WHERE email = 'kasir01@example.com';
```

### Kasir tidak bisa transaksi
**Error:** "Anda belum ditugaskan ke cabang manapun"

**Solusi:**
Assign warehouse ke kasir:
```sql
UPDATE users 
SET warehouse_id = 1 
WHERE email = 'kasir01@example.com';
```

### Tidak bisa checkout
**Error:** "Anda harus membuka shift terlebih dahulu"

**Solusi:**
Kasir harus buka shift dulu sebelum transaksi.

### Stok tidak mencukupi
**Error:** "Stok tidak mencukupi. Stok tersedia: X"

**Solusi:**
1. Cek stok produk di warehouse kasir
2. Adjust stok via Settings > Stockist
3. Atau kurangi quantity di keranjang

## 6. Tips & Best Practices

### Untuk Kasir:
- ✅ Selalu buka shift di awal tugas
- ✅ Tutup shift di akhir tugas
- ✅ Cek stok sebelum menambahkan produk ke keranjang
- ✅ Verifikasi total sebelum checkout
- ✅ Hitung uang dengan teliti untuk menghindari selisih

### Untuk Admin:
- ✅ Assign warehouse ke setiap kasir
- ✅ Buat tier membership yang jelas
- ✅ Review shift dengan selisih besar
- ✅ Monitor stok secara berkala
- ✅ Backup database secara rutin

## 7. Fitur Mendatang

- [ ] Barcode scanner integration (Capacitor)
- [ ] Bluetooth printer integration
- [ ] Offline mode dengan sync
- [ ] Reports & analytics dashboard
- [ ] Member self-registration
- [ ] Payment gateway (QRIS, transfer)
- [ ] Loyalty points system
- [ ] Refund/return management

## 8. Support

Jika ada pertanyaan atau masalah, hubungi:
- Email: support@example.com
- WhatsApp: 0812-3456-7890

---

**Version:** 1.0  
**Last Updated:** 2026-04-22
