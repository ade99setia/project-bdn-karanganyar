# Sistem POS Kasir — Dokumentasi

## Overview

Sistem kasir berbasis web untuk transaksi tunai, manajemen shift, diskon membership, struk digital, dan laporan shift. Diakses via `/pos` dengan middleware `auth + verified + posAccess` (role: admin, kasir).

---

## Arsitektur File

**Backend**
- `app/Http/Controllers/POSController.php` — search produk, preview cart, checkout, void, riwayat transaksi
- `app/Http/Controllers/CashierShiftController.php` — buka/tutup shift, laporan shift
- `app/Http/Controllers/ReceiptController.php` — tampil struk (public), kirim WA, cetak
- `app/Services/POSService.php` — logika checkout, stok, void
- `app/Services/ShiftService.php` — buka/tutup shift, hitung expected cash
- `app/Services/ReceiptService.php` — generate nomor transaksi, kirim WA, generate HTML struk
- `app/Services/DiscountService.php` — kalkulasi diskon membership per item
- `app/Models/PosTransaction.php`, `PosTransactionItem.php`, `CashierShift.php`

**Frontend**
- `resources/js/pages/pos/index.tsx` — halaman utama POS (orchestrator)
- `resources/js/hooks/use-pos.ts` — semua state & logic (cart, checkout, member, shift)
- `resources/js/types/pos.ts` — semua TypeScript interfaces
- `resources/js/components/pos/`
  - `ProductSearch.tsx` — kolom 1: search + list produk
  - `CartPanel.tsx` — kolom 2: keranjang + CartItemRow
  - `CartItemDetailModal.tsx` — pop-up detail item, edit qty keyboard-friendly
  - `CheckoutPanel.tsx` — kolom 3: shift, member, summary, pembayaran
  - `ShiftManager.tsx` — buka/tutup shift
  - `ReceiptModal.tsx` — pop-up struk setelah checkout
  - `ShiftHistoryDrawer.tsx` — drawer riwayat transaksi shift (kanan)
  - `ShiftReportDrawer.tsx` — drawer laporan shift (kiri)
  - `PrinterSetupDrawer.tsx` — panduan setup printer thermal (kiri)
  - `MobileTabBar.tsx` — bottom navigation mobile
- `resources/js/pages/receipts/show.tsx` — halaman struk publik (tanpa login)
- `resources/js/pages/receipts/print.tsx` — halaman cetak struk (auto print dialog)
- `resources/js/hooks/use-grayscale-image.ts` — konversi logo ke grayscale untuk struk cetak

---

## Routes

```
GET  /pos                                    → POSController@index
GET  /pos/products/search                    → POSController@searchProducts
POST /pos/cart/preview                       → POSController@previewCart
POST /pos/transactions/checkout              → POSController@checkout
GET  /pos/transactions/list                  → POSController@transactionsJson (JSON, untuk drawer)
POST /pos/transactions/{id}/void             → POSController@void

GET  /pos/shifts/current                     → CashierShiftController@current
POST /pos/shifts/open                        → CashierShiftController@open
POST /pos/shifts/close                       → CashierShiftController@close
GET  /pos/shifts/{shift}/report              → CashierShiftController@report

GET  /pos/receipts/{transactionNumber}       → ReceiptController@show  ← PUBLIC (tanpa login)
POST /pos/receipts/{transactionNumber}/send-whatsapp → ReceiptController@sendWhatsApp
GET  /pos/receipts/{transactionNumber}/print → ReceiptController@print
```

---

## Fitur Lengkap

### Layout & Navigasi
- Desktop: 3 kolom — Produk | Keranjang | Checkout
- Mobile/tablet: 1 panel aktif + bottom tab (Produk / Keranjang / Bayar)
- Top bar: jam live per detik, tombol Riwayat, Laporan, Printer Setup, badge "Tambah Produk"

### Pencarian Produk
- Search real-time by nama/SKU
- Produk stok 0 → disabled (opacity 50%, label "Stok habis")
- HID barcode scanner (USB/Bluetooth) via `useHidScanner`
- Kamera scanner (mobile) via `BarcodeScannerModal`
- Enter → add exact match atau single result

