/**
 * models/layananModel.js
 * Data layanan servis bengkel (statis — tanpa database).
 * Sesuai PRD Shift Garage: mengelola jadwal servis dan informasi layanan.
 */

const daftarLayanan = [
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

const LayananModel = {
  /** Kembalikan semua layanan */
  getAll() {
    return daftarLayanan;
  },

  /** Cari layanan berdasarkan id */
  getById(id) {
    return daftarLayanan.find((l) => l.id === id) || null;
  },

  /** Filter layanan berdasarkan kategori */
  getByKategori(kategori) {
    return daftarLayanan.filter(
      (l) => l.kategori.toLowerCase() === kategori.toLowerCase()
    );
  },
};

module.exports = LayananModel;

