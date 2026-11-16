# Shift Garage — Sistem Manajemen Bengkel Motor

**Tugas PAW: Project Berkelanjutan**  
**Mahasiswa:** Muhammad Ghatan Hardanni — **NIM:** 20240140182  
*Pengembangan Backend Express.js MVC, Database PostgreSQL, RESTful CRUD, dan Integrasi Generative AI (Google Gemini)*

---

## 🚀 Tech Stack & Arsitektur

- **Runtime & Framework**: Node.js & Express.js (MVC Pattern)
- **Large Language Model (LLM)**: Google Gemini API (`@google/generative-ai`)
- **Database**: PostgreSQL (`pg` Connection Pool)
- **View Engine**: EJS (Embedded JavaScript Templates)
- **Frontend / Styling**: Tailwind CSS (CDN) + Font Awesome 6 Icons
- **Logging**: Custom HTTP Logger Middleware (`access.log`)
- **Config Management**: `dotenv` (`.env`)

---

## 📁 Struktur Folder MVC Terintegrasi AI

```text
Tugas_P7/
├── config/
│   ├── database.js          → Konfigurasi Connection Pool PostgreSQL
│   ├── gemini.js            → Konfigurasi client Google Gemini API & Model
│   ├── index.js             → Variabel konfigurasi global aplikasi
│   └── initDb.js            → Skrip migrasi tabel & seeder data awal
├── controllers/
│   ├── apiController.js     → Logika REST API CRUD (GET, POST, PUT, DELETE)
│   ├── chat.controller.js   → Controller endpoint AI Assistant (POST /api/chat & GET /chat)
│   └── homeController.js    → Logika tampilan web (Beranda & Kelola Layanan)
├── models/
│   └── layananModel.js      → Pengelolaan query database PostgreSQL
├── middlewares/
│   ├── logger.js            → Middleware pencatat request HTTP ke terminal & file log
│   └── validateChatInput.js → Validasi input pesan chat (2-500 karakter)
├── services/
│   └── gemini.service.js    → Pengelola prompt Gemini, context database, & AI Guardrail
├── routes/
│   ├── api.js               → Routing REST API CRUD (/api/produk, /api/status)
│   ├── chat.routes.js       → Routing REST API Chatbot (POST /api/chat)
│   ├── web.js               → Routing Halaman Web (/, /layanan, /chat)
│   └── index.js             → Central router Express
├── views/
│   ├── partials/
│   │   ├── head.ejs         → Meta tag, font Jakarta Sans, & Tailwind config
│   │   ├── footer.ejs       → Footer modern & integrasi chat widget
│   │   └── chatWidget.ejs   → Floating AI Chatbot Widget (di semua halaman)
│   ├── index.ejs            → Beranda SaaS + Interactive REST API Playground
│   ├── layanan.ejs          → Dasbor katalog layanan & operasi CRUD interaktif
│   ├── chat.ejs             → Halaman penuh AI Assistant Dashboard
│   └── 404.ejs              → Halaman error 404
├── utils/
│   └── formatter.js         → Utility format mata uang Rupiah & tanggal
├── logs/
│   └── access.log           → Log riwayat akses HTTP
├── .env.example             → Template environment variable
├── .env                     → Konfigurasi lokal aman (kredensial DB & API Key)
├── app.js                   → Entry point server
└── package.json
```

---

## ⚙️ Konfigurasi Environment (`.env`)

Salin file `.env.example` ke `.env` lalu lengkapi kredensial PostgreSQL dan Google Gemini API Key Anda:

```env
# Port Web Server Express.js
PORT=3000

# Konfigurasi Koneksi Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_NAME=shift_garage

# Konfigurasi Integrasi Google Gemini Generative AI (LLM)
# Dapatkan API Key gratis di Google AI Studio: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-1.5-flash
```

> **Catatan Keamanan:** API Key Google Gemini dikelola sepenuhnya di sisi backend melalui environment variable dan tidak pernah dikirimkan atau diekspos ke sisi client/frontend.

---

## 🛠️ Cara Menjalankan Aplikasi

### 1. Inisialisasi Database (Migrasi & Seeder)
Pastikan PostgreSQL aktif, lalu jalankan perintah otomatis untuk membuat database, tabel `layanan`, dan seeder data awal:
```bash
npm run init-db
```

### 2. Menjalankan Server
```bash
# Mode development (auto-reload saat ada perubahan file)
npm run dev

# Atau mode production standar
npm start
```

