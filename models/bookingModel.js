/**
 * models/bookingModel.js
 * Model untuk mengelola Pesanan Masuk (Incoming Booking) dari pelanggan.
 * Sesuai PRD Shift Garage: F-01 & US-01 (M-01 & M-02).
 * Mendukung persistensi PostgreSQL dengan fallback in-memory store yang aman.
 */

const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const bookingsFile = path.join(dataDir, 'bookings.json');

// Pastikan folder data/ tersedia untuk persistensi lokal
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory store awal (fallback & sinkronisasi)
let inMemoryBookings = [
  {
    id: 'BK-04',
    nama_pelanggan: 'Asep',
    no_whatsapp: '089620012811',
    tipe_motor: 'Honda Vario 160',
    no_polisi: 'AB 7777 AA',
    layanan_id: 'L-01',
    layanan_nama: 'Servis Rutin',
    tanggal_booking: new Date().toISOString().split('T')[0],
    jam_booking: '10:00 WIB',
    keluhan: 'Servis rutin berkala & ganti oli',
    status: 'menunggu_konfirmasi',
    created_at: new Date(),
  },
  {
    id: 'BK-01',
    nama_pelanggan: 'Budi Santoso',
    no_whatsapp: '081234567890',
    tipe_motor: 'Honda Vario 160 (AB 4521 XG)',
    no_polisi: 'AB 4521 XG',
    layanan_id: 'L-02',
    layanan_nama: 'Tune-Up Injeksi & CVT',
    tanggal_booking: new Date().toISOString().split('T')[0],
    jam_booking: '10:00 WIB',
    keluhan: 'Tarikan awal bergetar (gredek) dan akselerasi loyo saat di tanjakan.',
    status: 'menunggu_konfirmasi', // 'menunggu_konfirmasi' | 'diterima_antrean' | 'dibatalkan'
    created_at: new Date(Date.now() - 35 * 60 * 1000),
  },
  {
    id: 'BK-02',
    nama_pelanggan: 'Siti Rahayu',
    no_whatsapp: '085712349988',
    tipe_motor: 'Yamaha NMAX 155 (AB 2890 YT)',
    no_polisi: 'AB 2890 YT',
    layanan_id: 'L-01',
    layanan_nama: 'Servis Rutin & Ganti Oli',
    tanggal_booking: new Date().toISOString().split('T')[0],
    jam_booking: '11:30 WIB',
    keluhan: 'Sudah telat ganti oli 2 bulan, rem belakang ada bunyi berdecit saat hujan.',
    status: 'menunggu_konfirmasi',
    created_at: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: 'BK-03',
    nama_pelanggan: 'Dimas Saputra',
    no_whatsapp: '087890123456',
    tipe_motor: 'Honda Beat FI (AB 3112 QA)',
    no_polisi: 'AB 3112 QA',
    layanan_id: 'L-04',
    layanan_nama: 'Servis Rem Depan & Belakang',
    tanggal_booking: new Date().toISOString().split('T')[0],
    jam_booking: '09:00 WIB',
    keluhan: 'Rem depan terasa dalam dan agak blong saat ditekan mendadak.',
    status: 'diterima_antrean',
    created_at: new Date(Date.now() - 120 * 60 * 1000),
  },
];

// Muat dari file persistent jika ada
if (fs.existsSync(bookingsFile)) {
  try {
    const raw = fs.readFileSync(bookingsFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryBookings = parsed;
    }
  } catch (_) {}
} else {
  // Simpan data awal ke file
  try {
    fs.writeFileSync(bookingsFile, JSON.stringify(inMemoryBookings, null, 2), 'utf8');
  } catch (_) {}
}

function saveBookingsToFile() {
  try {
    fs.writeFileSync(bookingsFile, JSON.stringify(inMemoryBookings, null, 2), 'utf8');
  } catch (_) {}
}

function generateBookingId() {
  const nextNum = inMemoryBookings.length + 1;
  return `BK-${String(nextNum).padStart(2, '0')}`;
}

const BookingModel = {
  /**
   * Ambil semua data booking (pesanan masuk)
   */
  async getAll() {
    try {
      const result = await db.query(
        'SELECT * FROM pesanan_booking ORDER BY created_at DESC'
      );
      if (result && result.rows && result.rows.length > 0) {
        return result.rows;
      }
    } catch (_) {
      // Fallback ke in-memory jika tabel belum siap atau DB offline
    }
    return inMemoryBookings;
  },

  /**
   * Ambil booking berdasarkan status (misal: 'menunggu_konfirmasi')
   */
  async getByStatus(status) {
    const all = await this.getAll();
    return all.filter((b) => b.status === status);
  },

  /**
   * Cari booking berdasarkan ID
   */
  async getById(id) {
    const all = await this.getAll();
    return all.find((b) => b.id === id) || null;
  },

  /**
   * Tambah booking baru dari formulir online pelanggan
   */
  async create(data) {
    const id = data.id || generateBookingId();
    const newBooking = {
      id,
      nama_pelanggan: data.nama_pelanggan || data.nama || 'Pelanggan Walk-in',
      no_whatsapp: data.no_whatsapp || data.whatsapp || '-',
      tipe_motor: data.tipe_motor || data.motor || 'Motor Standar',
      no_polisi: data.no_polisi || data.plat || '-',
      layanan_id: data.layanan_id || null,
      layanan_nama: data.layanan_nama || data.layanan || 'Servis Umum',
      tanggal_booking: data.tanggal_booking || new Date().toISOString().split('T')[0],
      jam_booking: data.jam_booking || '10:00 WIB',
      keluhan: data.keluhan || '-',
      status: 'menunggu_konfirmasi',
      created_at: new Date(),
    };

    inMemoryBookings.unshift(newBooking);

    try {
      await db.query(
        `INSERT INTO pesanan_booking 
         (id, nama_pelanggan, no_whatsapp, tipe_motor, no_polisi, layanan_id, layanan_nama, tanggal_booking, jam_booking, keluhan, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          newBooking.id,
          newBooking.nama_pelanggan,
          newBooking.no_whatsapp,
          newBooking.tipe_motor,
          newBooking.no_polisi,
          newBooking.layanan_id,
          newBooking.layanan_nama,
          newBooking.tanggal_booking,
          newBooking.jam_booking,
          newBooking.keluhan,
          newBooking.status,
          newBooking.created_at,
        ]
      );
    } catch (_) {
      // Disimpan aman di inMemoryBookings
    }

    saveBookingsToFile();
    return newBooking;
  },

  /**
   * Update status booking (misal: 'diterima_antrean' atau 'dibatalkan')
   */
  async updateStatus(id, newStatus) {
    const item = inMemoryBookings.find((b) => b.id === id);
    if (item) {
      item.status = newStatus;
      saveBookingsToFile();
    }

    try {
      await db.query(
        'UPDATE pesanan_booking SET status = $1 WHERE id = $2',
        [newStatus, id]
      );
    } catch (_) { }

    return item;
  },

  /**
   * Hapus booking permanen (misal: spam order atau pesanan fiktif)
   */
  async delete(id) {
    const idx = inMemoryBookings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      inMemoryBookings.splice(idx, 1);
      saveBookingsToFile();
    }

    try {
      await db.query('DELETE FROM pesanan_booking WHERE id = $1', [id]);
    } catch (_) { }

    return true;
  },
};

module.exports = BookingModel;

