# Changelog — 22 April 2026

## POS Kasir — Update Hari Ini

---

### 1. Redesign UI POS Kasir (3-Kolom Responsif)

**File:** `resources/js/pages/pos/index.tsx`

Layout baru:
- **Desktop** (`md+`): 3 kolom side-by-side — Produk | Keranjang | Checkout
- **Mobile/Tablet** (`< md`): 1 panel aktif + bottom tab navigation (Produk / Keranjang / Bayar)
- Setelah pilih produk di mobile, otomatis pindah ke tab Keranjang

---

### 2. Kolom 1 — Pencarian Produk

- Search bar native (bukan multi-select) — lebih cepat dan responsif
- Produk langsung tampil sebagai list scrollable di kolom kiri
- Warna stok: hijau (>10), kuning (1-10), merah (0)
- Klik produk → langsung masuk keranjang, input refocus otomatis

---

### 3. Kolom 2 — Keranjang

- Cart item layout responsif:
  - **Desktop**: 1 baris compact (no + thumbnail + nama + qty pill + subtotal + hapus)
  - **Mobile**: 2 baris (baris atas: info produk, baris bawah: qty + subtotal)
- Thumbnail produk bisa diklik untuk preview fullscreen (`ImagePreviewModal`)
- Qty controls desktop: pill-style `[−] n [+]` terintegrasi, lebih premium
- Discount info diambil dari `cartPreview` (bukan disimpan di cart state) — fix infinite loop

---

### 4. Kolom 3 — Checkout Panel

**Shift Manager:**
- Toggle hide/show info shift via tombol Eye/EyeOff
- Saat disembunyikan: dot indicator + teks status + link "Tampilkan"
- Saat ditampilkan: header "Info Shift" + tombol "Sembunyikan"
- Default: tersembunyi (aman untuk monitor menghadap pelanggan)

**Member Selector:**
- Search member dengan dropdown
- Saat terpilih: card hijau dengan nama, nomor member, tier, dan badge diskon

**Ringkasan Harga:**
- Subtotal, diskon member, total

**Pembayaran Tunai:**
- Input nominal dengan tombol clear
- **Quick cash 6 pilihan** berdasarkan pecahan uang standar (1rb, 2rb, 5rb, 10rb, 20rb, 50rb, 100rb, 200rb, 500rb, 1jt) — diurutkan dari yang paling dekat ke total
- Format label: `3jt50rb`, `100rb`, `50rb`, dll
- **Kembalian real-time** dengan warna hijau/merah
- **Tombol kurangi nominal** di bawah kembalian — untuk menyesuaikan uang tunai

---

### 5. Live Clock Per Detik

- Jam di top bar update setiap detik via `setInterval`
- Format: `HH:MM:SS` dengan `tabular-nums`
- Tanggal lengkap tampil di desktop, jam saja di mobile

---

### 6. Barcode Scanner — HID + Kamera

**HID Scanner (USB/Bluetooth):**
- Hook `useHidScanner` (`resources/js/hooks/use-hid-scanner.ts`)
- Deteksi input scanner eksternal berdasarkan kecepatan ketik (<50ms antar karakter)
- Diakhiri Enter → langsung cari produk berdasarkan SKU
- Diabaikan saat focus ada di input field
- Aktif di POS dan Visit Input Modal

**Kamera Scanner:**
- Tombol `ScanLine` di search bar — **hanya tampil di mobile/tablet** (`md:hidden`)
- Membuka `BarcodeScannerModal` dengan mode web (kamera) atau Capacitor native
- Support format: CODE_128, EAN_13, EAN_8, UPC_A, UPC_E, CODE_39, QR_CODE
- **Fix bug kedip-kedip**: semua props (`onDetected`, `barcodeFormats`, `notFoundMessage`, dll) disimpan ke `useRef` agar tidak masuk dependency array `useEffect` scanner
- Scanner terus mencoba sampai 30 detik, tidak tutup saat produk tidak ditemukan

---

### 7. Fix Bug Infinite Loop Cart Preview

**Root cause:** `setCart` dipanggil di dalam `useEffect([cart, member])` → cart berubah → effect jalan lagi → loop.

**Fix:** Discount info (`discount_percentage`, `discount_amount`, `subtotal`) tidak lagi disimpan ke cart state. Diambil langsung dari `cartPreview.items[idx]` saat render.

---

### 8. Fix Stock Display — Stockist Management

**Root cause:** `stocks` data paginated (10 item/halaman), stock adjustment form mencari stok dari data yang mungkin tidak ada di halaman aktif.

**Fix:** Tambah `allStocks` prop (unpaginated) khusus untuk form penyesuaian stok. Paginated `stocks` tetap dipakai untuk tabel display.

**File:** `app/Http/Controllers/Settings/StockistManagementController.php`

---

### 9. Fix Backend — `$request->query` vs `$request->input()`

**Bug:** `$request->query` mengembalikan `InputBag` (seluruh query string), bukan nilai parameter.

**Fix:** Ganti ke `$request->input('query', '')` di:
- `POSController@searchProducts`
- `MembershipController@searchMembers`

---

### 10. Cleanup

- Hapus debug logging dari `StockistManagementController@adjustStock`
- Hapus route `/debug/stocks` dari `routes/web.php`
- Hapus file dokumentasi sementara (`STOCK_DISPLAY_FIX.md`, `POS_SEARCH_FIX.md`, `POS_TROUBLESHOOTING.md`, `POS_QUICK_START.md`, `SALES_GUIDE.md`, `POS_SETUP_GUIDE.md`, `USER_GUIDE.md`, `STOCK_DISPLAY_FIX.md`)

---

## Next Session — Rencana Besok

### Struk / Receipt

1. **Desain struk** — header (nama toko, alamat, no. telp), rincian item, subtotal, diskon, total, pembayaran, kembalian, footer (terima kasih, dll)
2. **Membership di struk** — jika ada member yang belanja, tampilkan nama + tier + poin/diskon yang didapat
3. **Pop-up setelah checkout** — tanya kasir: "Cetak struk?" atau "Tidak perlu (member sudah ada riwayat di website)"
4. **Print support** — USB/network printer (desktop) dan Bluetooth printer (mobile/tablet)
5. **Digital receipt** — link ke website untuk member melihat riwayat transaksi

### Fitur Lanjutan POS

- Riwayat transaksi per shift
- Laporan shift (total penjualan, jumlah transaksi, selisih kas)
- Void transaksi (sebelum shift ditutup)
