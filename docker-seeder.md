# 🔧 Operasi Data via Tinker (Linux / Server Friendly)

Untuk mengelola data langsung dari **server Linux atau environment Docker tanpa GUI** (seperti phpMyAdmin), gunakan **Laravel Tinker**.

Tinker adalah terminal interaktif Laravel yang memungkinkan kamu menjalankan **perintah PHP dan query database secara langsung**.

---

# 📌 A. Mengapa Menggunakan Tinker?

### 1. Server Tanpa GUI (Headless)
Pada server Linux biasanya tidak tersedia browser atau GUI database seperti phpMyAdmin.  
Karena itu **terminal menjadi satu-satunya cara mengelola data**.

### 2. Keamanan Password
Tinker memungkinkan kamu menggunakan helper Laravel seperti:

```
Hash::make()
```

sehingga password otomatis **terenkripsi sesuai standar Laravel**.

### 3. Efisiensi Development
Untuk perubahan kecil pada data, kamu tidak perlu membuat:

- Migration
- Seeder
- Script tambahan

Cukup jalankan query langsung melalui Tinker.

---

# 🚀 B. Mengakses Laravel Tinker

Jalankan perintah berikut dari direktori project:

```bash
docker compose exec project-bdn-karanganyar php artisan tinker
```

Jika berhasil, akan muncul prompt seperti ini:

```
Psy Shell v0.x.x (PHP x.x.x — cli)
>>>
```

Artinya kamu sudah berada di **environment Laravel interaktif**.

---

# 🧩 C. Operasi Data Dasar

## 1. Menambahkan Data Role

Tabel **roles** harus memiliki data terlebih dahulu agar tidak terjadi error:

```
Foreign Key Constraint Violation
```

Contoh menambahkan role admin:

```php
DB::table('roles')->insert([
    'id' => 1,
    'name' => 'supervisor',
    'description' => 'Supervisor',
    'rank' => 999,
    'created_at' => now(),
    'updated_at' => now()
]);
```

---

## 2. Menambahkan User (Password Aman)

Laravel **tidak menerima password plain text**.  
Gunakan `Hash::make()` agar password terenkripsi.

```php
DB::table('users')->insert([
    'id' => 1,
    'name' => 'Anik Widi Astuti',
    'email' => 'ade99setia@gmail.com',
    'password' => Hash::make('password_rahasia_kamu'),
    'role_id' => 1,
    'created_at' => now(),
    'updated_at' => now()
]);
```

---

## 3. Menambahkan Data Employees

Setelah user dibuat, kamu bisa menambahkan detail karyawan.

```php
DB::table('employees')->insert([
    'id' => 1,
    'user_id' => 1,
    'position' => 'Staff',
    'status' => 'active',
    'join_date' => '2026-02-18',
    'created_at' => now(),
    'updated_at' => now()
]);
```

---

# 🛠️ D. Operasi Maintenance & Troubleshooting

## Mengganti Password User

Jika user tidak bisa login karena password salah atau lupa, jalankan:

```php
DB::table('users')->where('id', 1)->update([
    'password' => Hash::make('password_baru_yang_aman')
]);
```

Password akan langsung diperbarui dan terenkripsi.

---

# 🚪 E. Keluar dari Tinker

Setelah selesai melakukan operasi database, keluar dengan:

```bash
exit
```

---

# 💡 Tips & Pengingat Penting

### Gunakan `now()` untuk Timestamp

Selalu isi kolom berikut menggunakan helper Laravel:

```
created_at
updated_at
```

Contoh:

```php
'created_at' => now(),
'updated_at' => now()
```

Laravel akan otomatis mengambil waktu server saat ini.

---

### Jangan Simpan Password Plain Text

Contoh yang **SALAH**:

```php
'password' => '123456'
```

Contoh yang **BENAR**:

```php
'password' => Hash::make('123456')
```

Jika password tidak di-hash, sistem **Auth Laravel akan gagal login**.

---

### Pastikan Migration Sudah Dijalankan

Sebelum menambahkan data, pastikan tabel database sudah dibuat:

```bash
docker compose exec project-bdn-karanganyar php artisan migrate
```

Jika tabel belum ada, operasi insert akan gagal.

---

# 📚 Ringkasan Alur Cepat

1. Masuk ke Tinker

```bash
docker compose exec project-bdn-karanganyar php artisan tinker
```

2. Tambahkan role

3. Tambahkan user dengan `Hash::make()`

4. Tambahkan data tambahan seperti employees

5. Keluar dari Tinker

```
exit
```