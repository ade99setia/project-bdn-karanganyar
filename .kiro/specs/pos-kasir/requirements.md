# Requirements: POS Kasir (Point of Sale)

## 1. Ringkasan Fitur

Sistem Point of Sale (POS) Kasir terintegrasi untuk toko fisik, warung, minimarket, dan supermarket. Sistem ini akan digabungkan dengan aplikasi sales delivery yang sudah ada, memberikan nilai tambah berupa integrasi stok real-time, membership dengan diskon fleksibel, dan struk digital via WhatsApp.

**Target Pengguna:**
- Kasir toko fisik/warung/minimarket/supermarket
- Admin untuk konfigurasi membership dan diskon
- Member/pelanggan untuk melihat riwayat belanja
- Pemilik toko yang memiliki beberapa cabang

**Platform:**
- Website (PC/laptop dengan keyboard/mouse)
- Mobile/tablet (via browser + Capacitor untuk scan barcode)

**Catatan Multi-Cabang:**
Sistem ini mendukung pemilik toko yang memiliki beberapa cabang. Setiap cabang memiliki stok produk independen (menggunakan warehouse yang sudah ada di sistem). Kasir hanya dapat melakukan transaksi untuk cabang tempat mereka ditugaskan.

## 2. User Stories & Acceptance Criteria

### US-1: Transaksi POS - Scan & Tambah Produk ke Keranjang
**Sebagai** kasir  
**Saya ingin** scan barcode produk atau cari produk manual  
**Sehingga** saya bisa menambahkan produk ke keranjang belanja dengan cepat

**Acceptance Criteria:**
- AC-1.1: Kasir dapat scan barcode menggunakan Capacitor barcode scanner (mobile/tablet) atau input manual barcode (PC)
- AC-1.2: Kasir dapat mencari produk dengan nama/kode produk via search box
- AC-1.3: Setelah produk ditemukan, sistem menampilkan nama, harga, stok tersedia
- AC-1.4: Kasir dapat mengatur quantity produk sebelum menambahkan ke keranjang
- AC-1.5: Jika stok tidak mencukupi, sistem menampilkan warning dan membatasi quantity maksimal sesuai stok
- AC-1.6: Produk yang ditambahkan muncul di keranjang dengan detail: nama, quantity, harga satuan, subtotal

### US-2: Transaksi POS - Kelola Keranjang Belanja
**Sebagai** kasir  
**Saya ingin** mengelola item di keranjang (ubah quantity, hapus item)  
**Sehingga** saya bisa memperbaiki kesalahan input sebelum checkout

**Acceptance Criteria:**
- AC-2.1: Kasir dapat mengubah quantity item di keranjang
- AC-2.2: Kasir dapat menghapus item dari keranjang
- AC-2.3: Sistem menghitung ulang subtotal dan total otomatis setiap ada perubahan
- AC-2.4: Kasir dapat mengosongkan seluruh keranjang dengan satu tombol "Clear Cart"

### US-3: Transaksi POS - Terapkan Membership & Diskon
**Sebagai** kasir  
**Saya ingin** menerapkan membership pelanggan saat checkout  
**Sehingga** pelanggan mendapat diskon sesuai aturan membership

**Acceptance Criteria:**
- AC-3.1: Kasir dapat input nomor member atau scan kartu member
- AC-3.2: Sistem menampilkan info member: nama, tier membership, diskon yang berlaku
- AC-3.3: Sistem otomatis menghitung diskon untuk produk yang eligible
- AC-3.4: Jika ada multi-diskon untuk produk tertentu, sistem menerapkan diskon terbesar
- AC-3.5: Kasir dapat melihat breakdown: subtotal, diskon per item, total diskon, grand total
- AC-3.6: Kasir dapat membatalkan membership yang sudah diterapkan (transaksi non-member)

### US-4: Transaksi POS - Checkout & Pembayaran Cash
**Sebagai** kasir  
**Saya ingin** proses checkout dengan pembayaran cash  
**Sehingga** transaksi dapat diselesaikan dan struk dicetak

