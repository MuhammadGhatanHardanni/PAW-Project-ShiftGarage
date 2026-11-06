# Shift Garage — Sistem Manajemen Bengkel Motor

**Tugas PAW Pertemuan 7** | Muhammad Ghatan Hardanni — 20240140182  
*Project Berkelanjutan: Integrasi Database PostgreSQL & Implementasi RESTful CRUD*

---

## 🚀 Tech Stack & Arsitektur

- **Runtime & Backend** : Node.js & Express.js (MVC Pattern)
- **Database** : PostgreSQL (`pg` Connection Pool)
- **View Engine** : EJS (Embedded JavaScript Templates)
- **Frontend / Styling** : Tailwind CSS (CDN) + Font Awesome 6 Icons
- **Logging** : Custom HTTP Logger Middleware (`access.log`)
- **Config Management** : `dotenv` (`.env`)

---

## 📁 Struktur Folder MVC

```text
Tugas_P7/
├── config/
│   ├── database.js     → Konfigurasi Connection Pool PostgreSQL
│   ├── index.js        → Variabel global aplikasi & info env
│   └── initDb.js       → Skrip migrasi tabel & seeder data awal
├── controllers/
│   ├── apiController.js   → Logika REST API CRUD (GET, POST, PUT, DELETE)
│   └── homeController.js  → Logika tampilan web (EJS views & form handler)
├── models/
│   └── layananModel.js → Pengelolaan query database (CRUD Layanan)
├── middlewares/
│   └── logger.js       → Middleware pencatat request HTTP ke terminal & file
├── routes/
│   ├── api.js          → Routing REST API (/api/*)
│   ├── web.js          → Routing Halaman Web (/, /layanan, dll)
│   └── index.js        → Central router
├── views/
│   ├── partials/
│   │   ├── head.ejs    → Template header, Tailwind config, Font Awesome
│   │   └── footer.ejs  → Footer aplikasi
│   ├── index.ejs       → Beranda + Interactive REST API Console
│   ├── layanan.ejs     → Dasbor manajemen katalog layanan (CRUD UI Modern)
│   └── 404.ejs         → Halaman error 404 modern
├── utils/
│   └── formatter.js    → Utility format Rupiah & tanggal
├── logs/
│   └── access.log      → Log riwayat akses HTTP
├── .env.example        → Contoh konfigurasi environment
├── .env                → Konfigurasi lokal (diabaikan oleh git)
├── app.js              → Entry point server
└── package.json
```

---

## ⚙️ Konfigurasi Environment (`.env`)

Salin file `.env.example` ke `.env` lalu sesuaikan kredensial PostgreSQL Anda:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_NAME=shift_garage
```

---

## 🛠️ Cara Menjalankan

### 1. Inisialisasi Database (Migrasi & Seeder)
Skrip ini akan membuat database `shift_garage` (jika belum ada), membuat tabel `layanan`, dan mengisi data awal bengkel secara otomatis:
```bash
npm run init-db
```

### 2. Menjalankan Server
```bash
# Mode development (auto-reload)
npm run dev

# Atau mode production
npm start
```

Aplikasi dapat diakses di:
- **Beranda**: [http://localhost:3000](http://localhost:3000)
- **Dasbor Kelola Layanan (CRUD UI)**: [http://localhost:3000/layanan](http://localhost:3000/layanan)
- **Status API**: [http://localhost:3000/api/status](http://localhost:3000/api/status)

---

## 📡 Dokumentasi Endpoint REST API

| Method | Endpoint | Deskripsi | Status Code |
|---|---|---|---|
| `GET` | `/api/status` | Informasi kesehatan server & status DB | `200 OK` |
| `GET` | `/api/produk` | Mengambil seluruh data layanan dari database | `200 OK` |
| `GET` | `/api/produk/:id` | Mengambil detail layanan berdasarkan ID | `200 OK` / `404 Not Found` |
| `POST` | `/api/produk` | Menambahkan layanan baru ke database | `201 Created` / `400 Bad Request` |
| `PUT` | `/api/produk/:id` | Memperbarui layanan berdasarkan ID | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/produk/:id` | Menghapus layanan dari database | `200 OK` / `404 Not Found` |

### Contoh Request Body `POST /api/produk`:
```json
{
  "id": "L-07",
  "nama": "Servis Radiator & Coolant",
  "kategori": "Perawatan",
  "deskripsi": "Kuras radiator, flushing kerak pendingin, isi ulang air radiator high grade.",
  "hargaMulaiDari": 65000,
  "estimasiMenit": 40,
  "tersedia": true
}
```

---

## ✨ Fitur Tampilan UI/UX Modern

1. **Clean Dashboard Layout**: Desain berbasis Tailwind CSS dengan palet warna elegan Slate & Aksen Oranye khas otomotif.
2. **Statistik Realtime**: Kartu ringkasan total layanan, layanan aktif, variasi kategori, dan rata-rata biaya.
3. **Pencarian & Filter Instan**: Pencarian berbasis nama/deskripsi dan filter kategori tanpa perlu reload halaman.
4. **Modal Interaktif (CRUD)**:
   - Modal Form Tambah Data
   - Modal Form Edit Data
   - Modal Quick View Detail
   - Modal Konfirmasi Hapus Data
5. **Toast Notification**: Umpan balik langsung di layar saat data berhasil ditambah, diubah, atau dihapus.
6. **Live API Console**: Pengujian REST API langsung dari halaman depan dengan inspeksi status dan durasi respons.
