/**
 * controllers/homeController.js
 * Menangani halaman web (EJS views) dan aksi web form untuk Shift Garage.
 * Sesuai PRD Shift Garage:
 * - F-01: Dasbor Pesanan Masuk (Incoming Booking)
 * - F-02: Kanban Board Antrean Pit (Menunggu -> Dikerjakan -> Selesai)
 * - F-03: Formulir Reservasi Online & Diagnosis AI Pelanggan
 * - F-04: Digital Receipt & Integrasi WhatsApp
 * - F-05: Asisten AI Admin (Pak Vinsen)
 */

const LayananModel     = require('../models/layananModel');
const BookingModel     = require('../models/bookingModel');
const AntreanModel     = require('../models/antreanModel');
const config           = require('../config');
const { formatRupiah } = require('../utils/formatter');

// In-memory rate limiter untuk cegah bot flooding pada form booking publik
const bookingRateLimitMap = new Map();

function isBookingRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 menit
  const maxRequests = 4; // Maksimal 4 kali submit per 10 menit per IP

  const timestamps = (bookingRateLimitMap.get(ip) || []).filter(t => (now - t) < windowMs);
  if (timestamps.length >= maxRequests) {
    return true;
  }
  timestamps.push(now);
  bookingRateLimitMap.set(ip, timestamps);
  return false;
}

/**
 * GET / — Halaman utama publik Shift Garage (Landing Page, Booking & AI Diagnosis)
 */
exports.index = async (req, res) => {
  try {
    const [layanan, antrean] = await Promise.all([
      LayananModel.getAll(),
      AntreanModel.getAll(),
    ]);

    const bookingSuccess = req.query.booking_success === '1';
    const bookingInfo = bookingSuccess ? {
      id      : req.query.id || 'BK-NEW',
      nama    : req.query.nama || 'Pelanggan',
      motor   : req.query.motor || 'Motor Standar',
      plat    : req.query.plat || '-',
      layanan : req.query.layanan || 'Servis Umum',
      tanggal : req.query.tanggal || new Date().toISOString().split('T')[0],
      jam     : req.query.jam || '10:00 WIB',
    } : null;

    res.render('index', {
      judul        : `${config.appName} — Bengkel Motor Modern & Asisten AI Cerdas`,
      appName      : config.appName,
      bengkelWa    : config.bengkelWa || '6289620012811',
      bengkelWaDisplay: config.bengkelWaDisplay || '+62 896-2001-2811',
      layanan,
      antrean,
      formatRupiah,
      tahun        : new Date().getFullYear(),
      notif        : req.query.notif || null,
      tipeNotif    : req.query.tipe || 'success',
      bookingInfo,
    });
  } catch (err) {
    console.error('[Web Error] Gagal memuat data beranda:', err.message);
    res.status(500).render('index', {
      judul        : `${config.appName} — Bengkel Motor Modern & Asisten AI Cerdas`,
      appName      : config.appName,
      bengkelWa    : config.bengkelWa || '6289620012811',
      bengkelWaDisplay: config.bengkelWaDisplay || '+62 896-2001-2811',
      layanan      : [],
      antrean      : [],
      formatRupiah,
      tahun        : new Date().getFullYear(),
      notif        : 'Gagal memuat beberapa data sistem: ' + err.message,
      tipeNotif    : 'error',
      bookingInfo  : null,
    });
  }
};

/**
 * POST /booking/kirim — Form submission dari pelanggan di Halaman Utama (F-03 / US-05)
 * Dilengkapi Anti-Spam (Honeypot, Rate Limiting, & Regex WhatsApp/Plat Nomor)
 */
