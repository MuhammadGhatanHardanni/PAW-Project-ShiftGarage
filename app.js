/**
 * app.js — Entry point Shift Garage
 *
 * Inisialisasi Express.js, pasang middleware, atur view engine EJS,
 * koneksi database PostgreSQL, daftarkan rute, dan jalankan server.
 *
 * Struktur MVC:
 *   config/       → konfigurasi aplikasi & koneksi database PostgreSQL
 *   models/       → model data & query database (LayananModel)
 *   middlewares/  → logger HTTP (mencatat method, url, status, timestamp)
 *   controllers/  → logika pemrosesan request (web & API)
 *   routes/       → definisi endpoint (web & API)
 *   views/        → template EJS dengan Tailwind CSS
 *   utils/        → fungsi pembantu (formatting, tanggal, dll)
 */

require('dotenv').config();
const express = require('express');
const path    = require('path');

const config  = require('./config');
const logger  = require('./middlewares/logger');
const routes  = require('./routes');
const initDb  = require('./config/initDb');

const app = express();

// ─── View Engine (EJS) ────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);                          // middleware logger HTTP

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/', routes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      sukses: false,
      pesan : 'Endpoint REST API tidak ditemukan',
    });
  }
  res.status(404).render('404', {
    judul: `404 — Halaman Tidak Ditemukan | ${config.appName}`,
    appName: config.appName,
    tahun: new Date().getFullYear(),
  });
});

// ─── Inisialisasi Database & Jalankan Server ──────────────────────────────────
async function startServer() {
  try {
    // Jalankan inisialisasi tabel & seeder data secara aman
    await initDb();
  } catch (err) {
    console.warn('\x1b[33m[Warning]\x1b[0m Inisialisasi awal database gagal:', err.message);
    console.warn('\x1b[33m[Warning]\x1b[0m Pastikan server PostgreSQL sedang aktif dan kredensial di file .env sesuai.\n');
  }

  app.listen(config.port, () => {
    console.log('');
    console.log('\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
    console.log(`\x1b[36m║\x1b[0m  🏍️  \x1b[1mShift Garage — Server Berjalan Aktif\x1b[0m                 \x1b[36m║\x1b[0m`);
    console.log('\x1b[36m╠═══════════════════════════════════════════════════════════╣\x1b[0m');
    console.log(`\x1b[36m║\x1b[0m  🌐 Beranda      : \x1b[32mhttp://localhost:${config.port}\x1b[0m                       \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m  📋 Kelola CRUD  : \x1b[32mhttp://localhost:${config.port}/layanan\x1b[0m                \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m  ⚡ REST API     : \x1b[32mhttp://localhost:${config.port}/api/produk\x1b[0m             \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m  🔍 Status Server: \x1b[32mhttp://localhost:${config.port}/api/status\x1b[0m             \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m  🐘 Database     : PostgreSQL (${config.db.host}:${config.db.port}/${config.db.database})       \x1b[36m║\x1b[0m`);
    console.log('\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
    console.log('');
  });
}

startServer();
