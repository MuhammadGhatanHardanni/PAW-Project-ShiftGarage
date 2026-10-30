/**
 * controllers/apiController.js
 * Menangani request ke endpoint /api/*
 */

const LayananModel = require('../models/layananModel');
const config       = require('../config');
const { sekarang } = require('../utils/formatter');

/** GET /api/status */
exports.status = (req, res) => {
  res.json({
    status    : 'ok',
    aplikasi  : config.appName,
    versi     : config.version,
    author    : config.author,
    uptime    : `${Math.round(process.uptime())} detik`,
    waktuServer: sekarang(),
  });
};

/** GET /api/produk  (alias: layanan bengkel sebagai "produk" sesuai spec tugas) */
exports.produk = (req, res) => {
  const data = LayananModel.getAll();
  res.json({
    sukses : true,
    jumlah : data.length,
    data,
  });
};

