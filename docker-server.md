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
mkdir -p ~/server-hosting/projects
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
cd ~/server-hosting/projects

# Clone dari Git (Ganti dengan link repo GitHub Anda)
git clone <URL-REPO-GITHUB-ANDA> nama-project-baru
cd nama-project-baru

# Jalankan container (Nginx, MySQL, App, dll)
docker compose up -d
```

### 2. Setup Laravel & Atasi Hak Akses (Permission)
```bash
# Beri hak tulis sementara ke folder project agar Docker bisa bekerja (mencegah error permission)
sudo chmod -R 777 ~/server-hosting/projects/nama-project-baru

# Install PHP Library (Composer) & Generate Key 
# Catatan: Ganti 'nama-container-app' dengan nama container Laravel Anda (bisa dicek dengan `docker ps`)
docker compose exec nama-container-app composer install
docker compose exec nama-container-app php artisan key:generate

# Build Frontend (Vite/Node.js) untuk memproses file CSS/JS agar tidak error 404
docker compose exec nama-container-app npm install
docker compose exec nama-container-app npm run build

# Kunci kembali hak akses khusus folder storage dan cache (Syarat wajib Laravel, mencegah Error 500)
sudo chmod -R 777 ~/server-hosting/projects/nama-project-baru/storage
sudo chmod -R 777 ~/server-hosting/projects/nama-project-baru/bootstrap/cache
```

### 3. Daftarkan Domain Baru ke Tunnel
*Misalnya web baru ini ingin diakses di `app.domainanda.com` dan berjalan di port lokal `8082`.*

**A. Tambahkan Route DNS (Tembak domain ke Tunnel):**
```bash
cloudflared tunnel route dns idn-server app.domainanda.com
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
  - hostname: app.domainanda.com
    service: http://localhost:8082

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