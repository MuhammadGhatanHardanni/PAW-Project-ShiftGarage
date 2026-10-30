/**
 * app.js — Entry point Shift Garage
 *
 * Inisialisasi Express.js, pasang middleware, atur view engine,
 * daftarkan routes, dan jalankan server.
 *
 * Struktur MVC:
 *   config/       → konfigurasi aplikasi
 *   models/       → data statis (tanpa database)
 *   middlewares/  → logger HTTP
 *   controllers/  → logika pemrosesan request
 *   routes/       → definisi endpoint
 *   views/        → template EJS
 *   utils/        → fungsi pembantu
 */

const express = require('express');
const path    = require('path');

const config  = require('./config');
const logger  = require('./middlewares/logger');
const routes  = require('./routes');

const app = express();

// ─── View Engine (EJS) ────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger);                          // middleware logger HTTP

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/', routes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      sukses: false,
      pesan : 'Endpoint tidak ditemukan',
    });
  }
  res.status(404).send('<h1>404 — Halaman tidak ditemukan</h1>');
});

// ─── Jalankan Server ──────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log('');
  console.log('\x1b[36m╔══════════════════════════════════════╗\x1b[0m');
  console.log(`\x1b[36m║  🔧  Shift Garage — Server Berjalan    ║\x1b[0m`);
  console.log('\x1b[36m╠══════════════════════════════════════╣\x1b[0m');
  console.log(`\x1b[36m║\x1b[0m  URL   : \x1b[32mhttp://localhost:${config.port}\x1b[0m`);
  console.log(`\x1b[36m║\x1b[0m  Status: \x1b[32mhttp://localhost:${config.port}/api/status\x1b[0m`);
  console.log(`\x1b[36m║\x1b[0m  Produk: \x1b[32mhttp://localhost:${config.port}/api/produk\x1b[0m`);
  console.log('\x1b[36m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');
});