Aplikasi dapat diakses melalui browser pada:
- **Beranda Utama**: [http://localhost:3000](http://localhost:3000)
- **Dasbor Kelola Layanan (CRUD)**: [http://localhost:3000/layanan](http://localhost:3000/layanan)
- **AI Assistant Chatbot (Halaman Penuh)**: [http://localhost:3000/chat](http://localhost:3000/chat)
- **Status Server & Database**: [http://localhost:3000/api/status](http://localhost:3000/api/status)

---

## 🤖 Fitur Integrasi Generative AI (Google Gemini)

### 1. Context-Based AI Response
- AI bertindak sebagai asisten resmi **Shift Garage** yang memiliki pengetahuan dinamis terhadap data layanan yang tersimpan di PostgreSQL.
- Context data (`nama`, `kategori`, `deskripsi`, `harga_mulai_dari`, `estimasi_menit`, `tersedia`) diinjeksikan secara real-time ke dalam System Instruction saat pengguna bertanya.

### 2. Prompt Engineering & AI Guardrail
- **Batasan Domain (Guardrail Ketat)**: AI hanya menjawab pertanyaan seputar bengkel motor, layanan servis, estimasi harga, durasi pengerjaan di pit, keluhan motor ringan, dan jam operasional Shift Garage.
- **Penolakan Sopan di Luar Konteks**: Jika pengguna menanyakan hal di luar topik (misal: *"Buatkan saya kode program untuk membuat game"*, resep masakan, politik, dsb.), AI menolak dengan santun dan mengarahkan kembali ke layanan Shift Garage:
  > *"Maaf, sebagai Shift AI Assistant, saya hanya dapat membantu menjawab pertanyaan seputar informasi bengkel motor, katalog servis, tarif, estimasi pengerjaan, dan operasional Shift Garage. Ada yang bisa saya bantu terkait perawatan motor Anda?"*
- **Anti-Hallucination**: AI tidak mengarang layanan atau harga yang tidak ada di sumber database.
- **Anti-Prompt Injection**: Menolak instruksi pengguna yang mencoba mengabaikan batasan sistem (*"ignore instructions"*, *"DAN mode"*, dll).

### 3. Validasi Input (Middleware `validateChatInput.js`)
- Memvalidasi bahwa field `message` ada, bertipe string, tidak kosong atau spasi saja, dan memiliki panjang antara **2 hingga 500 karakter**.

---

## 📡 Dokumentasi Endpoint REST API

### 1. Endpoint AI Assistant

| Method | Endpoint | Deskripsi | Status Code |
|---|---|---|---|
| `POST` | `/api/chat` | Mengirim pertanyaan ke Gemini AI & menerima respons kontekstual | `200 OK` / `400 Bad Request` / `500 Error` |

#### Contoh Request Body `POST /api/chat`:
```json
{
  "message": "Informasi apa saja yang tersedia?"
}
```

#### Contoh Response `POST /api/chat`:
```json
{
  "success": true,
  "data": {
    "reply": "Berikut informasi layanan servis yang tersedia di Shift Garage:\n1. Servis Berkala Ringan (Perawatan) - Mulai Rp 45.000 (30 menit)\n2. Ganti Oli Mesin & Gardan (Perawatan) - Mulai Rp 15.000 (15 menit)\n3. Tune-Up Injeksi Komplit (Spesialis) - Mulai Rp 85.000 (45 menit)..."
  }
}
```

---

### 2. Endpoint CRUD Layanan & Status

| Method | Endpoint | Deskripsi | Status Code |
|---|---|---|---|
| `GET` | `/api/status` | Informasi kesehatan server & status koneksi PostgreSQL | `200 OK` |
| `GET` | `/api/produk` | Mengambil seluruh katalog data layanan | `200 OK` |
| `GET` | `/api/produk/:id` | Mengambil detail 1 layanan berdasarkan ID | `200 OK` / `404 Not Found` |
| `POST` | `/api/produk` | Menambahkan layanan baru ke database | `201 Created` / `400 Bad Request` |
| `PUT` | `/api/produk/:id` | Memperbarui layanan berdasarkan ID | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/produk/:id` | Menghapus layanan dari database | `200 OK` / `404 Not Found` |

---

## 🧪 Pengujian Endpoint Chat via cURL

### 1. Pertanyaan Sesuai Konteks
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Layanan servis apa saja yang tersedia di aplikasi ini?"}'
```

### 2. Pertanyaan di Luar Konteks (Uji Guardrail)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Buatkan saya kode program untuk membuat game."}'
```

### 3. Pesan Kosong (Uji Validasi Middleware - HTTP 400)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'
```

---

## 🎨 Antarmuka AI pada Frontend

1. **Floating AI Chatbot Widget (`views/partials/chatWidget.ejs`)**:
   - Widget mengambang di pojok kanan bawah yang aktif di seluruh halaman web.
   - Dilengkapi tombol buka/tutup animasi, pil saran pertanyaan cepat (*quick prompt pills*), bubble pesan user & AI, indikator animasi loading saat AI memproses, dan tombol reset percakapan.
2. **Dedicated Full Chat Dashboard (`views/chat.ejs`)**:
   - Halaman khusus konsultasi servis otomotif dengan sidebar pedoman AI Guardrail, info jumlah data layanan yang diinjeksikan ke context, status model Gemini, dan area percakapan berukuran penuh.
3. **Interactive API Playground (`views/index.ejs`)**:
   - Tab baru `POST /api/chat` di konsol beranda untuk menguji respons JSON langsung dari browser tanpa membuka tools eksternal.
