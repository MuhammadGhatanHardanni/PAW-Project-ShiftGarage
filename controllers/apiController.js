/**
 * controllers/apiController.js
 * Menangani request ke REST API /api/*
 * Seluruh operasi terhubung ke PostgreSQL melalui LayananModel (MVC).
 */

const LayananModel = require('../models/layananModel');
const config       = require('../config');
const { sekarang } = require('../utils/formatter');

/**
 * GET /api/status
 * Memeriksa status server dan ketersediaan aplikasi
 */
exports.status = async (req, res) => {
  try {
    const data = await LayananModel.getAll();
    res.json({
      status      : 'ok',
      aplikasi    : config.appName,
      versi       : config.version,
      author      : config.author,
      uptime      : `${Math.round(process.uptime())} detik`,
      waktuServer : sekarang(),
      database    : {
        engine: 'PostgreSQL',
        status: 'Terhubung',
        totalProduk: data.length,
      },
    });
  } catch (err) {
    res.status(500).json({
      status      : 'degraded',
      aplikasi    : config.appName,
      pesan       : 'Database tidak dapat diakses',
      error       : err.message,
      waktuServer : sekarang(),
    });
  }
};

/**
 * GET /api/produk
 * Mengambil dan menampilkan seluruh data produk/layanan dari database
 */
exports.produk = async (req, res) => {
  try {
    const data = await LayananModel.getAll();
    res.status(200).json({
      sukses : true,
      jumlah : data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      sukses : false,
      pesan  : 'Gagal mengambil data dari database',
      error  : err.message,
    });
  }
};

/**
 * GET /api/produk/:id
 * Mengambil detail satu data layanan berdasarkan ID
 */
exports.detailProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LayananModel.getById(id);

    if (!item) {
      return res.status(404).json({
        sukses : false,
        pesan  : `Layanan dengan ID "${id}" tidak ditemukan`,
      });
    }

    res.status(200).json({
      sukses : true,
      data   : item,
    });
  } catch (err) {
    res.status(500).json({
      sukses : false,
      pesan  : 'Terjadi kesalahan saat mencari data',
      error  : err.message,
    });
  }
};

/**
 * POST /api/produk
 * Menambahkan data layanan baru ke dalam database
 */
exports.tambahProduk = async (req, res) => {
  try {
    const { nama, kategori, deskripsi, hargaMulaiDari, harga_mulai_dari, estimasiMenit, estimasi_menit, tersedia, id } = req.body;

    if (!nama || String(nama).trim() === '') {
      return res.status(400).json({
        sukses : false,
        pesan  : 'Kolom "nama" layanan wajib diisi',
      });
    }

    const dataBaru = await LayananModel.create({
      id,
      nama: String(nama).trim(),
      kategori: kategori ? String(kategori).trim() : 'Umum',
      deskripsi: deskripsi ? String(deskripsi).trim() : '',
      hargaMulaiDari: hargaMulaiDari ?? harga_mulai_dari ?? 0,
      estimasiMenit: estimasiMenit ?? estimasi_menit ?? 30,
      tersedia,
    });

    res.status(201).json({
      sukses : true,
      pesan  : 'Data layanan berhasil ditambahkan ke database',
      data   : dataBaru,
    });
  } catch (err) {
    res.status(500).json({
      sukses : false,
      pesan  : 'Gagal menambahkan data layanan ke database',
      error  : err.message,
    });
  }
};

/**
 * PUT /api/produk/:id
 * Memperbarui data layanan berdasarkan ID di database
 */
exports.ubahProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await LayananModel.update(id, req.body);

    if (!updated) {
      return res.status(404).json({
        sukses : false,
        pesan  : `Layanan dengan ID "${id}" tidak ditemukan untuk diperbarui`,
      });
    }

    res.status(200).json({
      sukses : true,
      pesan  : 'Data layanan berhasil diperbarui',
      data   : updated,
    });
  } catch (err) {
    res.status(500).json({
      sukses : false,
      pesan  : 'Gagal memperbarui data layanan',
      error  : err.message,
    });
  }
};

/**
 * DELETE /api/produk/:id
 * Menghapus data layanan berdasarkan ID dari database
 */
exports.hapusProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await LayananModel.delete(id);

    if (!deleted) {
      return res.status(404).json({
        sukses : false,
        pesan  : `Layanan dengan ID "${id}" tidak ditemukan untuk dihapus`,
      });
    }

    res.status(200).json({
      sukses : true,
      pesan  : 'Data layanan berhasil dihapus dari database',
      data   : deleted,
    });
  } catch (err) {
    res.status(500).json({
      sukses : false,
      pesan  : 'Gagal menghapus data layanan',
      error  : err.message,
    });
  }
};
