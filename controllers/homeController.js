/**
 * controllers/homeController.js
 * Menangani halaman-halaman web (view EJS).
 */

const LayananModel  = require('../models/layananModel');
const config        = require('../config');
const { formatRupiah } = require('../utils/formatter');

/** GET / — Halaman utama */
exports.index = (req, res) => {
  const layanan = LayananModel.getAll();
  res.render('index', {
    judul       : `${config.appName} — Bengkel Motor Cerdas`,
    appName     : config.appName,
    layanan,
    formatRupiah,           // diteruskan ke EJS agar bisa format rupiah di template
    tahun       : new Date().getFullYear(),
  });
};

/** GET /layanan — Halaman daftar layanan */
exports.layanan = (req, res) => {
  const layanan = LayananModel.getAll();
  res.render('layanan', {
    judul       : `Layanan — ${config.appName}`,
    appName     : config.appName,
    layanan,
    formatRupiah,
    tahun       : new Date().getFullYear(),
  });
};

