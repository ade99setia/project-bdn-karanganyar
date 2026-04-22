# POS Kasir Troubleshooting Guide

## Problem: Produk dan Member Tidak Ditemukan

### Checklist Debugging

#### 1. Verifikasi Data di Database
```bash
# Check products
php artisan tinker --execute="echo 'Total Products: ' . \App\Models\Product::count();"

# Check members
php artisan tinker --execute="echo 'Total Members: ' . \App\Models\Member::where('is_active', true)->count();"

# Check product stock in warehouse 1
php artisan tinker --execute="echo 'Products with stock: ' . \App\Models\ProductStock::where('warehouse_id', 1)->where('quantity', '>', 0)->count();"
```

#### 2. Verifikasi User Kasir
```bash
php artisan tinker --execute="print_r(\App\Models\User::with('role', 'warehouse')->where('email', 'kasir01@example.com')->first()->toArray());"
```

Pastikan:
- User memiliki `warehouse_id` (tidak null)
- Role adalah "kasir"
- Warehouse aktif

#### 3. Verifikasi Routes
```bash
# Check POS routes
php artisan route:list --name=pos

# Check membership routes
php artisan route:list --name=membership
```

#### 4. Test Endpoints Manually

**Test Product Search:**
```bash
curl -X GET "https://your-domain.test/pos/products/search?query=Aqua" \
  -H "Cookie: your-session-cookie"
```

**Test Member Search:**
```bash
curl -X GET "https://your-domain.test/settings/membership/members/search?query=John" \
  -H "Cookie: your-session-cookie"
```

#### 5. Check Browser Console

Buka Developer Tools (F12) dan lihat:
1. **Console Tab**: Lihat console.log output
   - "Searching products with query: ..."
   - "Products found: ..."
   - Error messages jika ada

2. **Network Tab**: Lihat HTTP requests
   - Status code (200 = success, 403 = forbidden, 500 = server error)
   - Response data
   - Request headers (pastikan ada cookie session)

### Common Issues & Solutions

#### Issue 1: "Warehouse not assigned" Error
**Cause**: User tidak memiliki warehouse_id

**Solution**:
```sql
-- Update user warehouse
UPDATE users SET warehouse_id = 1 WHERE email = 'kasir01@example.com';
```

#### Issue 2: "Unauthorized" atau 403 Error
**Cause**: User tidak memiliki akses POS

**Solution**:
```sql
-- Check user role
SELECT u.name, u.email, r.name as role_name 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'kasir01@example.com';

-- Update role if needed
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'kasir') 
WHERE email = 'kasir01@example.com';
```

#### Issue 3: No Products Found
**Cause**: Tidak ada produk dengan stok di warehouse user

**Solution**:
```bash
# Run product stock seeder
php artisan db:seed --class=POSProductStockSeeder
```

#### Issue 4: No Members Found
**Cause**: Tidak ada member aktif

**Solution**:
```bash
# Run membership seeder
php artisan db:seed --class=MembershipSeeder
```

#### Issue 5: CORS atau CSRF Error
**Cause**: Session atau CSRF token issue

**Solution**:
1. Clear browser cache dan cookies
2. Logout dan login kembali
3. Check `.env` file:
   ```
   SESSION_DRIVER=database
   SESSION_LIFETIME=120
   ```

### Debug Mode

Untuk debugging lebih detail, tambahkan console.log di file:
`resources/js/pages/pos/index.tsx`

```typescript
// Di useEffect search products
console.log('Searching products with query:', productSearchQuery);
console.log('Products found:', response.data);
console.error('Product search error:', err);

// Di useEffect search members
console.log('Searching members with query:', memberSearchQuery);
console.log('Members found:', response.data);
console.error('Member search error:', err);
```

### Testing Flow

1. **Login sebagai kasir**
   - Email: `kasir01@example.com`
   - Password: `password`

2. **Buka halaman POS**
   - URL: `/pos`
   - Pastikan tidak ada error 403

3. **Buka shift**
   - Klik "Buka Shift"
   - Masukkan saldo awal
   - Shift harus terbuka

4. **Test pencarian produk**
   - Ketik "Aqua" di field "Scan atau Cari Produk"
   - Lihat console untuk request/response
   - Produk harus muncul dalam dropdown

5. **Test pencarian member**
   - Ketik "John" di field "Pilih Member"
   - Lihat console untuk request/response
   - Member harus muncul dalam dropdown

6. **Test transaksi**
   - Pilih produk (otomatis masuk ke keranjang)
   - Pilih member (opsional)
   - Masukkan jumlah uang diterima
   - Klik "Checkout"
   - Receipt modal harus muncul

### Contact Support

Jika masalah masih berlanjut, kirimkan informasi berikut:
1. Screenshot error di browser console
2. Screenshot Network tab (request/response)
3. Output dari command verifikasi di atas
4. Laravel log: `storage/logs/laravel.log`