**Acceptance Criteria:**
- AC-4.1: Kasir dapat klik tombol "Checkout" setelah keranjang siap
- AC-4.2: Sistem menampilkan total yang harus dibayar
- AC-4.3: Kasir input jumlah uang yang diterima dari pelanggan
- AC-4.4: Sistem menghitung dan menampilkan kembalian
- AC-4.5: Setelah konfirmasi, sistem menyimpan transaksi ke database
- AC-4.6: Sistem mengurangi stok produk secara otomatis (update ProductStock, StockMovement)
- AC-4.7: Sistem menampilkan opsi: cetak struk, kirim struk via WA, atau keduanya

### US-5: Struk Digital - Cetak & Kirim via WhatsApp
**Sebagai** kasir  
**Saya ingin** cetak struk fisik dan/atau kirim struk digital via WhatsApp  
**Sehingga** pelanggan mendapat bukti transaksi

**Acceptance Criteria:**
- AC-5.1: Kasir dapat cetak struk ke printer Bluetooth (mobile/tablet) atau printer USB/network (PC)
- AC-5.2: Kasir dapat input nomor WhatsApp pelanggan untuk kirim struk digital
- AC-5.3: Sistem mengirim pesan WA berisi ringkasan transaksi + link ke halaman struk detail
- AC-5.4: Pesan WA menggunakan template yang sudah ditentukan (format rapi, mudah dibaca)
- AC-5.5: Link struk mengarah ke halaman website yang menampilkan detail transaksi lengkap
- AC-5.6: Struk digital tersimpan di database dan dapat diakses kapan saja via link

### US-6: Struk Digital - Lihat Riwayat Transaksi (Member)
**Sebagai** member/pelanggan  
**Saya ingin** melihat riwayat transaksi saya di website  
**Sehingga** saya dapat mengecek detail belanja tanpa struk fisik

**Acceptance Criteria:**
- AC-6.1: Member harus login terlebih dahulu untuk akses halaman riwayat transaksi
- AC-6.2: Sistem menampilkan daftar transaksi member: tanggal, nomor transaksi, total, status
- AC-6.3: Member dapat klik transaksi untuk melihat detail lengkap (item, quantity, harga, diskon)
- AC-6.4: Member dapat akses struk via link yang dikirim via WA (setelah login)
- AC-6.5: Jika member belum login saat klik link WA, sistem redirect ke halaman login, lalu ke struk setelah login berhasil

### US-7: Membership Management - Buat & Kelola Tier Membership
**Sebagai** admin  
**Saya ingin** membuat dan mengelola tier membership  
**Sehingga** saya dapat memberikan benefit berbeda untuk member

**Acceptance Criteria:**
- AC-7.1: Admin dapat membuat tier membership baru (nama tier, deskripsi)
- AC-7.2: Admin dapat mengatur diskon default untuk tier (persentase, misal 3%)
- AC-7.3: Admin dapat menentukan apakah diskon berlaku untuk semua produk atau produk tertentu
- AC-7.4: Admin dapat edit dan hapus tier membership
- AC-7.5: Sistem menampilkan daftar tier membership yang aktif

### US-8: Membership Management - Atur Diskon Produk Spesifik
**Sebagai** admin  
**Saya ingin** mengatur diskon khusus untuk produk tertentu per tier membership  
**Sehingga** saya dapat membuat promo fleksibel (multi-diskon)

**Acceptance Criteria:**
- AC-8.1: Admin dapat pilih tier membership dan produk tertentu
- AC-8.2: Admin dapat set diskon persentase khusus untuk produk tersebut (override diskon default tier)
- AC-8.3: Admin dapat menambahkan multiple aturan diskon untuk berbagai produk
- AC-8.4: Sistem menampilkan daftar aturan diskon aktif (tier, produk, persentase)
- AC-8.5: Admin dapat edit dan hapus aturan diskon spesifik

### US-9: Membership Management - Kelola Data Member
**Sebagai** admin  
**Saya ingin** mengelola data member (tambah, edit, hapus)  
**Sehingga** sistem membership dapat berjalan dengan baik

