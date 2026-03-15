# 🐳 Panduan Lengkap Docker & Laravel (WSL2)

Panduan ini berisi perintah dasar untuk menjalankan **project Laravel menggunakan Docker di WSL2**.  
Gunakan ini sebagai **cheatsheet cepat** saat development.

---

# 📁 1. Masuk ke Folder Project

```bash
cd /mnt/d/3-ProjectWebsite/laragon/www/project-bdn-karanganyar
```

*(Path `/mnt/d` berarti mengakses drive **D:** dari Windows melalui WSL2).*

---

# 🚀 2. Perintah Utama Docker Compose

### Build dan Jalankan Container

```bash
docker compose up -d --build
```

*(Digunakan jika ada perubahan pada **Dockerfile** atau **docker-compose.yml**).*

### Jalankan Container (Cepat)

```bash
docker compose up -d
```

*(Menjalankan container tanpa rebuild image).*

### Stop Container (Tanpa Menghapus)

```bash
docker compose stop
```

*(Container dimatikan sementara tetapi masih tersimpan).*

### Menjalankan Kembali Container

```bash
docker compose start
```

*(Menyalakan kembali container yang sebelumnya di-stop).*

### Cek Status Container

```bash
docker compose ps
```

*(Melihat container yang sedang berjalan beserta port-nya).*

### Melihat Log Container

```bash
docker compose logs -f
```

*(Menampilkan log secara realtime untuk debugging).*

---

# 🧹 3. Menghapus Proyek (Teardown & Clean Up)

### Hapus Kontainer & Network SAJA

```bash
docker compose down --remove-orphans
```

*(Container dihapus tetapi **database MySQL dan image Docker tetap aman**).*

### Hapus Kontainer + Reset Database

```bash
docker compose down -v
```

*(Volume database ikut dihapus sehingga database kembali kosong).*

### Hapus Container + Image Project

```bash
docker compose down --rmi all
```

*(Semua image yang dibuat oleh project ini akan dihapus).*

> 💡 **Catatan Penting**  
> File project kamu di Windows **TIDAK AKAN TERHAPUS**.  
> Docker hanya menghapus **container, network, dan volume miliknya sendiri**.

---

# ⚙️ 4. Inisialisasi Laravel (Pertama Kali)

### Salin File Environment

```bash
cp .env.example .env
```

### Generate App Key

```bash
docker compose exec project-bdn-karanganyar php artisan key:generate
```

### Jalankan Migration Database

```bash
docker compose exec project-bdn-karanganyar php artisan migrate
```

### Membuat Storage Link

```bash
docker compose exec project-bdn-karanganyar php artisan storage:link
```

---

# 🗄️ 5. Konfigurasi `.env` untuk Docker

Pastikan bagian database seperti berikut:

```env
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=db_utama
DB_USERNAME=root
DB_PASSWORD=root

APP_URL=http://localhost:8081
```

*(DB_HOST harus sama dengan nama service database di `docker-compose.yml`).*

---

# 🛠️ 6. Perintah Maintenance Laravel

### Clear Semua Cache Laravel

```bash
docker compose exec project-bdn-karanganyar php artisan optimize:clear
```

### Melihat Daftar Route

```bash
docker compose exec project-bdn-karanganyar php artisan route:list
```

### Menjalankan Seeder

```bash
docker compose exec project-bdn-karanganyar php artisan db:seed
```

### Rollback Migration

```bash
docker compose exec project-bdn-karanganyar php artisan migrate:rollback
```

---

# 💻 7. Akses Terminal Container

### Masuk ke Container

```bash
docker compose exec project-bdn-karanganyar sh
```

### Keluar dari Container

```bash
exit
```

---

# 📝 8. Edit File Langsung di Terminal (Linux / Mini PC)

## Menggunakan Nano (Disarankan)

Buka file:

```bash
nano .env
```

Simpan perubahan:

```
Ctrl + O
```

Keluar dari editor:

```
Ctrl + X
```

---

## Menggunakan Vim (Alternatif)

Buka file:

```bash
vi .env
```

Masuk mode edit:

```
i
```

Simpan & keluar:

```
Esc
:wq
```

Keluar tanpa simpan:

```
Esc
:q!
```

---

# 🔍 9. Debugging & Log Error

### Melihat Log Laravel

```bash
docker compose exec project-bdn-karanganyar tail -n 100 storage/logs/laravel.log
```

### Melihat Log Laravel ERROR

```bash
docker compose exec project-bdn-karanganyar grep "local.ERROR" storage/logs/laravel.log | tail -n 3
```

### Melihat Log Container

```bash
docker compose logs -f
```

### Log Nginx

```bash
docker compose logs -f nginx
```

### Log Database

```bash
docker compose logs -f db
```

---

# 🧼 10. Maintenance Docker (Disk & Cache)

Membersihkan container, network, dan cache tidak terpakai:

```bash
docker system prune -f
```

Membersihkan semua image tidak terpakai:

```bash
docker image prune -a
```

---

# 🧠 11. Reset RAM WSL2 (Jika Docker Berat)

Jalankan di **PowerShell Windows**:

```powershell
wsl --shutdown
```

*(Semua distro WSL2 dimatikan dan RAM akan dilepaskan kembali).*

---

# 🖥️ 12. Stop / Start Service Docker (Linux Server)

Stop Docker:

```bash
sudo service docker stop
```

Start Docker:

```bash
sudo service docker start
```

---

# 🌐 13. Informasi Konfigurasi Project

### URL Website

```
http://localhost:8081
```

### Database

```
Host : 127.0.0.1
Port : 3306
User : root
Pass : root
```

---

# ⚡ 14. Konfigurasi RAM WSL2 (Opsional)

Lokasi file konfigurasi:

```
%UserProfile%\.wslconfig
```

Contoh konfigurasi:

```ini
[wsl2]
memory=3GB
processors=2
swap=2GB
```

*(Disarankan untuk development Docker + Laravel agar Windows tidak kehabisan RAM).*