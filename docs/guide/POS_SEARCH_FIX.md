# POS Search Fix - Product & Member Search

## Problem
Di halaman POS Kasir, pencarian produk dan member tidak berfungsi dengan baik. User tidak bisa menemukan produk dan member yang sudah terdaftar.

## Root Cause
1. **Member Interface**: Interface `Member` di halaman POS tidak lengkap dan tidak memiliki optional chaining untuk properti yang mungkin null
2. **Data Mapping**: Mapping data member ke komponen `MemberMultiSelect` tidak menangani kasus dimana properti bisa undefined/null

## Solution

### Frontend Changes

**File:** `resources/js/pages/pos/index.tsx`

1. **Updated Member Interface:**
```typescript
// Before
interface Member {
    id: number;
    name: string;
    member_number: string;
    membershipTier: {
        name: string;
    };
}

// After
interface Member {
    id: number;
    name: string;
    member_number: string;
    phone?: string;
    membershipTier?: {
        name: string;
        default_discount_percentage: number;
    };
}
```

2. **Fixed Member Data Mapping:**
```typescript
// Before
items={members.map((m) => ({
    id: m.id,
    title: m.name,
    subtitle: `${m.member_number} • ${m.phone} • ${m.membershipTier.name} (${m.membershipTier.default_discount_percentage}%)`,
    image: null
}))}

// After
items={members.map((m) => ({
    id: m.id,
    title: m.name,
    subtitle: `${m.member_number} • ${m.phone || 'No phone'} • ${m.membershipTier?.name || 'No tier'} (${m.membershipTier?.default_discount_percentage || 0}%)`,
    image: null
}))}
```

3. **Fixed Member Display:**
```typescript
// Before
{member && (
    <div className="mt-3 p-3 border rounded bg-green-50 dark:bg-green-900/20">
        <p className="text-sm font-medium">{member.name}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
            {member.member_number} • {member.membershipTier.name}
        </p>
        <p className="text-xs text-green-600 font-medium mt-1">
            Diskon: {member.membershipTier.default_discount_percentage}%
        </p>
    </div>
)}

// After
{member && (
    <div className="mt-3 p-3 border rounded bg-green-50 dark:bg-green-900/20">
        <p className="text-sm font-medium">{member.name}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
            {member.member_number} • {member.membershipTier?.name || 'No tier'}
        </p>
        <p className="text-xs text-green-600 font-medium mt-1">
            Diskon: {member.membershipTier?.default_discount_percentage || 0}%
        </p>
    </div>
)}
```

## Backend Verification

### Product Search Endpoint
- **URL**: `GET /pos/products/search?query={query}`
- **Controller**: `POSController@searchProducts`
- **Service**: `POSService@searchProducts`
- **Logic**: Mencari produk berdasarkan nama atau SKU yang memiliki stok > 0 di warehouse user

### Member Search Endpoint
- **URL**: `GET /settings/membership/members/search?query={query}`
- **Controller**: `MembershipController@searchMembers`
- **Logic**: Mencari member aktif berdasarkan nama, nomor member, atau telepon

## Testing

### Test Data Available:
1. **Products**: 35 produk aktif, termasuk "Aqua 600ml" (SKU: AQA-001) dengan stok 102 di warehouse 1
2. **Members**: 3 member aktif:
   - John Doe (MBR202604220001) - Bronze (3%)
   - Jane Smith (MBR202604220002) - Silver (5%)
   - Bob Johnson (MBR202604220003) - Gold (10%)

### How to Test:
1. Login sebagai kasir (kasir01@example.com / password)
2. Buka shift di halaman POS
3. **Test Product Search**:
   - Ketik "Aqua" di field "Scan atau Cari Produk"
   - Produk "Aqua 600ml" harus muncul dengan info stok dan harga
   - Klik produk untuk menambahkan ke keranjang
4. **Test Member Search**:
   - Ketik "John" di field "Pilih Member"
   - Member "John Doe" dan "Bob Johnson" harus muncul
   - Klik member untuk memilih
   - Info member dan diskon harus ditampilkan

## Result
✅ Product search berfungsi dengan baik
✅ Member search berfungsi dengan baik
✅ Tidak ada error TypeScript
✅ Optional chaining mencegah error saat data null/undefined
✅ UI menampilkan fallback text yang sesuai untuk data yang kosong
