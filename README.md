# Shift Garage — Sistem Manajemen Bengkel Motor

**Tugas PAW Week 7** | Muhammad Ghatan Hardanni — 202140182

## Tech Stack
- **Backend** : Node.js + Express.js
- **View Engine** : EJS
- **CSS Framework** : Tailwind CSS (CDN)
- **Arsitektur** : MVC (Model-View-Controller)

## Struktur Folder

```
Tugas_P7/
├── config/          → konfigurasi (port, nama app, path log)
├── models/          → data statis layananModel.js
├── middlewares/     → logger.js (catat HTTP request ke terminal + file)
├── controllers/     → apiController.js & homeController.js
├── routes/          → api.js, web.js, index.js
├── views/           → index.ejs, layanan.ejs, partials/
├── utils/           → formatter.js (formatRupiah, sekarang, dll)
├── logs/            → file log otomatis dibuat saat server jalan
├── app.js           → entry point
└── package.json
```

## Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan server (mode development dengan auto-reload)
npm run dev

# 3. Atau jalankan biasa
npm start
```

Server akan berjalan di **http://localhost:3000**

## Endpoint yang Tersedia

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/` | Halaman utama (EJS) |
| GET | `/layanan` | Halaman daftar layanan (EJS) |
| GET | `/api/status` | Status server (JSON) |
| GET | `/api/produk` | Data layanan bengkel (JSON) |

## Middleware Logger

<<<<<<< HEAD

=======
>>>>>>> d7666ebc0bdcf79e2ad369fa0729f07f035d7863
Setiap request dicatat di:
- **Terminal** — dengan kode warna (hijau = sukses, kuning = 4xx, merah = 5xx)
- **File** — `logs/access.log` dalam format Markdown table