exports.formBooking = async (req, res) => {
  try {
    const { bengkel_hp_check, nama, whatsapp, motor, plat, layanan_id, tanggal, jam, keluhan } = req.body;

    // 1. HONEYPOT CHECK: Jika field jebakan diisi bot, redirect tanpa simpan ke DB
    if (bengkel_hp_check && String(bengkel_hp_check).trim() !== '') {
      console.warn('[Security] Bot submission blocked via honeypot from IP:', req.ip);
      return res.redirect('/?notif=Booking+berhasil+terkirim!+Silakan+datang+sesuai+jadwal.&tipe=success#booking');
    }

    // 2. RATE LIMITING CHECK (Maks 4 booking per 10 menit per IP)
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    if (isBookingRateLimited(clientIp)) {
      return res.redirect('/?notif=Terlalu+banyak+permintaan+booking+dari+perangkat+ini.+Mohon+tunggu+beberapa+menit+atau+hubungi+langsung+WhatsApp+Pak+Vinsen.&tipe=error#booking');
    }

    // 3. VALIDASI WAJIB ISI
    if (!nama || !whatsapp || !motor || !plat) {
      return res.redirect('/?notif=Nama,+Nomor+WhatsApp,+Model+Motor,+dan+Nomor+Plat+wajib+diisi!&tipe=error#booking');
    }

    const cleanNama = String(nama).trim();
    const cleanMotor = String(motor).trim();
    const cleanPlat = String(plat).trim().toUpperCase();

    if (cleanNama.length < 3) {
      return res.redirect('/?notif=Nama+pemilik+motor+minimal+3+karakter&tipe=error#booking');
    }
    if (cleanMotor.length < 3) {
      return res.redirect('/?notif=Model+motor+minimal+3+karakter+(contoh:+Honda+Vario+160)&tipe=error#booking');
    }

    // 4. VALIDASI NOMOR WHATSAPP (Wajib format Indonesia 08xxx atau 628xxx, 10-14 digit)
    const waDigits = String(whatsapp).replace(/[^0-9]/g, '');
    let formattedWa = waDigits;

    if (waDigits.startsWith('628')) {
      if (waDigits.length < 11 || waDigits.length > 14) {
        return res.redirect('/?notif=Nomor+WhatsApp+tidak+valid.+Panjang+nomor+harus+antara+11-14+digit+(contoh:+081234567890)&tipe=error#booking');
      }
      formattedWa = '08' + waDigits.slice(3);
    } else if (waDigits.startsWith('08')) {
      if (waDigits.length < 10 || waDigits.length > 13) {
        return res.redirect('/?notif=Nomor+WhatsApp+tidak+valid.+Panjang+nomor+harus+antara+10-13+digit&tipe=error#booking');
      }
    } else {
      return res.redirect('/?notif=Nomor+WhatsApp+wajib+diawali+08+atau+628+(contoh:+081234567890)&tipe=error#booking');
    }

    // 5. VALIDASI FORMAT PLAT NOMOR INDONESIA (Minimal 4 karakter, huruf + angka)
    const platPattern = /^[A-Z]{1,2}\s*[0-9]{1,4}\s*[A-Z]{0,3}$/i;
    if (!platPattern.test(cleanPlat) || cleanPlat.length < 4) {
      return res.redirect('/?notif=Format+nomor+plat+tidak+valid+(contoh:+AB+5928+VG)&tipe=error#booking');
    }

    // Cari nama layanan yang dipilih
    let namaLayanan = 'Servis Umum';
    if (layanan_id) {
      const l = await LayananModel.getById(layanan_id);
      if (l) namaLayanan = l.nama;
    }

    // 6. SIMPAN SEBAGAI PESANAN MASUK (Status: menunggu_konfirmasi)
    const newBooking = await BookingModel.create({
      nama_pelanggan : cleanNama,
      no_whatsapp    : formattedWa,
      tipe_motor     : cleanMotor,
      no_polisi      : cleanPlat,
      layanan_id     : layanan_id || null,
      layanan_nama   : namaLayanan,
      tanggal_booking: tanggal || new Date().toISOString().split('T')[0],
      jam_booking    : jam || '10:00 WIB',
      keluhan        : keluhan ? String(keluhan).trim() : 'Pemeriksaan rutin berkala',
    });

    // 7. REDIRECT KE MODAL TWO-WAY WHATSAPP CONFIRMATION
    const q = new URLSearchParams({
      booking_success : '1',
      id              : newBooking.id,
      nama            : newBooking.nama_pelanggan,
      motor           : newBooking.tipe_motor,
      plat            : newBooking.no_polisi,
      layanan         : newBooking.layanan_nama,
      jam             : newBooking.jam_booking,
      tanggal         : newBooking.tanggal_booking,
    });

    res.redirect(`/?${q.toString()}#booking-konfirmasi`);
  } catch (err) {
    console.error('[Web Error] Gagal submit booking:', err.message);
    res.redirect(`/?notif=${encodeURIComponent(err.message)}&tipe=error#booking`);
  }
};

