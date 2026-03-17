# 📖 MASTER RUNBOOK: SERVER HOSTING IDN-SOLO
**Panduan Lengkap Setup Server Ubuntu/Kubuntu dengan Docker, Laravel, & Cloudflare Tunnel**

---

## 🛠️ BAGIAN 1: SETUP SERVER INDUK (Hanya 1x Per PC)
*Lakukan ini hanya saat Anda baru pertama kali menginstal Ubuntu/Kubuntu di PC/Laptop yang akan dijadikan server.*

### 1. Update OS & Keamanan Dasar
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install tool esensial
sudo apt install -y git curl wget nano ufw software-properties-common apt-transport-https ca-certificates

# Setup Firewall (UFW)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Buat folder penampungan project
mkdir -p ~/server-hosting/
```

### 2. Instalasi Docker Engine
```bash
# Tambahkan GPG Key dan Repository Docker
curl -fsSL [https://download.docker.com/linux/ubuntu/gpg](https://download.docker.com/linux/ubuntu/gpg) | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] [https://download.docker.com/linux/ubuntu](https://download.docker.com/linux/ubuntu) $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Masukkan user ke grup docker agar tidak perlu pakai 'sudo'
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Instalasi Cloudflared & Pembuatan Tunnel Induk
```bash
# Download & Install Cloudflared
curl -L --output cloudflared.deb [https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb](https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb)
sudo dpkg -i cloudflared.deb

# Login ke akun Cloudflare (Buka link yang muncul di terminal ke browser Anda)
cloudflared tunnel login

# Buat Tunnel Induk (Misal: idn-server)
cloudflared tunnel create idn-server

# WAJIB CATAT: ID Tunnel yang muncul setelah perintah di atas!

# Pindahkan file kredensial ke folder sistem root (/etc/cloudflared)
sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/<MASUKKAN-ID-TUNNEL-DI-SINI>.json /etc/cloudflared/
```

### 4. Buat File Konfigurasi Dasar Tunnel
```bash
sudo nano /etc/cloudflared/config.yml
```

*Isi dengan template dasar ini:*
```yaml
tunnel: <MASUKKAN-ID-TUNNEL-DI-SINI>
credentials-file: /etc/cloudflared/<MASUKKAN-ID-TUNNEL-DI-SINI>.json

ingress:
  # Rute catch-all (WAJIB ada di paling bawah, jangan dihapus)
  - service: http_status:404
```

### 5. Aktifkan Service Tunnel (Auto-Start)
```bash
# Daftarkan sebagai service sistem agar otomatis jalan saat PC dihidupkan
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## 🚀 BAGIAN 2: DEPLOYMENT PROJECT BARU (Bisa Diulang)
*Gunakan panduan ini setiap kali Anda ingin menambahkan aplikasi/website baru (misal: project-bdn-karanganyar) ke dalam server yang sudah menyala.*

### 1. Kloning Proyek & Jalankan Docker
```bash
cd ~/server-hosting/

# Clone dari Git (Ganti dengan link repo GitHub Anda)
git clone <URL-REPO-GITHUB-ANDA> project-bdn-karanganyar
cd project-bdn-karanganyar

# Jalankan container (Nginx, MySQL, App, dll)
docker compose up -d
```

### 2. Setup Laravel & Atasi Hak Akses (Permission)

*a. Setting ENV terlebih dahulu*
```bash
cp .env.example .env
nano .env
```

*b. Sesuaikan APP_URL*
```bash
APP_URL=http://localhost:8001
```

*b. Sesuaikan konfigurasi Database*
```bash
DB_CONNECTION=mysql
DB_HOST=bdn_karanganyar_db
DB_PORT=3306
DB_DATABASE=bdn_karanganyar_db
DB_USERNAME=root
DB_PASSWORD=root
```

*c. Install Composer dan NPM Install*
```bash
# Beri hak tulis sementara ke folder project agar Docker bisa bekerja (mencegah error permission)
sudo chmod -R 777 ~/server-hosting/project-bdn-karanganyar

# Install PHP Library (Composer) & Generate Key 
# Catatan: Ganti 'bdn_karanganyar_app' dengan nama container Laravel Anda (bisa dicek dengan `docker ps`)
docker compose exec bdn_karanganyar_app composer install
docker compose exec bdn_karanganyar_app php artisan key:generate
docker compose exec bdn_karanganyar_app php artisan migrate

# Build Frontend (Vite/Node.js) untuk memproses file CSS/JS agar tidak error 404
docker compose exec bdn_karanganyar_app npm install
docker compose exec bdn_karanganyar_app npm run build

# Kunci kembali hak akses khusus folder storage dan cache (Syarat wajib Laravel, mencegah Error 500)
sudo chmod -R 777 ~/server-hosting/project-bdn-karanganyar/storage
sudo chmod -R 777 ~/server-hosting/project-bdn-karanganyar/bootstrap/cache
```

### 3. Daftarkan Domain Baru ke Tunnel
*Misalnya web baru ini ingin diakses di `bdn.ade-setiawan.my.id` dan berjalan di port lokal `8081`.*

**A. Tambahkan Route DNS (Tembak domain ke Tunnel):**
```bash
cloudflared tunnel route dns idn-server bdn.ade-setiawan.my.id
```

**B. Tambahkan Rute ke Config Tunnel:**
```bash
sudo nano /etc/cloudflared/config.yml
```

*Tambahkan konfigurasi project baru DI ATAS rute 404:*
```yaml
tunnel: <MASUKKAN-ID-TUNNEL-DI-SINI>
credentials-file: /etc/cloudflared/<MASUKKAN-ID-TUNNEL-DI-SINI>.json

ingress:
  # -> TAMBAHKAN PROJECT BARU DI SINI <-
  - hostname: bdn.ade-setiawan.my.id
    service: http://localhost:8081

  # Catch-all (Biarkan di paling bawah)
  - service: http_status:404
```

**C. Restart Tunnel agar rute baru terbaca:**
```bash
sudo systemctl restart cloudflared

# Cek status pastikan Active (running) tanpa error
sudo systemctl status cloudflared
```

🎉 **SELESAI! Buka browser dan akses domain Anda.**