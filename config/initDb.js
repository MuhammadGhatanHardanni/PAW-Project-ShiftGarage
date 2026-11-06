/**
 * config/initDb.js
 * Inisialisasi Database & Tabel PostgreSQL untuk Shift Garage
 *
 * Fitur:
 * - Memeriksa keberadaan database 'shift_garage' (jika belum ada, dibuat otomatis).
 * - Membuat tabel 'layanan' jika belum ada.
 * - Memasukkan data awal (seeding) sesuai data minggu sebelumnya jika tabel masih kosong.
 */

require('dotenv').config();
const { Client, Pool } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const targetDb = process.env.DB_NAME || 'shift_garage';

const dataAwal = [
  {
    id: 'L-01',
    nama: 'Servis Rutin',
    kategori: 'Perawatan',
    deskripsi: 'Ganti oli, cek rantai, bersihkan filter udara, setel karburator.',
    hargaMulaiDari: 75000,
    estimasiMenit: 60,
    tersedia: true,
  },
  {
    id: 'L-02',
    nama: 'Tune-Up Injeksi',
    kategori: 'Perawatan',
    deskripsi: 'Reset ECU, injector cleaning, throttle body service, scan diagnosis.',
    hargaMulaiDari: 150000,
    estimasiMenit: 90,
    tersedia: true,
  },
  {
    id: 'L-03',
    nama: 'Ganti Ban',
    kategori: 'Penggantian Suku Cadang',
    deskripsi: 'Bongkar pelek, pasang ban baru (ban tidak termasuk), balancing.',
    hargaMulaiDari: 50000,
    estimasiMenit: 45,
    tersedia: true,
  },
  {
    id: 'L-04',
    nama: 'Servis Rem',
    kategori: 'Keselamatan',
    deskripsi: 'Cek kanvas rem, setel jarak bebas, bersihkan kaliper (disc brake).',
    hargaMulaiDari: 85000,
    estimasiMenit: 60,
    tersedia: true,
  },
  {
    id: 'L-05',
    nama: 'Overhaul Mesin Ringan',
    kategori: 'Perbaikan Besar',
    deskripsi: 'Bongkar kepala silinder, ganti seal klep, skur klep, gasket.',
    hargaMulaiDari: 450000,
    estimasiMenit: 240,
    tersedia: true,
  },
  {
    id: 'L-06',
    nama: 'Diagnosa Awal (AI)',
    kategori: 'Diagnosis',
    deskripsi: 'Estimasi awal penyebab kerusakan melalui Asisten AI sebelum datang ke bengkel.',
    hargaMulaiDari: 0,
    estimasiMenit: 5,
    tersedia: true,
  },
];

async function initializeDatabase() {
  // 1. Cek / Buat Database target
  const rootClient = new Client({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    const checkDb = await rootClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );

    if (checkDb.rows.length === 0) {
      console.log(`\x1b[33m[DB Init]\x1b[0m Database "${targetDb}" belum ada, membuat baru...`);
      // CREATE DATABASE tidak dapat menggunakan parameterized query
      await rootClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`\x1b[32m[DB Init]\x1b[0m Database "${targetDb}" berhasil dibuat.`);
    }
  } catch (err) {
    console.warn(`\x1b[33m[DB Init Warning]\x1b[0m Tidak dapat memverifikasi/membuat database di root client: ${err.message}`);
  } finally {
    try {
      await rootClient.end();
    } catch (_) {}
  }

  // 2. Hubungkan ke database target & buat tabel
  const pool = new Pool({
    ...dbConfig,
    database: targetDb,
  });

  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS layanan (
        id VARCHAR(20) PRIMARY KEY,
        nama VARCHAR(150) NOT NULL,
        kategori VARCHAR(100) NOT NULL,
        deskripsi TEXT,
        harga_mulai_dari INT NOT NULL DEFAULT 0,
        estimasi_menit INT NOT NULL DEFAULT 0,
        tersedia BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createTableQuery);
    console.log('\x1b[32m[DB Init]\x1b[0m Tabel "layanan" siap.');

    // 3. Cek apakah ada data awal (seeding)
    const countRes = await pool.query('SELECT COUNT(*) FROM layanan');
    const totalData = parseInt(countRes.rows[0].count, 10);

    if (totalData === 0) {
      console.log('\x1b[33m[DB Init]\x1b[0m Tabel "layanan" masih kosong. Memasukkan data awal (seeding)...');
      for (const item of dataAwal) {
        await pool.query(
          `INSERT INTO layanan (id, nama, kategori, deskripsi, harga_mulai_dari, estimasi_menit, tersedia)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [item.id, item.nama, item.kategori, item.deskripsi, item.hargaMulaiDari, item.estimasiMenit, item.tersedia]
        );
      }
      console.log(`\x1b[32m[DB Init]\x1b[0m Berhasil menyisipkan ${dataAwal.length} data awal layanan bengkel.`);
    } else {
      console.log(`\x1b[32m[DB Init]\x1b[0m Data awal sudah ada (${totalData} baris).`);
    }

    return true;
  } catch (err) {
    console.error('\x1b[31m[DB Init Error]\x1b[0m Gagal menginisialisasi tabel layanan:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

// Jika dijalankan langsung: `node config/initDb.js`
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('\x1b[32m[DB Init]\x1b[0m Inisialisasi database selesai dengan sukses!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\x1b[31m[DB Init]\x1b[0m Terjadi kesalahan saat inisialisasi:', err.message);
      process.exit(1);
    });
}

module.exports = initializeDatabase;

