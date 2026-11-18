/**
 * models/layananModel.js
 * Model data layanan servis bengkel terhubung langsung ke PostgreSQL.
 * Seluruh query database dikelola di sini agar Controller tetap bersih (MVC).
 */

const db = require('../config/database');

/**
 * Normalisasi data baris dari PostgreSQL ke format seragam
 * Menyediakan baik properti camelCase maupun snake_case agar kompatibel
 */
function formatLayanan(row) {
  if (!row) return null;
  const harga = Number(row.harga_mulai_dari) || 0;
  const estimasi = Number(row.estimasi_menit) || 0;
  const tersedia = row.tersedia === true || row.tersedia === 'true' || row.tersedia === 1 || row.tersedia === 't';

  return {
    id: row.id,
    nama: row.nama,
    kategori: row.kategori,
    deskripsi: row.deskripsi || '',
    hargaMulaiDari: harga,
    harga_mulai_dari: harga,
    estimasiMenit: estimasi,
    estimasi_menit: estimasi,
    tersedia,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Buat ID baru otomatis jika tidak disediakan (format: L-01, L-02, dst)
 */
async function generateId() {
  try {
    const result = await db.query(
      "SELECT id FROM layanan WHERE id LIKE 'L-%' ORDER BY id DESC LIMIT 1"
    );
    if (result && result.rows && result.rows.length > 0) {
      const lastId = result.rows[0].id; // misal "L-06"
      const numberPart = parseInt(lastId.replace(/\D/g, ''), 10);
      if (!isNaN(numberPart)) {
        return `L-${String(numberPart + 1).padStart(2, '0')}`;
      }
    }
  } catch (err) {
    // Fallback jika database sedang offline
  }
  const nextNum = String(fallbackLayanan.length + 1).padStart(2, '0');
  return `L-${nextNum}`;
}

const fallbackLayanan = [
  { id: 'L-01', nama: 'Servis Rutin', kategori: 'Perawatan', deskripsi: 'Ganti oli mesin, cek filter udara, setel rantai roda & rem, periksa kelistrikan umum.', hargaMulaiDari: 75000, estimasiMenit: 35, tersedia: true },
  { id: 'L-02', nama: 'Tune-Up Injeksi Komplit', kategori: 'Perawatan', deskripsi: 'Pembersihan throttle body ultrasonik, infus injector cleaner, scan scanner OBD2 & reset TPS.', hargaMulaiDari: 150000, estimasiMenit: 45, tersedia: true },
  { id: 'L-03', nama: 'Servis CVT & Ganti Roller', kategori: 'Transmisi', deskripsi: 'Bongkar pulley depan belakang, pembersihan debu kampas ganda, cek v-belt & gemuk CVT anti-gredek.', hargaMulaiDari: 85000, estimasiMenit: 40, tersedia: true },
  { id: 'L-04', nama: 'Servis Rem Depan & Belakang', kategori: 'Pengereman', deskripsi: 'Kuras minyak rem DOT 4, pembersihan kaliper rem, cek piringan cakram & ganti kampas rem baru.', hargaMulaiDari: 65000, estimasiMenit: 30, tersedia: true },
  { id: 'L-05', nama: 'Ganti Oli & Pelumas Transmisi', kategori: 'Pelumas', deskripsi: 'Penggantian oli mesin Shell Advance / Motul dan oli gardan matic resmi.', hargaMulaiDari: 55000, estimasiMenit: 20, tersedia: true },
  { id: 'L-06', nama: 'Overhaul Mesin & Ganti Seher', kategori: 'Perbaikan Berat', deskripsi: 'Turun mesin total, bubut korter blok silinder, skir klep, ganti piston kit & paking mesin.', hargaMulaiDari: 450000, estimasiMenit: 180, tersedia: true },
  { id: 'L-07', nama: 'Diagnosis Kelistrikan & Reset ECU', kategori: 'Diagnosis', deskripsi: 'Cek voltase aki, spul pengisian, kiprok regulator, perbaikan kabel bodi & reset kode MIL.', hargaMulaiDari: 95000, estimasiMenit: 45, tersedia: true }
];

const LayananModel = {
  /**
   * Mengambil semua data layanan dari database
   * Dilengkapi sanitasi otomatis: menghapus entri rusak/promosi AI yang terlalu panjang
   */
  async getAll() {
    try {
      const result = await db.query(
        'SELECT * FROM layanan ORDER BY id ASC'
      );
      if (result && result.rows && result.rows.length > 0) {
        const cleanRows = [];
        for (const row of result.rows) {
          // Deteksi entri abnormal/sampah dari AI terdahulu
          if (row.nama && (row.nama.length > 80 || /caption|promosi|whatsapp.*promo/i.test(row.nama))) {
            // Hapus otomatis di database PostgreSQL
            db.query('DELETE FROM layanan WHERE id = $1', [row.id]).catch(() => {});
          } else {
            cleanRows.push(row);
          }
        }
        return cleanRows.map(formatLayanan);
      }
    } catch (err) {
      // Fallback fallback data jika database sedang offline
    }
    return fallbackLayanan
      .filter(l => l.nama && l.nama.length <= 80 && !/caption|promosi|whatsapp.*promo/i.test(l.nama))
      .map(formatLayanan);
  },

  /**
   * Mencari layanan berdasarkan ID
   */
  async getById(id) {
    try {
      const result = await db.query(
        'SELECT * FROM layanan WHERE id = $1 LIMIT 1',
        [id]
      );
      if (result && result.rows.length > 0) return formatLayanan(result.rows[0]);
    } catch (err) {
      // Fallback
    }
    const found = fallbackLayanan.find(l => l.id.toLowerCase() === String(id).toLowerCase());
    return found ? formatLayanan(found) : null;
  },

  /**
   * Filter layanan berdasarkan kategori
   */
  async getByKategori(kategori) {
    try {
      const result = await db.query(
        'SELECT * FROM layanan WHERE LOWER(kategori) = LOWER($1) ORDER BY id ASC',
        [kategori]
      );
      if (result && result.rows.length > 0) return result.rows.map(formatLayanan);
    } catch (err) {
      // Fallback
    }
    return fallbackLayanan.filter(l => l.kategori.toLowerCase() === String(kategori).toLowerCase()).map(formatLayanan);
  },

  /**
   * Menambahkan data layanan baru
   */
  async create(data) {
    let id = data.id && String(data.id).trim() !== '' ? String(data.id).trim() : await generateId();
    const nama = data.nama;
    const kategori = data.kategori || 'Umum';
    const deskripsi = data.deskripsi || '';
    const hargaMulaiDari = parseInt(data.hargaMulaiDari ?? data.harga_mulai_dari, 10) || 0;
    const estimasiMenit = parseInt(data.estimasiMenit ?? data.estimasi_menit, 10) || 0;
    const tersedia = data.tersedia === undefined ? true : Boolean(data.tersedia && data.tersedia !== 'false');

    try {
      const result = await db.query(
        `INSERT INTO layanan (id, nama, kategori, deskripsi, harga_mulai_dari, estimasi_menit, tersedia)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, nama, kategori, deskripsi, hargaMulaiDari, estimasiMenit, tersedia]
      );
      return formatLayanan(result.rows[0]);
    } catch (err) {
      // In-memory fallback
      const newItem = { id, nama, kategori, deskripsi, harga_mulai_dari: hargaMulaiDari, estimasi_menit: estimasiMenit, tersedia };
      fallbackLayanan.push(newItem);
      return formatLayanan(newItem);
    }
  },

  /**
   * Memperbarui data layanan berdasarkan ID
   */
  async update(id, data) {
    // Ambil data lama terlebih dahulu
    const existing = await this.getById(id);
    if (!existing) return null;

    const nama = data.nama !== undefined ? data.nama : existing.nama;
    const kategori = data.kategori !== undefined ? data.kategori : existing.kategori;
    const deskripsi = data.deskripsi !== undefined ? data.deskripsi : existing.deskripsi;
    const hargaMulaiDari = data.hargaMulaiDari !== undefined || data.harga_mulai_dari !== undefined
      ? parseInt(data.hargaMulaiDari ?? data.harga_mulai_dari, 10)
      : existing.hargaMulaiDari;
    const estimasiMenit = data.estimasiMenit !== undefined || data.estimasi_menit !== undefined
      ? parseInt(data.estimasiMenit ?? data.estimasi_menit, 10)
      : existing.estimasiMenit;
    const tersedia = data.tersedia !== undefined
      ? Boolean(data.tersedia === true || data.tersedia === 'true' || data.tersedia === 1)
      : existing.tersedia;

    try {
      const result = await db.query(
        `UPDATE layanan
         SET nama = $1,
             kategori = $2,
             deskripsi = $3,
             harga_mulai_dari = $4,
             estimasi_menit = $5,
             tersedia = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [nama, kategori, deskripsi, hargaMulaiDari, estimasiMenit, tersedia, id]
      );
      return formatLayanan(result.rows[0]);
    } catch (err) {
      // In-memory fallback
      const idx = fallbackLayanan.findIndex(l => l.id.toLowerCase() === String(id).toLowerCase());
      if (idx !== -1) {
        fallbackLayanan[idx] = { ...fallbackLayanan[idx], nama, kategori, deskripsi, harga_mulai_dari: hargaMulaiDari, estimasi_menit: estimasiMenit, tersedia };
        return formatLayanan(fallbackLayanan[idx]);
      }
      return existing;
    }
  },

  /**
   * Menghapus data layanan berdasarkan ID
   */
  async delete(id) {
    try {
      const result = await db.query(
        'DELETE FROM layanan WHERE id = $1 RETURNING *',
        [id]
      );
      if (result.rows.length > 0) return formatLayanan(result.rows[0]);
    } catch (err) {
      // In-memory fallback
    }
    const idx = fallbackLayanan.findIndex(l => l.id.toLowerCase() === String(id).toLowerCase());
    if (idx !== -1) {
      const deleted = fallbackLayanan.splice(idx, 1);
      return formatLayanan(deleted[0]);
    }
    return null;
  },
};

module.exports = LayananModel;