**Acceptance Criteria:**
- AC-9.1: Admin dapat menambahkan member baru (nama, nomor member, nomor WA, tier membership)
- AC-9.2: Admin dapat edit data member (ubah tier, update kontak)
- AC-9.3: Admin dapat menonaktifkan/menghapus member
- AC-9.4: Sistem generate nomor member unik otomatis (atau admin input manual)
- AC-9.5: Admin dapat search member berdasarkan nama/nomor member/nomor WA

### US-10: Laporan Penjualan - Dashboard Kasir
**Sebagai** supervisor/admin  
**Saya ingin** melihat laporan penjualan kasir  
**Sehingga** saya dapat memantau performa dan omzet toko

**Acceptance Criteria:**
- AC-10.1: Supervisor/admin dapat melihat total transaksi hari ini (jumlah transaksi, total omzet)
- AC-10.2: Sistem menampilkan breakdown: transaksi member vs non-member
- AC-10.3: Sistem menampilkan total diskon yang diberikan
- AC-10.4: Supervisor/admin dapat filter laporan berdasarkan tanggal, kasir, shift
- AC-10.5: Sistem menampilkan produk terlaris (top selling products)

### US-11: Manajemen Shift Kasir
**Sebagai** kasir  
**Saya ingin** buka dan tutup shift kasir  
**Sehingga** transaksi tercatat per shift dan memudahkan rekonsiliasi

**Acceptance Criteria:**
- AC-11.1: Kasir dapat buka shift dengan input modal awal (uang di laci kasir)
- AC-11.2: Sistem mencatat waktu buka shift dan kasir yang bertugas
- AC-11.3: Kasir hanya dapat melakukan transaksi jika shift sudah dibuka
- AC-11.4: Kasir dapat tutup shift dengan input total uang di laci kasir
- AC-11.5: Sistem menampilkan ringkasan shift: total transaksi, total omzet, selisih (expected vs actual cash)
- AC-11.6: Sistem menyimpan log shift untuk audit

### US-12: Role & Permission - Kasir
**Sebagai** admin  
**Saya ingin** menambahkan role "kasir" ke sistem auth yang sudah ada  
**Sehingga** kasir hanya dapat akses fitur POS, tidak bisa akses fitur sales delivery

**Acceptance Criteria:**
- AC-12.1: Admin dapat assign role "kasir" ke user
- AC-12.2: Admin dapat assign kasir ke cabang/warehouse tertentu
- AC-12.3: User dengan role "kasir" hanya dapat akses halaman POS dan riwayat transaksi kasir untuk cabang mereka
- AC-12.4: User dengan role "kasir" tidak dapat akses fitur sales delivery, supervisor monitoring, atau settings admin
- AC-12.5: User dengan role "admin" atau "supervisor" dapat akses semua fitur termasuk POS semua cabang

### US-13: Multi-Cabang - Transaksi Per Cabang
**Sebagai** kasir  
**Saya ingin** melakukan transaksi hanya untuk cabang tempat saya ditugaskan  
**Sehingga** stok dan laporan penjualan tercatat per cabang dengan benar

**Acceptance Criteria:**
- AC-13.1: Kasir hanya dapat melihat dan menjual produk dari warehouse/cabang mereka
- AC-13.2: Stok yang ditampilkan adalah stok cabang kasir, bukan stok total semua cabang
- AC-13.3: Transaksi POS tercatat dengan informasi cabang/warehouse
- AC-13.4: Kasir tidak dapat melihat transaksi cabang lain

### US-14: Multi-Cabang - Laporan Per Cabang
**Sebagai** supervisor/admin  
**Saya ingin** melihat laporan penjualan per cabang  
**Sehingga** saya dapat membandingkan performa antar cabang

**Acceptance Criteria:**
- AC-14.1: Supervisor/admin dapat filter laporan berdasarkan cabang
- AC-14.2: Sistem menampilkan total transaksi dan omzet per cabang
- AC-14.3: Sistem menampilkan perbandingan performa antar cabang (chart/grafik)
- AC-14.4: Admin dapat melihat laporan konsolidasi (semua cabang)
- AC-14.5: Supervisor cabang hanya dapat melihat laporan cabang mereka sendiri

## 3. Functional Requirements

