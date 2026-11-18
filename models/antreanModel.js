/**
 * models/antreanModel.js
 * Model untuk mengelola Kanban Board Antrean Pit Bengkel (F-02 & US-02).
 * Kolom status: 'menunggu' -> 'dikerjakan' -> 'selesai'.
 * Dilengkapi data digital receipt & integrasi WhatsApp (F-04 & US-03).
 */

const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const antreanFile = path.join(dataDir, 'antrean.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory store awal (fallback & sinkronisasi)
let inMemoryAntrean = [
  {
    id: 'PIT-01',
    nama_pelanggan: 'Dimas Saputra',
    no_whatsapp: '087890123456',
    tipe_motor: 'Honda Beat FI',
    no_polisi: 'AB 3112 QA',
    layanan_nama: 'Servis Rem & Ganti Kampas',
    biaya: 85000,
    pit_nomor: 'Pit 1',
    mekanik: 'Pak Vinsen',
    status: 'menunggu', // 'menunggu' | 'dikerjakan' | 'selesai'
    catatan_servis: 'Cek piringan cakram depan & ganti minyak rem dot 4',
    waktu_masuk: new Date(Date.now() - 40 * 60 * 1000),
    waktu_selesai: null,
  },
  {
    id: 'PIT-02',
    nama_pelanggan: 'Rizky Fauzi (Walk-in)',
    no_whatsapp: '081399887711',
    tipe_motor: 'Honda Scoopy 2022',
    no_polisi: 'AB 6654 KZ',
    layanan_nama: 'Servis Rutin + Pembersihan CVT',
    biaya: 110000,
    pit_nomor: 'Pit 1',
    mekanik: 'Pak Vinsen',
    status: 'dikerjakan',
    catatan_servis: 'Gredek tarikan awal sudah dibersihkan, roller masih bagus',
    waktu_masuk: new Date(Date.now() - 75 * 60 * 1000),
    waktu_selesai: null,
  },
  {
    id: 'PIT-03',
    nama_pelanggan: 'Agus Hendrawan',
    no_whatsapp: '081298765432',
    tipe_motor: 'Yamaha Aerox 155',
    no_polisi: 'AB 1988 PL',
    layanan_nama: 'Tune-Up Injeksi Komplit + Oli Shell Advance',
    biaya: 195000,
    pit_nomor: 'Pit 2',
    mekanik: 'Pak Vinsen',
    status: 'selesai',
    catatan_servis: 'Throttle body di-ultrasonic, reset TPS berhasil, oli baru',
    waktu_masuk: new Date(Date.now() - 140 * 60 * 1000),
    waktu_selesai: new Date(Date.now() - 10 * 60 * 1000),
  },
];

// Muat dari file persistent jika ada
if (fs.existsSync(antreanFile)) {
  try {
    const raw = fs.readFileSync(antreanFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryAntrean = parsed;
    }
  } catch (_) {}
} else {
  try {
    fs.writeFileSync(antreanFile, JSON.stringify(inMemoryAntrean, null, 2), 'utf8');
  } catch (_) {}
}

function saveAntreanToFile() {
  try {
    fs.writeFileSync(antreanFile, JSON.stringify(inMemoryAntrean, null, 2), 'utf8');
  } catch (_) {}
}

function generatePitId() {
  // Cari nomor terbesar dari ID yang sudah ada, bukan dari .length (supaya tidak bentrok setelah delete)
  let maxNum = 0;
  for (const a of inMemoryAntrean) {
    const match = String(a.id).match(/PIT-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `PIT-${String(maxNum + 1).padStart(2, '0')}`;
}

const AntreanModel = {
  /**
   * Mengambil seluruh antrean pit
   */
  async getAll() {
    try {
      const result = await db.query(
        'SELECT * FROM antrean_pit ORDER BY waktu_masuk ASC'
      );
      if (result && result.rows && result.rows.length > 0) {
        return result.rows;
      }
    } catch (_) {
      // Fallback in-memory
    }
    return inMemoryAntrean;
  },

  /**
   * Filter antrean berdasarkan status kanban
   */
  async getByStatus(status) {
    const all = await this.getAll();
    return all.filter((a) => a.status === status);
  },

  /**
   * Cari berdasarkan ID
   */
  async getById(id) {
    const all = await this.getAll();
    return all.find((a) => a.id === id) || null;
  },

  /**
   * Tambah antrean baru (bisa dari Pesanan Masuk atau Walk-in Manual)
   */
  async create(data) {
    const id = data.id || generatePitId();
    const newEntry = {
      id,
      nama_pelanggan: data.nama_pelanggan || data.nama || 'Pelanggan Baru',
      no_whatsapp: data.no_whatsapp || data.whatsapp || '-',
      tipe_motor: data.tipe_motor || data.motor || 'Motor Standar',
      no_polisi: data.no_polisi || data.plat || '-',
      layanan_nama: data.layanan_nama || data.layanan || 'Servis Umum',
      biaya: parseInt(data.biaya, 10) || 75000,
      pit_nomor: data.pit_nomor || 'Pit 1',
      mekanik: data.mekanik || 'Pak Vinsen',
      status: data.status || 'menunggu',
      catatan_servis: data.catatan_servis || data.catatan || '',
      waktu_masuk: new Date(),
      waktu_selesai: null,
    };

    inMemoryAntrean.push(newEntry);

    try {
      await db.query(
        `INSERT INTO antrean_pit 
         (id, nama_pelanggan, no_whatsapp, tipe_motor, no_polisi, layanan_nama, biaya, pit_nomor, mekanik, status, catatan_servis, waktu_masuk)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          newEntry.id,
          newEntry.nama_pelanggan,
          newEntry.no_whatsapp,
          newEntry.tipe_motor,
          newEntry.no_polisi,
          newEntry.layanan_nama,
          newEntry.biaya,
          newEntry.pit_nomor,
          newEntry.mekanik,
          newEntry.status,
          newEntry.catatan_servis,
          newEntry.waktu_masuk,
        ]
      );
    } catch (_) {
      // Disimpan aman di inMemoryAntrean
    }

    saveAntreanToFile();
    return newEntry;
  },

  /**
   * Update status kartu Kanban (misal: 'menunggu' -> 'dikerjakan' -> 'selesai')
   */
  async updateStatus(id, newStatus) {
    const item = inMemoryAntrean.find((a) => a.id === id);
    let waktuSelesai = null;
    if (newStatus === 'selesai') {
      waktuSelesai = new Date();
    }

    if (item) {
      item.status = newStatus;
      if (waktuSelesai) item.waktu_selesai = waktuSelesai;
      saveAntreanToFile();
    }

    try {
      await db.query(
        'UPDATE antrean_pit SET status = $1, waktu_selesai = COALESCE($2, waktu_selesai) WHERE id = $3',
        [newStatus, waktuSelesai, id]
      );
    } catch (_) {}

    return item;
  },

  /**
   * Update rincian biaya / nota digital
   */
  async updateBiaya(id, biaya, catatan) {
    const item = inMemoryAntrean.find((a) => a.id === id);
    if (item) {
      if (biaya !== undefined) item.biaya = parseInt(biaya, 10) || item.biaya;
      if (catatan !== undefined) item.catatan_servis = catatan;
      saveAntreanToFile();
    }

    try {
      await db.query(
        'UPDATE antrean_pit SET biaya = $1, catatan_servis = $2 WHERE id = $3',
        [biaya, catatan, id]
      );
    } catch (_) {}

    return item;
  },

  /**
   * Hapus dari antrean
   */
  async delete(id) {
    inMemoryAntrean = inMemoryAntrean.filter((a) => a.id !== id);
    saveAntreanToFile();
    try {
      await db.query('DELETE FROM antrean_pit WHERE id = $1', [id]);
    } catch (_) {}
    return true;
  },
};

module.exports = AntreanModel;

