## ⚡ Digiflazz Pay Point (PPOB Mobile App)

Aplikasi PPOB (Payment Point Online Bank) berbasis React Native (Expo) yang terintegrasi dengan API Digiflazz untuk transaksi pulsa, paket data, dan tagihan lainnya.

## 🏗️ Struktur Project
- `artifacts/api-server`: Backend Node.js + TypeScript + PostgreSQL.
- `artifacts/ppob-app`: Frontend Mobile App (React Native Expo).

## 🚀 Fitur Utama
- **Keamanan Login**: Validasi ganda (Local & Server) untuk mencegah data ghaib.
- **Manajemen Akun**: Dashboard admin untuk pantau saldo dan transaksi user.
- **Integrasi Digiflazz**: Koneksi otomatis ke provider Digiflazz.
- **Auto-Sync**: Saldo dan riwayat tersinkronisasi aman di VPS.

---

## 🛠️ Panduan Instalasi VPS (Deployment)

Panduan ini digunakan jika terjadi perpindahan server atau instalasi ulang VPS (Ubuntu).

### 1. Persiapan Awal (Install Aplikasi Wajib)
```bash
sudo apt update && sudo apt upgrade -y
```
# Install Node.js v18
```
curl -fsSL [https://deb.nodesource.com/setup_18.x](https://deb.nodesource.com/setup_18.x) | sudo -E bash -
sudo apt install -y nodejs
```
# Install PostgreSQL & Nginx
```
sudo apt install postgresql postgresql-contrib nginx -y
```
## Pengaturan Database (PostgreSQL)
Masuk ke sistem database: 
```
sudo -u postgres psql
```
## Lalu jalankan perintah SQL ini:
```
SQL
CREATE DATABASE digiflazz_db;
CREATE USER admin_ppob WITH PASSWORD 'password_rahasia_kamu';
GRANT ALL PRIVILEGES ON DATABASE digiflazz_db TO admin_ppob;
\q
```
## Build & Jalankan API Server (Backend)
```
cd ~/Digiflazz-Pay-Point/artifacts/api-server
```
```
npm install
```
```
npm run build
```
```
sudo npm install -g pm2
```
```
pm2 start dist/index.js --name api-backend
```
```
pm2 save && pm2 startup
```
## Build APK Android (Frontend)
## Pastikan eas.json sudah mengarah ke IP/Domain VPS yang benar sebelum melakukan build.

```
cd ~/Digiflazz-Pay-Point/artifacts/ppob-app
```
```
npm install -g eas-cli
```
```
npx eas login
```
```
npx eas build -p android --profile preview
```
## Pengaturan Domain via Nginx (Opsional)
```
sudo nano /etc/nginx/sites-available/ppob
```
## Isi konfigurasinya:
```
Nginx
server {
    server_name api.dwizy22.my.id;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
## Aktifkan:

```
sudo ln -s /etc/nginx/sites-available/ppob /etc/nginx/sites-enabled/
```
```
sudo systemctl restart nginx
```
📄 Lisensi
Private Project - © 2026 Dwiexe.EOF