/**
 * GET /admin & GET /layanan — Portal Admin Bengkel Terpadu (Pak Vinsen)
 * Menampilkan: Kanban Antrean Pit, Pesanan Masuk, Katalog Layanan (CRUD), & AI Admin
 */
exports.layanan = async (req, res) => {
  try {
    const [layanan, bookings, antrean] = await Promise.all([
      LayananModel.getAll(),
      BookingModel.getAll(),
      AntreanModel.getAll(),
    ]);

    const activeTab = req.query.tab || 'pos';

    res.render('layanan', {
      judul        : `Portal Admin — ${config.appName}`,
      appName      : config.appName,
      layanan,
      bookings,
      antrean,
      activeTab,
      formatRupiah,
      tahun        : new Date().getFullYear(),
      notif        : req.query.notif || null,
      tipeNotif    : req.query.tipe || 'success',
    });
  } catch (err) {
    console.error('[Web Error] Gagal memuat portal admin:', err.message);
    res.status(500).render('layanan', {
      judul        : `Portal Admin — ${config.appName}`,
      appName      : config.appName,
      layanan      : [],
      bookings     : [],
      antrean      : [],
      activeTab    : 'pos',
      formatRupiah,
      tahun        : new Date().getFullYear(),
      notif        : 'Gagal mengambil data dari database: ' + err.message,
      tipeNotif    : 'error',
    });
  }
};

/**
 * POST /admin/booking/terima/:id — Admin menerima pesanan masuk & masukkan ke antrean pit (US-01)
 */