### FR-1: Integrasi dengan Sistem yang Ada
- FR-1.1: Sistem POS menggunakan model Product, ProductStock, StockMovement yang sudah ada
- FR-1.2: Sistem POS menggunakan model Warehouse yang sudah ada untuk represent cabang toko
- FR-1.3: Setiap transaksi POS otomatis membuat record StockMovement dengan type "pos_sale" dan warehouse_id
- FR-1.4: Stok produk berkurang real-time saat transaksi selesai (per warehouse/cabang)
- FR-1.5: Sistem POS menggunakan WhatsApp Integration (Evolution API) yang sudah ada untuk kirim struk
- FR-1.6: Sistem POS menggunakan Auth & Role Management yang sudah ada, dengan penambahan role "kasir"

### FR-2: Database Schema Baru
- FR-2.1: Tabel `membership_tiers` untuk menyimpan tier membership (id, name, description, default_discount_percentage, applies_to_all_products)
- FR-2.2: Tabel `membership_tier_product_discounts` untuk diskon produk spesifik (id, membership_tier_id, product_id, discount_percentage)
- FR-2.3: Tabel `members` untuk data member (id, user_id nullable, membership_tier_id, member_number, name, phone, email nullable, is_active, created_at, updated_at)
- FR-2.4: Tabel `pos_transactions` untuk transaksi POS (id, transaction_number, warehouse_id, cashier_id, member_id nullable, shift_id nullable, subtotal, total_discount, grand_total, payment_method, cash_received, cash_change, status, created_at, updated_at)
- FR-2.5: Tabel `pos_transaction_items` untuk item transaksi (id, pos_transaction_id, product_id, quantity, unit_price, discount_percentage, discount_amount, subtotal, created_at, updated_at)
- FR-2.6: Tabel `cashier_shifts` untuk shift kasir (id, warehouse_id, cashier_id, opened_at, closed_at nullable, opening_balance, closing_balance nullable, expected_cash, actual_cash nullable, difference nullable, status)
- FR-2.7: Tambah kolom `warehouse_id` pada tabel `users` (nullable) untuk assign kasir ke cabang tertentu

### FR-3: Business Logic - Diskon Membership
- FR-3.1: Sistem menghitung diskon berdasarkan tier membership member
- FR-3.2: Jika tier membership memiliki `applies_to_all_products = true`, diskon default berlaku untuk semua produk
- FR-3.3: Jika ada diskon produk spesifik di `membership_tier_product_discounts`, diskon tersebut override diskon default
- FR-3.4: Jika tidak ada diskon produk spesifik dan `applies_to_all_products = false`, produk tidak mendapat diskon
- FR-3.5: Diskon dihitung per item: `discount_amount = unit_price * quantity * (discount_percentage / 100)`

### FR-4: Business Logic - Struk Digital
- FR-4.1: Setiap transaksi generate unique transaction_number (format: POS-YYYYMMDD-XXXX)
- FR-4.2: Struk digital dapat diakses via URL: `/pos/receipts/{transaction_number}`
- FR-4.3: Akses struk digital memerlukan autentikasi (login)
- FR-4.4: Member hanya dapat melihat struk transaksi mereka sendiri
- FR-4.5: Admin/supervisor dapat melihat semua struk transaksi
- FR-4.6: Template WhatsApp berisi: nama toko, nomor transaksi, tanggal, total, link struk

### FR-5: Business Logic - Shift Kasir
- FR-5.1: Kasir harus buka shift sebelum dapat melakukan transaksi
- FR-5.2: Satu kasir hanya dapat memiliki satu shift aktif (status "open") per warehouse
- FR-5.3: Shift kasir terikat dengan warehouse/cabang tertentu
- FR-5.4: Saat tutup shift, sistem menghitung expected_cash = opening_balance + total_cash_transactions (untuk warehouse tersebut)
- FR-5.5: Selisih (difference) = actual_cash - expected_cash
- FR-5.6: Shift dengan selisih > threshold (misal Rp 10.000) perlu approval supervisor

