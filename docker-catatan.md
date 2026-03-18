# 🐳 CHEATSHEET LENGKAP: DOCKER & LARAVEL (WSL2 / LINUX)
Panduan terstruktur untuk menjalankan project Laravel menggunakan Docker.

---

## 🎯 BAGIAN 0: RESET SEMUA CONTAINER VOLUME IMAGE DOCKER
*Lakukan langkah ini DENGAN HATI-HATI.*

```bash
# Hentikan semua container yang sedang berjalan
docker compose down -v

# Hapus semua volume yang ada (semua database & data container lain)
docker volume prune -f

# Hapus semua image yang tidak aktif (optional, supaya storage bersih)
docker image prune -a -f

# Build dan jalankan ulang proyek
docker compose build
docker compose up -d
```

## 🎯 BAGIAN 1: SETUP PERTAMA KALI (Inisialisasi)
*Lakukan langkah ini HANYA saat pertama kali mengkloning project atau setup di PC baru.*

### 1. Masuk ke Folder Project
```bash
# Untuk WSL2 (Windows)
cd /mnt/d/3-ProjectWebsite/laragon/www/project-bdn-karanganyar

# Untuk Server Linux (Ubuntu/Kubuntu)
cd ~/server-hosting/project-bdn-karanganyar
```

### 2. Siapkan File Environment (.env)
```bash
cp .env.example .env
```
*Pastikan konfigurasi database di file `.env` seperti ini (sesuaikan dengan docker-compose):*
```env
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=db_utama
DB_USERNAME=root
DB_PASSWORD=root
APP_URL=http://localhost:8081
```

### 3. Build & Jalankan Container Pertama Kali
```bash
# Build image dan jalankan di background
docker compose up -d --build
```

### 4. Setup Laravel (Di dalam Container)
```bash
# Beri akses folder agar Docker bisa menulis file
sudo chmod -R 777 ./
sudo chmod -R 777 ./storage
sudo chmod -R 777 ./bootstrap/cache

# Install dependensi PHP & Node.js
docker compose exec project-bdn-karanganyar composer install
docker compose exec project-bdn-karanganyar npm install
docker compose exec project-bdn-karanganyar npm run build

# Generate App Key & Database
docker compose exec project-bdn-karanganyar php artisan key:generate
docker compose exec project-bdn-karanganyar php artisan migrate
docker compose exec project-bdn-karanganyar php artisan storage:link
```

*(Selamat! Website Anda sekarang sudah bisa diakses di `http://localhost:8081`)*

---

## 💻 BAGIAN 2: OPERASIONAL HARIAN (Daily Coding)
*Perintah yang akan sering Anda gunakan setiap kali mau ngoding atau mematikan PC.*

### Manajemen Container
```bash
# Menyalakan project (tanpa build ulang)
docker compose up -d

# Mematikan project sementara (saat selesai ngoding)
docker compose stop

# Menyalakan kembali project yang di-stop
docker compose start

# Mengecek status container yang sedang jalan
docker compose ps
```

### Masuk ke Dalam Container (Terminal)
```bash
# Masuk ke terminal container Laravel
docker compose exec project-bdn-karanganyar sh

# Ketik 'exit' untuk keluar dari container
```

---

## 🛠️ BAGIAN 3: PERINTAH RUTIN LARAVEL (Artisan)
*Perintah untuk manajemen cache, database, dan route saat pengembangan.*

```bash
# Clear semua cache Laravel (Jika tampilan/kode tidak update)
docker compose exec project-bdn-karanganyar php artisan optimize:clear

# Melihat daftar route API/Web
docker compose exec project-bdn-karanganyar php artisan route:list

# Menjalankan Seeder database
docker compose exec project-bdn-karanganyar php artisan db:seed

# Rollback (Membatalkan) migration terakhir
docker compose exec project-bdn-karanganyar php artisan migrate:rollback
```

---

## 🔍 BAGIAN 4: DEBUGGING & LOG ERROR
*Gunakan ini jika terjadi Error 500, blank screen, atau aplikasi macet.*

### Log Docker & Server
```bash
# Melihat log semua container secara realtime
docker compose logs -f

# Melihat log khusus Nginx (Web Server)
docker compose logs -f nginx

# Melihat log khusus Database (MySQL)
docker compose logs -f db
```

### Log Aplikasi Laravel
```bash
# Melihat 100 baris terakhir dari log Laravel
docker compose exec project-bdn-karanganyar tail -n 100 storage/logs/laravel.log

# Mencari pesan ERROR spesifik di log Laravel
docker compose exec project-bdn-karanganyar grep "local.ERROR" storage/logs/laravel.log | tail -n 3
```

---

## 🧹 BAGIAN 5: BERSIH-BERSIH & RESET (Teardown)
*Hati-hati! Bagian ini digunakan untuk menghapus container jika project sudah selesai atau ingin direset total.*

### Mematikan & Menghapus Project
```bash
# AMAN: Hapus container, tapi database dan image tetap utuh
docker compose down --remove-orphans

# RESET DB: Hapus container beserta volume (Database akan kosong total!)
docker compose down -v

# RESET TOTAL: Hapus container dan semua image Docker project ini
docker compose down --rmi all
```

### Membersihkan Sampah Docker (Hemat Disk)
```bash
# Hapus cache, network, dan container yang tidak terpakai
docker system prune -f

# Hapus semua image yang tidak digunakan oleh container manapun
docker image prune -a
```

---

## ⚙️ BAGIAN 6: KHUSUS PENGGUNA WSL2 (Windows) & LINUX
*Tips optimasi OS untuk menunjang Docker.*

### Mengatasi Docker/WSL2 Bikin RAM Penuh (Jalankan di PowerShell Windows)
```powershell
# Matikan WSL secara paksa untuk melepaskan RAM yang tertahan
wsl --shutdown
```

### Membatasi RAM untuk WSL2
*Buat atau edit file `%UserProfile%\.wslconfig` di Windows Anda, lalu isi dengan:*
```ini
[wsl2]
memory=3GB
processors=2
swap=2GB
```
*(Wajib restart WSL / PC setelah menambahkan file ini).*

### Restart Engine Docker (Di Linux Host / WSL2 Terminal)
```bash
sudo service docker stop
sudo service docker start
```

### Edit File Cepat di Terminal Server (Nano)
```bash
nano .env

# Cara Simpan: Tekan 'Ctrl + O', lalu 'Enter'
# Cara Keluar: Tekan 'Ctrl + X'
```