exports.terimaBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await BookingModel.getById(id);

    if (!booking) {
      return res.redirect('/admin?tab=pesanan&notif=Pesanan+tidak+ditemukan&tipe=error');
    }

    // Ubah status booking
    await BookingModel.updateStatus(id, 'diterima_antrean');

    // Cari estimasi harga layanan jika ada
    let estimasiBiaya = 75000;
    if (booking.layanan_id) {
      const l = await LayananModel.getById(booking.layanan_id);
      if (l) estimasiBiaya = l.hargaMulaiDari || l.harga_mulai_dari || 75000;
    }

    // Masukkan ke Antrean Pit
    await AntreanModel.create({
      nama_pelanggan : booking.nama_pelanggan,
      no_whatsapp    : booking.no_whatsapp,
      tipe_motor     : booking.tipe_motor,
      no_polisi      : booking.no_polisi,
      layanan_nama   : booking.layanan_nama,
      biaya          : estimasiBiaya,
      pit_nomor      : 'Pit 1',
      mekanik        : 'Pak Vinsen',
      status         : 'menunggu',
      catatan_servis : booking.keluhan || 'Pesanan online',
    });

    res.redirect('/admin?tab=kanban&notif=Pesanan+berhasil+diterima+dan+masuk+ke+Antrean+Pit!&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal menerima booking:', err.message);
    res.redirect(`/admin?tab=pesanan&notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * POST /admin/booking/tolak/:id — Admin menolak/membatalkan pesanan booking yang dicurigai spam
 */
exports.tolakBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await BookingModel.getById(id);

    if (!booking) {
      return res.redirect('/admin?tab=pesanan&notif=Pesanan+tidak+ditemukan&tipe=error');
    }

    await BookingModel.updateStatus(id, 'dibatalkan');
    res.redirect('/admin?tab=pesanan&notif=Pesanan+' + id + '+telah+dibatalkan/ditolak.&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal tolak booking:', err.message);
    res.redirect(`/admin?tab=pesanan&notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * POST /admin/booking/hapus/:id — Admin menghapus permanen data pesanan fiktif/spam
 */
exports.hapusBooking = async (req, res) => {
  try {
    const { id } = req.params;
    await BookingModel.delete(id);
    res.redirect('/admin?tab=pesanan&notif=Data+booking+' + id + '+berhasil+dihapus+permanen.&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal hapus booking:', err.message);
    res.redirect(`/admin?tab=pesanan&notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * POST /admin/antrean/status/:id — Update status kartu Kanban (US-02)
 */
exports.updateStatusAntrean = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, biaya, catatan } = req.body;

    if (biaya !== undefined || catatan !== undefined) {
      await AntreanModel.updateBiaya(id, biaya, catatan);
    }

    if (status) {
      await AntreanModel.updateStatus(id, status);
    }

    res.redirect('/admin?tab=kanban&notif=Status+antrean+pit+berhasil+diperbarui&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal update status antrean:', err.message);
    res.redirect(`/admin?tab=kanban&notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * POST /admin/antrean/tambah-manual — Tambah Antrean Walk-in Manual (PRD Mitigasi Risiko 9)
 */
exports.tambahAntreanManual = async (req, res) => {
  try {
    const { nama, whatsapp, motor, plat, layanan, biaya, pit, catatan } = req.body;

    if (!nama || !motor) {
      return res.redirect('/admin?tab=kanban&notif=Nama+dan+tipe+motor+wajib+diisi&tipe=error');
    }

    await AntreanModel.create({
      nama_pelanggan : String(nama).trim() + ' (Walk-in)',
      no_whatsapp    : whatsapp ? String(whatsapp).trim() : '-',
      tipe_motor     : String(motor).trim(),
      no_polisi      : plat ? String(plat).trim().toUpperCase() : '-',
      layanan_nama   : layanan || 'Servis Cepat',
      biaya          : parseInt(biaya, 10) || 75000,
      pit_nomor      : pit || 'Pit 1',
      mekanik        : 'Pak Vinsen',
      status         : 'menunggu',
      catatan_servis : catatan ? String(catatan).trim() : 'Pelanggan langsung datang ke bengkel',
    });

    res.redirect('/admin?tab=kanban&notif=Antrean+manual+walk-in+berhasil+ditambahkan+ke+Pit!&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal tambah antrean manual:', err.message);
    res.redirect(`/admin?tab=kanban&notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * POST /admin/antrean/hapus/:id — Hapus kartu antrean pit
 */
exports.hapusAntrean = async (req, res) => {
  try {
    const { id } = req.params;
    await AntreanModel.delete(id);
    res.redirect('/admin?tab=kanban&notif=Kartu+antrean+berhasil+dihapus&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal hapus antrean:', err.message);
    res.redirect(`/admin?tab=kanban&notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * POST /layanan/tambah — Tambah layanan katalog ke PostgreSQL (CRUD)
 */
exports.formTambah = async (req, res) => {
  try {
    const { nama, kategori, deskripsi, hargaMulaiDari, estimasiMenit, tersedia, id } = req.body;
    if (!nama || String(nama).trim() === '') {
      return res.redirect('/admin?tab=katalog&notif=Nama+layanan+wajib+diisi&tipe=error');
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

    res.redirect('/admin?tab=katalog&notif=Layanan+baru+berhasil+ditambahkan+ke+database&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal menambah data:', err.message);
    res.redirect(`/admin?tab=katalog&notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * POST /layanan/update/:id — Update layanan katalog di PostgreSQL (CRUD)
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

    res.redirect('/admin?tab=katalog&notif=Data+layanan+berhasil+diperbarui&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal memperbarui data:', err.message);
    res.redirect(`/admin?tab=katalog&notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * POST /layanan/delete/:id — Hapus layanan katalog di PostgreSQL (CRUD)
 */
exports.formHapus = async (req, res) => {
  try {
    const { id } = req.params;
    await LayananModel.delete(id);
    res.redirect('/admin?tab=katalog&notif=Layanan+berhasil+dihapus+dari+database&tipe=success');
  } catch (err) {
    console.error('[Web Error] Gagal menghapus data:', err.message);
    res.redirect(`/admin?tab=katalog&notif=${encodeURIComponent(err.message)}&tipe=error`);
  }
};

/**
 * ─── HELPER & AUTHENTICATION STAF BENGKEL (PAK VINSEN) ────────────────────────
 */

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
      }
    });
  }
  return list;
}

/**
 * Middleware untuk memproteksi halaman dan rute admin
 */
exports.authAdminMiddleware = (req, res, next) => {
  const cookies = parseCookies(req);
  if (cookies.sg_admin_auth === 'vinsen_authenticated') {
    return next();
  }
  return res.redirect('/admin/login?notif=Akses+khusus+staf+bengkel.+Silakan+masuk+terlebih+dahulu.&tipe=warning');
};

/**
 * GET /admin/login — Tampilan Login Khusus Staf / Mekanik
 */
exports.adminLogin = (req, res) => {
  const cookies = parseCookies(req);
  if (cookies.sg_admin_auth === 'vinsen_authenticated') {
    return res.redirect('/admin');
  }
  res.render('admin-login', {
    judul     : `Login Staf Bengkel — ${config.appName}`,
    appName   : config.appName,
    notif     : req.query.notif || null,
    tipeNotif : req.query.tipe || 'info',
  });
};

/**
 * POST /admin/login — Proses verifikasi kredensial staf
 */
exports.adminAuthProcess = (req, res) => {
  const { username, password } = req.body;
  const user = String(username || '').trim().toLowerCase();
  const pass = String(password || '').trim();

  // Kredensial staf bengkel Pak Vinsen
  if ((user === 'admin' || user === 'vinsen') && (pass === 'bengkel123' || pass === 'admin' || pass === '1234')) {
    res.setHeader('Set-Cookie', 'sg_admin_auth=vinsen_authenticated; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax');
    return res.redirect('/admin?notif=Selamat+datang+kembali,+Pak+Vinsen!&tipe=success');
  }

  res.redirect('/admin/login?notif=Username+atau+password+salah!+Gunakan+admin+/+bengkel123&tipe=error');
};

/**
 * GET /admin/logout — Keluar dari portal admin
 */
exports.adminLogout = (req, res) => {
  res.setHeader('Set-Cookie', 'sg_admin_auth=; Path=/; HttpOnly; Max-Age=0');
  res.redirect('/admin/login?notif=Anda+telah+berhasil+keluar+dari+Portal+Admin.&tipe=success');
};

/**
 * GET /api/antrean/cek/:plat — Endpoint Lacak Status Motor Pelanggan Realtime
 */
exports.cekStatusPlat = async (req, res) => {
  try {
    const rawPlat = String(req.params.plat || req.query.plat || '').replace(/[\s\-_.]/g, '').toUpperCase();
    if (!rawPlat || rawPlat.length < 2) {
      return res.status(400).json({ sukses: false, pesan: 'Nomor plat motor tidak valid atau terlalu pendek.' });
    }

    const [antrean, bookings] = await Promise.all([
      AntreanModel.getAll(),
      BookingModel.getAll(),
    ]);

    // 1. Cek di Kanban Antrean Pit terlebih dahulu
    const matchAntrean = antrean.find((a) => {
      const p = String(a.no_polisi || '').replace(/[\s\-_.]/g, '').toUpperCase();
      return p && (p === rawPlat || p.includes(rawPlat) || rawPlat.includes(p));
    });

    if (matchAntrean) {
      return res.json({
        sukses: true,
        lokasi: 'pit',
        data: {
          id: matchAntrean.id,
          nama: matchAntrean.nama_pelanggan,
          tipeMotor: matchAntrean.tipe_motor,
          plat: matchAntrean.no_polisi,
          layanan: matchAntrean.layanan_nama,
          pit: matchAntrean.pit_nomor || 'Pit 1',
          mekanik: matchAntrean.mekanik || 'Pak Vinsen',
          status: matchAntrean.status, // 'menunggu' | 'dikerjakan' | 'selesai'
          biaya: matchAntrean.biaya || 0,
          catatan: matchAntrean.catatan_servis || 'Sedang dalam penanganan mekanik',
        },
      });
    }

    // 2. Cek di Pesanan Masuk (Booking) yang belum masuk ke Pit
    const matchBooking = bookings.find((b) => {
      const p = String(b.no_polisi || '').replace(/[\s\-_.]/g, '').toUpperCase();
      return p && (p === rawPlat || p.includes(rawPlat) || rawPlat.includes(p));
    });

    if (matchBooking) {
      return res.json({
        sukses: true,
        lokasi: 'booking',
        data: {
          id: matchBooking.id,
          nama: matchBooking.nama_pelanggan,
          tipeMotor: matchBooking.tipe_motor,
          plat: matchBooking.no_polisi,
          layanan: matchBooking.layanan_nama,
          status: matchBooking.status === 'diterima_antrean' ? 'diterima' : 'menunggu_konfirmasi',
          jadwal: `${matchBooking.tanggal_booking} &bull; ${matchBooking.jam_booking}`,
          catatan: matchBooking.keluhan || 'Pemeriksaan umum',
        },
      });
    }

    return res.status(404).json({
      sukses: false,
      pesan: `Tidak ditemukan status servis aktif untuk nomor plat "${req.params.plat}". Pastikan nomor plat sudah didaftarkan saat booking.`,
    });
  } catch (err) {
    return res.status(500).json({ sukses: false, pesan: 'Terjadi kendala saat memeriksa status: ' + err.message });
  }
};