### Keranjang
- Item card dengan thumbnail, nama, harga, badge diskon, qty stepper
- Klik item → `CartItemDetailModal`: edit qty dengan keyboard (↑↓ / ketik / Enter), tombol Hapus
- Diskon dari `cartPreview` (bukan disimpan di cart state — mencegah infinite loop)
- Klik "keranjang kosong" → switch tab Produk + focus input search

### Checkout Panel
- **Shift Manager**: buka/tutup shift, snapshot data shift saat form tutup (mencegah crash null)
- **Member Selector**: search dropdown, close on outside click, badge diskon tier
- **Ringkasan**: subtotal, diskon member, total
- **Pembayaran Tunai**: input nominal, 6 quick cash berdasarkan pecahan standar, kembalian real-time, tombol kurangi nominal
- **Konfirmasi checkout** (mode tambah produk): tanya "Masih ada tambahan?" sebelum proses

### Struk & Receipt
- **ReceiptModal**: tampil setelah checkout, thermal receipt style, info member+tier
- **Auto-send WA**: jika member punya nomor HP → struk otomatis terkirim saat checkout
- **Tombol Selesai**: langsung tutup tanpa konfirmasi → transaksi baru
- **Tombol X / backdrop**: muncul konfirmasi dengan 3 pilihan:
  - Transaksi Baru
  - Tambah Produk (rehydrate cart dari transaksi lama)
  - Batalkan Transaksi (void)
- **Cetak**: 80mm dan 58mm, auto print dialog, logo grayscale via canvas
- **Struk digital** (`/pos/receipts/{no}`): PUBLIC, tanpa login
  - Guest: tombol share WA + share sosmed
  - Login (kasir/admin): tombol cetak 80mm/58mm

### Warehouse & Struk Kustomisasi
- Field warehouse: `name`, `address`, `phone`, `receipt_header`, `receipt_footer`, `file_path` (logo)
- Logo di struk cetak dikonversi grayscale otomatis
- Footer struk custom per warehouse (bukan hardcoded)

### Riwayat & Laporan Shift
- **ShiftHistoryDrawer** (kanan): daftar transaksi shift aktif, search, void per transaksi, buka struk
- **ShiftReportDrawer** (kiri): summary card (transaksi, item, pendapatan, kas masuk), rekonsiliasi kas (saldo awal → expected → aktual → selisih)
- **Laporan shift** endpoint: `GET /pos/shifts/{shift}/report`

### Void Transaksi
- Bisa dari ShiftHistoryDrawer atau dari ReceiptModal (konfirmasi)
- Stok dikembalikan, status jadi `voided`
- Tidak bisa void jika shift sudah ditutup

### Printer Setup Guide
- **PrinterSetupDrawer** (kiri): panduan setup per OS (Windows/Linux/macOS)
- Accordion per langkah: install driver, set paper size 80mm/58mm, setting browser

---

## Database

```
warehouses          — id, name, code, is_active, file_path, address, phone, receipt_header, receipt_footer
cashier_shifts      — id, warehouse_id, cashier_id, opened_at, closed_at, opening_balance, closing_balance, expected_cash, actual_cash, difference, status
pos_transactions    — id, transaction_number, warehouse_id, cashier_id, member_id, shift_id, subtotal, total_discount, grand_total, payment_method, cash_received, cash_change, status
pos_transaction_items — id, pos_transaction_id, product_id, quantity, unit_price, discount_percentage, discount_amount, subtotal
members             — id, user_id, membership_tier_id, member_number, name, phone, email, is_active
membership_tiers    — id, name, description, default_discount_percentage, applies_to_all_products
```

---

## Konfigurasi .env

```env
PUBLIC_APP_URL=https://domain-kamu.com   # URL yang dikirim ke customer via WA
EVOLUTION_API_BASE_URL=https://...
EVOLUTION_API_INSTANCE_NAME=nama-instance
EVOLUTION_API_KEY=api-key
```
