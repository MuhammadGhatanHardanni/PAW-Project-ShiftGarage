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
  const result = await db.query(
    "SELECT id FROM layanan WHERE id LIKE 'L-%' ORDER BY id DESC LIMIT 1"
  );
  if (result.rows.length === 0) {
    return 'L-01';
  }
  const lastId = result.rows[0].id; // misal "L-06"
  const numberPart = parseInt(lastId.replace(/\D/g, ''), 10);
  if (isNaN(numberPart)) {
    return `L-${Date.now().toString().slice(-4)}`;
  }
  const nextNum = String(numberPart + 1).padStart(2, '0');
  return `L-${nextNum}`;
}

const LayananModel = {
  /**
   * Mengambil semua data layanan dari database
   */
  async getAll() {
    const result = await db.query(
      'SELECT * FROM layanan ORDER BY id ASC'
    );
    return result.rows.map(formatLayanan);
  },

  /**
   * Mencari layanan berdasarkan ID
   */
  async getById(id) {
    const result = await db.query(
      'SELECT * FROM layanan WHERE id = $1 LIMIT 1',
      [id]
    );
    if (result.rows.length === 0) return null;
    return formatLayanan(result.rows[0]);
  },

  /**
   * Filter layanan berdasarkan kategori
   */
  async getByKategori(kategori) {
    const result = await db.query(
      'SELECT * FROM layanan WHERE LOWER(kategori) = LOWER($1) ORDER BY id ASC',
      [kategori]
    );
    return result.rows.map(formatLayanan);
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

    const result = await db.query(
      `INSERT INTO layanan (id, nama, kategori, deskripsi, harga_mulai_dari, estimasi_menit, tersedia)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, nama, kategori, deskripsi, hargaMulaiDari, estimasiMenit, tersedia]
    );

    return formatLayanan(result.rows[0]);
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
  },

  /**
   * Menghapus data layanan berdasarkan ID
   */
  async delete(id) {
    const result = await db.query(
      'DELETE FROM layanan WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return null;
    return formatLayanan(result.rows[0]);
  },
};

module.exports = LayananModel;
