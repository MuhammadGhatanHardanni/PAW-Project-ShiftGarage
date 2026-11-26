import { describe, it, expect, vi, beforeEach } from 'vitest';
const request = require('supertest');
const app = require('../../app');
const AntreanModel = require('../../models/antreanModel');
const BookingModel = require('../../models/bookingModel');
const { sampleAntreanList } = require('../fixtures/layanan');

describe('Integration: Alur Reservasi Booking & Pelacakan Plat Nomor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/antrean/cek/:plat', () => {
    it('mengembalikan data status motor di Pit jika plat nomor cocok (200)', async () => {
      vi.spyOn(AntreanModel, 'getAll').mockResolvedValue(sampleAntreanList);

      const response = await request(app).get('/api/antrean/cek/AB3112QA');

      expect(response.status).toBe(200);
      expect(response.body.sukses).toBe(true);
      expect(response.body.data.plat).toBe('AB 3112 QA');
      expect(response.body.data.nama).toBe('Budi Santoso');
      expect(response.body.data.status).toBe('menunggu');
    });

    it('mengembalikan 404 jika nomor plat tidak ditemukan di antrean aktif', async () => {
      vi.spyOn(AntreanModel, 'getAll').mockResolvedValue(sampleAntreanList);

      const response = await request(app).get('/api/antrean/cek/AB9999ZZ');

      expect(response.status).toBe(404);
      expect(response.body.sukses).toBe(false);
      expect(response.body.pesan).toMatch(/tidak ditemukan/i);
    });
  });

  describe('POST /booking/kirim', () => {
    it('berhasil menyimpan reservasi booking dan mengarahkan kembali ke halaman beranda', async () => {
      vi.spyOn(BookingModel, 'create').mockResolvedValue({
        id: 'BK-99',
        nama_pelanggan: 'Dimas Saputra',
        no_polisi: 'AB 1234 CD',
        tipe_motor: 'Honda Vario 160',
        layanan_nama: 'Servis Rutin',
        jam_booking: '10:00 WIB',
        tanggal_booking: '2026-11-28',
      });

      const response = await request(app)
        .post('/booking/kirim')
        .send({
          nama: 'Dimas Saputra',
          whatsapp: '081234567890',
          motor: 'Honda Vario 160',
          plat: 'AB 1234 CD',
          layanan_id: 'L-01',
          tanggal: '2026-11-28',
          jam: '10:00 WIB',
          keluhan: 'Ganti oli rutin',
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('booking_success=1');
      expect(response.headers.location).toContain('nama=Dimas+Saputra');
    });
  });
});