### FR-7: Business Logic - Multi-Cabang
- FR-7.1: Kasir dengan warehouse_id tertentu hanya dapat akses produk dan transaksi warehouse tersebut
- FR-7.2: Stok yang ditampilkan di POS adalah stok warehouse kasir (dari tabel ProductStock where warehouse_id = kasir.warehouse_id)
- FR-7.3: Transaksi POS menyimpan warehouse_id untuk tracking per cabang
- FR-7.4: Laporan penjualan dapat difilter berdasarkan warehouse_id
- FR-7.5: Admin dapat melihat laporan konsolidasi (semua warehouse), supervisor cabang hanya melihat warehouse mereka

### FR-6: Printer Integration
- FR-6.1: Sistem support print struk via browser print API (untuk PC)
- FR-6.2: Sistem support Bluetooth printer via Capacitor plugin (untuk mobile/tablet)
- FR-6.3: Format struk: header toko, nomor transaksi, tanggal/waktu, kasir, member (jika ada), list item, subtotal, diskon, grand total, payment, kembalian, footer (terima kasih)

## 4. Non-Functional Requirements

### NFR-1: Performance
- NFR-1.1: Scan barcode dan tambah produk ke keranjang < 1 detik
- NFR-1.2: Proses checkout dan simpan transaksi < 2 detik
- NFR-1.3: Kirim struk via WhatsApp < 5 detik

### NFR-2: Usability
- NFR-2.1: UI POS kasir harus sederhana dan mudah digunakan (kasir tidak perlu training lama)
- NFR-2.2: Tombol-tombol utama (scan, checkout, clear cart) harus besar dan mudah diklik
- NFR-2.3: Keyboard shortcuts untuk PC (Enter = checkout, Esc = clear cart, F1 = scan barcode)

### NFR-3: Security
- NFR-3.1: Akses halaman POS hanya untuk user dengan role "kasir", "admin", atau "supervisor"
- NFR-3.2: Struk digital hanya dapat diakses oleh member yang bersangkutan atau admin/supervisor
- NFR-3.3: Setiap transaksi dicatat dengan audit trail (kasir, waktu, IP address)

### NFR-4: Reliability
- NFR-4.1: Sistem POS harus dapat berjalan offline (menggunakan Sync Center yang sudah ada)
- NFR-4.2: Transaksi offline akan di-sync saat koneksi kembali
- NFR-4.3: Stok produk harus akurat (tidak boleh overselling)

### NFR-5: Scalability
- NFR-5.1: Sistem harus dapat handle multiple kasir bersamaan (multi-shift)
- NFR-5.2: Database harus dapat menyimpan transaksi dalam jumlah besar (estimasi 1000+ transaksi/hari)

## 5. Constraints & Assumptions

### Constraints
- C-1: Payment method hanya cash untuk fase pertama (payment gateway di fase berikutnya)
- C-2: Printer Bluetooth hanya support di mobile/tablet via Capacitor
- C-3: WhatsApp Integration menggunakan Evolution API yang sudah ada (tidak ada perubahan pada service)

### Assumptions
- A-1: Kasir sudah familiar dengan scan barcode dan operasi kasir dasar
- A-2: Toko sudah memiliki printer struk (Bluetooth atau USB/network)
- A-3: Member sudah terdaftar di sistem sebelum transaksi (tidak ada registrasi member on-the-fly saat checkout)
- A-4: Produk sudah memiliki barcode dan terdaftar di sistem

## 6. Out of Scope (Fase Berikutnya)

- Payment gateway (QRIS, transfer, e-wallet)
- Registrasi member self-service
- Loyalty points system
- Promo bundle/paket produk
- Integrasi dengan sistem akuntansi eksternal
- Multi-currency support
- Refund/return management (untuk sekarang hanya void transaction sebelum selesai)

## 7. Success Metrics

- SM-1: Kasir dapat menyelesaikan transaksi dalam < 2 menit (dari scan pertama hingga struk dicetak)
- SM-2: 80% member menggunakan struk digital (mengurangi struk fisik)
- SM-3: Akurasi stok 99% (tidak ada selisih stok signifikan antara sistem dan fisik)
- SM-4: Sistem dapat handle 100+ transaksi/hari tanpa downtime

## 8. Dependencies

