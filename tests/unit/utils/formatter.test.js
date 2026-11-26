import { describe, it, expect } from 'vitest';
const { formatRupiah, formatTanggal, sekarang } = require('../../../utils/formatter');

describe('utils/formatter.js', () => {
  describe('formatRupiah', () => {
    it('memformat angka ke mata uang Rupiah dengan benar', () => {
      const hasil = formatRupiah(85000);
      expect(hasil).toBe('Rp 85.000');
    });

    it('memformat angka 0 ke format Rupiah', () => {
      const hasil = formatRupiah(0);
      expect(hasil).toBe('Rp 0');
    });

    it('memformat angka jutaan ke format Rupiah', () => {
      const hasil = formatRupiah(1500000);
      expect(hasil).toBe('Rp 1.500.000');
    });
  });

  describe('formatTanggal', () => {
    it('memformat tanggal ISO ke format lokal Indonesia', () => {
      const iso = '2026-11-20T10:00:00.000Z';
      const hasil = formatTanggal(iso);
      expect(typeof hasil).toBe('string');
      expect(hasil.length).toBeGreaterThan(5);
    });
  });

  describe('sekarang', () => {
    it('mengembalikan string ISO timestamp valid', () => {
      const timestamp = sekarang();
      expect(typeof timestamp).toBe('string');
      expect(new Date(timestamp).toString()).not.toBe('Invalid Date');
    });
  });
});
