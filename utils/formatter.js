/**
 * utils/formatter.js
 * Fungsi pembantu yang dapat dipakai ulang di seluruh aplikasi.
 */

/**
 * Format angka ke format mata uang Rupiah.
 * @param {number} angka
 * @returns {string}  contoh: "Rp 75.000"
 */
const formatRupiah = (angka) =>
  'Rp ' + Number(angka).toLocaleString('id-ID');

/**
 * Format tanggal ISO ke string lokal Bahasa Indonesia.
 * @param {string|Date} tanggal
 * @returns {string}
 */
const formatTanggal = (tanggal) =>
  new Date(tanggal).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

/**
 * Kembalikan timestamp ISO sekarang.
 * @returns {string}
 */
const sekarang = () => new Date().toISOString();

module.exports = { formatRupiah, formatTanggal, sekarang };

