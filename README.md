# PakaiLagi - Marketplace Pre-Loved

Platform marketplace pakaian pre-loved dengan sistem multi-seller, chat real-time, dan pembayaran Midtrans.

---

## Setup

### 1. Isi file .env (di folder utama)

```
MONGODB_URI=mongodb+srv://tazkiyarahim_db_user:SNK12u4jboU0ShBx@cluster0.ykpl2ok.mongodb.net/fashion_rescue?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=fashionrescue_jwt_secret_2024
MIDTRANS_SERVER_KEY=SB-Mid-server-your_key_here
MIDTRANS_CLIENT_KEY=SB-Mid-client-your_key_here
CLOUDINARY_CLOUD_NAME=dyxm8rxj4
CLOUDINARY_API_KEY=684641268269393
CLOUDINARY_API_SECRET=hP8ATtSJKVZDBHJ6h0-Uy-uxa4E
```

### 2. Buka 7 terminal, jalankan urut:

```bash
# Terminal 1
cd services/auth-service && npm install && node index.js

# Terminal 2
cd services/product-service && npm install && node index.js

# Terminal 3
cd services/chat-service && npm install && node index.js

# Terminal 4
cd services/payment-service && npm install && node index.js

# Terminal 5
cd services/store-service && npm install && node index.js

# Terminal 6
cd services/gateway && npm install && node index.js

# Terminal 7
cd frontend && npm install && npm start
```

### 3. Buka browser: http://localhost:3000

---

## Akun Demo

| Role  | Email                        | Password  |
|-------|------------------------------|-----------|
| Admin | admin@fashionrescue.com      | admin123  |
| User  | Daftar via halaman /register | -         |

---

## Fitur

### User (Pembeli)
- Register & Login
- Katalog produk dengan filter lengkap
- Detail produk dengan grade kondisi
- Halaman toko penjual
- Chat real-time dengan penjual
- Beli produk (Midtrans / demo mode)
- Riwayat pesanan
- Edit profil + upload foto profil
- Pengaturan akun + ubah password

### User (Penjual - setelah buka toko)
- Buka toko (langsung aktif)
- Upload logo & banner toko
- CRUD produk (foto, harga, grade, ukuran)
- Toggle status stok Tersedia/Terjual
- Lihat pesanan masuk
- Dashboard penjual dengan statistik

### Admin
- Dashboard statistik platform
- Monitor semua toko (aktifkan/nonaktifkan)
- Monitor semua pengguna
- Monitor semua produk
- Monitor semua pesanan

---

## Port

| Service         | Port |
|----------------|------|
| Frontend        | 3000 |
| Auth Service    | 3001 |
| Product Service | 3002 |
| Chat Service    | 3003 |
| Payment Service | 3004 |
| Store Service   | 3005 |
| Gateway         | 8080 |
