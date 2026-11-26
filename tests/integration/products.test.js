import { describe, it, expect, vi, beforeEach } from 'vitest';
const request = require('supertest');
const app = require('../../app');
const LayananModel = require('../../models/layananModel');
const { sampleLayananList, sampleSingleLayanan } = require('../fixtures/layanan');

describe('Integration: REST API & Layanan CRUD (/api/produk & /api/status)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/status mengembalikan status server dan info database', async () => {
    vi.spyOn(LayananModel, 'getAll').mockResolvedValue(sampleLayananList);

    const response = await request(app).get('/api/status');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('database');
    expect(response.body.database.totalProduk).toBe(3);
  });

  it('GET /api/produk mengembalikan seluruh daftar layanan secara publik', async () => {
    vi.spyOn(LayananModel, 'getAll').mockResolvedValue(sampleLayananList);

    const response = await request(app).get('/api/produk');

    expect(response.status).toBe(200);
    expect(response.body.sukses).toBe(true);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data[0].nama).toBe('Servis Rutin');
  });

  it('GET /api/produk/:id mengembalikan detail satu layanan jika ID valid', async () => {
    vi.spyOn(LayananModel, 'getById').mockResolvedValue(sampleSingleLayanan);

    const response = await request(app).get('/api/produk/L-99');

    expect(response.status).toBe(200);
    expect(response.body.sukses).toBe(true);
    expect(response.body.data.id).toBe('L-99');
    expect(response.body.data.nama).toBe('Servis Kelistrikan & Aki');
  });

  it('GET /api/produk/:id mengembalikan 404 jika layanan tidak ditemukan', async () => {
    vi.spyOn(LayananModel, 'getById').mockResolvedValue(null);

    const response = await request(app).get('/api/produk/L-NOTFOUND');

    expect(response.status).toBe(404);
    expect(response.body.sukses).toBe(false);
  });

  it('POST /api/produk menolak request tanpa field nama (400)', async () => {
    const response = await request(app)
      .post('/api/produk')
      .send({ deskripsi: 'Hanya deskripsi saja' });

    expect(response.status).toBe(400);
    expect(response.body.sukses).toBe(false);
  });

  it('POST /api/produk berhasil membuat layanan baru dan mengembalikan status 201', async () => {
    vi.spyOn(LayananModel, 'create').mockResolvedValue(sampleSingleLayanan);

    const response = await request(app)
      .post('/api/produk')
      .send({
        nama: 'Servis Kelistrikan & Aki',
        kategori: 'Kelistrikan',
        hargaMulaiDari: 95000,
        estimasiMenit: 35,
      });

    expect(response.status).toBe(201);
    expect(response.body.sukses).toBe(true);
    expect(response.body.data.nama).toBe('Servis Kelistrikan & Aki');
  });

  it('PUT /api/produk/:id memperbarui data layanan (200)', async () => {
    const updated = { ...sampleSingleLayanan, hargaMulaiDari: 100000 };
    vi.spyOn(LayananModel, 'update').mockResolvedValue(updated);

    const response = await request(app)
      .put('/api/produk/L-99')
      .send({ hargaMulaiDari: 100000 });

    expect(response.status).toBe(200);
    expect(response.body.sukses).toBe(true);
    expect(response.body.data.hargaMulaiDari).toBe(100000);
  });

  it('DELETE /api/produk/:id menghapus data layanan (200)', async () => {
    vi.spyOn(LayananModel, 'delete').mockResolvedValue(sampleSingleLayanan);

    const response = await request(app).delete('/api/produk/L-99');

    expect(response.status).toBe(200);
    expect(response.body.sukses).toBe(true);
  });
});