- D-1: Model Product, ProductStock, StockMovement (sudah ada)
- D-2: WhatsApp Integration via Evolution API (sudah ada)
- D-3: Auth & Role Management (sudah ada, perlu tambah role "kasir")
- D-4: Sync Center / Offline-first support (sudah ada)
- D-5: Capacitor barcode scanning plugin (sudah ada)

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Printer Bluetooth tidak kompatibel dengan semua device | High | Medium | Sediakan fallback: print via browser atau kirim struk digital saja |
| Stok tidak sinkron saat multiple kasir transaksi bersamaan | High | Low | Implementasi database locking atau queue untuk update stok |
| Member lupa nomor member saat checkout | Medium | High | Sediakan search member by phone number atau nama |
| Kasir lupa tutup shift | Medium | Medium | Auto-close shift setelah X jam atau reminder notification |
| Offline mode menyebabkan duplikasi transaksi | High | Low | Implementasi idempotency key untuk setiap transaksi |

## 10. Correctness Properties (untuk Property-Based Testing)

### P-1: Stok Consistency
**Property:** Setelah transaksi POS selesai, stok produk di database harus berkurang sesuai quantity yang terjual.
- **Invariant:** `stock_after = stock_before - quantity_sold`
- **Test:** Generate random transaksi dengan berbagai quantity, verify stok berkurang dengan benar

### P-2: Diskon Calculation
**Property:** Total diskon yang dihitung sistem harus sesuai dengan aturan membership tier.
- **Invariant:** `discount_amount = sum(item.unit_price * item.quantity * item.discount_percentage / 100)`
- **Test:** Generate random keranjang dengan berbagai produk dan tier membership, verify total diskon

### P-3: Cash Balance
**Property:** Kembalian yang dihitung sistem harus akurat.
- **Invariant:** `cash_change = cash_received - grand_total` (jika `cash_received >= grand_total`)
- **Test:** Generate random transaksi dengan berbagai nominal cash_received, verify kembalian

### P-4: Shift Balance
**Property:** Expected cash di akhir shift harus sama dengan opening balance + total cash transactions.
- **Invariant:** `expected_cash = opening_balance + sum(cash_transactions.grand_total)`
- **Test:** Generate random shift dengan multiple transaksi, verify expected_cash calculation

### P-5: Transaction Idempotency
**Property:** Transaksi dengan idempotency key yang sama tidak boleh tersimpan lebih dari satu kali.
- **Invariant:** `count(transactions where idempotency_key = X) <= 1`
- **Test:** Simulate duplicate transaction requests (offline sync scenario), verify no duplicates

### P-6: Member-Only Receipt Access
**Property:** Member hanya dapat akses struk transaksi mereka sendiri.
- **Invariant:** `member.id == transaction.member_id OR user.role IN ['admin', 'supervisor']`
- **Test:** Generate random member dan transaksi, verify access control

### P-7: Discount Priority
**Property:** Jika ada diskon produk spesifik, diskon tersebut harus override diskon default tier.
- **Invariant:** `applied_discount = specific_discount ?? default_tier_discount ?? 0`
- **Test:** Generate random produk dengan berbagai kombinasi diskon, verify correct discount applied

### P-8: No Overselling
**Property:** Sistem tidak boleh mengizinkan transaksi jika quantity melebihi stok tersedia.
- **Invariant:** `quantity_sold <= stock_available`
- **Test:** Generate random transaksi dengan quantity > stock, verify transaction rejected

### P-9: Warehouse Isolation
**Property:** Kasir hanya dapat melakukan transaksi untuk produk di warehouse mereka.
- **Invariant:** `transaction.warehouse_id == cashier.warehouse_id`
- **Test:** Generate random kasir dengan warehouse berbeda, verify mereka tidak dapat akses produk warehouse lain

### P-10: Stock Per Warehouse
**Property:** Stok yang berkurang harus sesuai dengan warehouse transaksi.
- **Invariant:** `stock_movement.warehouse_id == transaction.warehouse_id`
- **Test:** Generate random transaksi di berbagai warehouse, verify stock movement tercatat di warehouse yang benar

---

**Document Version:** 1.1  
**Last Updated:** 2026-04-22  
**Status:** Draft  
**Changelog:**
- v1.1: Tambah support multi-cabang (warehouse-based branch management)
- v1.0: Initial draft
