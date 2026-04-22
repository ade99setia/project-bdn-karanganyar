# POS Kasir - Quick Start

## Setup (Pertama Kali)

### Windows:
```bash
setup-pos.bat
```

### Linux/Mac:
```bash
chmod +x setup-pos.sh
./setup-pos.sh
```

### Manual:
```bash
# 1. Install dependencies
composer install
npm install

# 2. Setup database
php artisan migrate

# 3. Seed data
php artisan db:seed --class=POSSetupSeeder
php artisan db:seed --class=MembershipSeeder

# 4. Build assets
npm run build
```

## Login

### Admin (Full Access)
- **URL:** http://localhost:8000/login
- **Email:** admin@example.com
- **Password:** admin123

### Kasir (POS Only)
- **Email:** kasir01@example.com
- **Password:** password
- **Akses:** `/pos`

### Sales (Delivery Only)
- **Email:** sales01@example.com
- **Password:** password
- **Akses:** `/sales/dashboard`

## Akses POS

Setelah login sebagai kasir:
1. Buka: http://localhost:8000/pos
2. Klik "Buka Shift" (input modal awal, misal: 100000)
3. Mulai transaksi!

## Akses Sales

Setelah login sebagai sales:
1. Buka: http://localhost:8000/sales/dashboard
2. Klik "Check-in" (aktifkan GPS)
3. Mulai kunjungan pelanggan!

## Workflow Transaksi

```
1. Cari Produk (ketik nama/SKU atau scan barcode)
   ↓
2. Tambah ke Keranjang (klik produk)
   ↓
3. Atur Quantity (tombol +/-)
   ↓
4. Terapkan Member (optional - untuk diskon)
   ↓
5. Input Uang Diterima
   ↓
6. Checkout
   ↓
7. Cetak/Kirim Struk
```

## Troubleshooting

### "Akses ditolak"
→ Pastikan user memiliki role "kasir", "admin", atau "supervisor"

### "Belum ditugaskan ke cabang"
→ Assign warehouse ke kasir:
```sql
UPDATE users SET warehouse_id = 1 WHERE email = 'kasir01@example.com';
```

### "Harus membuka shift terlebih dahulu"
→ Klik tombol "Buka Shift" di halaman POS

### "Stok tidak mencukupi"
→ Cek stok di Settings > Stockist atau kurangi quantity

## Fitur Utama

### POS Kasir
✅ Transaksi POS dengan scan barcode  
✅ Membership & diskon bertingkat  
✅ Shift management dengan rekonsiliasi cash  
✅ Struk digital via WhatsApp  
✅ Multi-cabang (warehouse-based)  
✅ Stock management real-time  

### Sales Delivery
✅ Presensi GPS (check-in/check-out)  
✅ Laporan kunjungan pelanggan  
✅ Foto bukti pengiriman  
✅ Pencatatan produk terjual/retur  
✅ Offline mode dengan sync  
✅ Fake GPS detection  

### General
✅ Role-based access control  
✅ Multi-user support  
✅ Real-time notifications  

## Dokumentasi Lengkap

Baca dokumentasi berikut untuk panduan detail:

- **USER_GUIDE.md** - Panduan lengkap Kasir & Sales (RECOMMENDED)
- **POS_SETUP_GUIDE.md** - Panduan detail POS Kasir
- **SALES_GUIDE.md** - Panduan detail Sales Delivery

## Support

Ada pertanyaan? Buka issue di repository atau hubungi tim support.

---

**Happy Selling! 🛒💰**
