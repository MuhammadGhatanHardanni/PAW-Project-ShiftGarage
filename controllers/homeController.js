/**
 * controllers/homeController.js
 * Menangani halaman web (EJS views) dan aksi web form.
 * Seluruh data diperoleh dari database PostgreSQL melalui LayananModel (MVC).
 */

const LayananModel     = require('../models/layananModel');
const config           = require('../config');
const { formatRupiah } = require('../utils/formatter');

/**
 * GET / — Halaman utama (Beranda)
 */
exports.index = async (req, res) => {
  try {
    const layanan = await LayananModel.getAll();
    res.render('index', {
      judul        : `${config.appName} — Bengkel Motor Cerdas`,
      appName      : config.appName,
      layanan,
      formatRupiah,
      tahun        : new Date().getFullYear(),
    });
  } catch (err) {
    console.error('[Web Error] Gagal memuat data beranda:', err.message);
    res.status(500).render('index', {
      judul        : `${config.appName} — Bengkel Motor Cerdas`,
      appName      : config.appName,
      layanan      : [],
      formatRupiah,
      tahun        : new Date().getFullYear(),
      error        : 'Gagal memuat data dari database PostgreSQL: ' + err.message,
    });
  }
};

/**
 * GET /layanan — Halaman kelola layanan (CRUD UI)
 */
exports.layanan = async (req, res) => {
  try {
    const layanan = await LayananModel.getAll();
    res.render('layanan', {
      judul        : `Kelola Layanan — ${config.appName}`,
      appName      : config.appName,
      layanan,
      formatRupiah,
      tahun        : new Date().getFullYear(),
      notif        : req.query.notif || null,
      tipeNotif    : req.query.tipe || 'success',
    });
  } catch (err) {
    console.error('[Web Error] Gagal memuat halaman layanan:', err.message);
    res.status(500).render('layanan', {
      judul        : `Kelola Layanan — ${config.appName}`,
      appName      : config.appName,
      layanan      : [],
      formatRupiah,
      tahun        : new Date().getFullYear(),
      notif        : 'Gagal mengambil data dari database: ' + err.message,
      tipeNotif    : 'error',
    });
  }
};

/**
 * POST /layanan/tambah — Form submission fallback untuk tambah layanan
 */
exports.formTambah = async (req, res) => {
  try {
    const { nama, kategori, deskripsi, hargaMulaiDari, estimasiMenit, tersedia, id } = req.body;
    if (!nama || String(nama).trim() === '') {
      return res.redirect('/layanan?notif=Nama+layanan+wajib+diisi&tipe=error');
    }

    await LayananModel.create({
      id,
      nama: String(nama).trim(),
      kategori: kategori ? String(kategori).trim() : 'Perawatan',
      deskripsi: deskripsi ? String(deskripsi).trim() : '',
      hargaMulaiDari: parseInt(hargaMulaiDari, 10) || 0,
      estimasiMenit: parseInt(estimasiMenit, 10) || 30,
      tersedia: Boolean(tersedia === 'true' || tersedia === 'on' || tersedia === true),
    });

    res.redirect('/layanan?notif=Layanan+berhasil+ditambahkan&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal menambah data:', err.message);
    res.redirect(`/layanan?notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * POST /layanan/update/:id — Form submission fallback untuk update layanan
 */
exports.formUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, kategori, deskripsi, hargaMulaiDari, estimasiMenit, tersedia } = req.body;

    await LayananModel.update(id, {
      nama: String(nama).trim(),
      kategori: kategori ? String(kategori).trim() : 'Perawatan',
      deskripsi: deskripsi ? String(deskripsi).trim() : '',
      hargaMulaiDari: parseInt(hargaMulaiDari, 10) || 0,
      estimasiMenit: parseInt(estimasiMenit, 10) || 30,
      tersedia: Boolean(tersedia === 'true' || tersedia === 'on' || tersedia === true),
    });

    res.redirect('/layanan?notif=Layanan+berhasil+diperbarui&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal memperbarui data:', err.message);
    res.redirect(`/layanan?notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * POST /layanan/delete/:id — Form submission fallback untuk hapus layanan
 */
exports.formHapus = async (req, res) => {
  try {
    const { id } = req.params;
    await LayananModel.delete(id);
    res.redirect('/layanan?notif=Layanan+berhasil+dihapus&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal menghapus data:', err.message);
    res.redirect(`/layanan?notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};
