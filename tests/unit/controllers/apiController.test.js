import { describe, it, expect, vi, beforeEach } from 'vitest';
const LayananModel = require('../../../models/layananModel');
const apiController = require('../../../controllers/apiController');
const { sampleLayananList, sampleSingleLayanan } = require('../../fixtures/layanan');

function createMockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('controllers/apiController.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('status', () => {
    it('mengembalikan status ok 200 beserta informasi server dan database', async () => {
      vi.spyOn(LayananModel, 'getAll').mockResolvedValue(sampleLayananList);
      const req = {};
      const res = createMockRes();

      await apiController.status(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          aplikasi: expect.any(String),
          database: expect.objectContaining({ engine: 'PostgreSQL', status: 'Terhubung' }),
        })
      );
    });

    it('mengembalikan 500 degraded jika koneksi database error', async () => {
      vi.spyOn(LayananModel, 'getAll').mockRejectedValue(new Error('Koneksi terputus'));
      const req = {};
      const res = createMockRes();

      await apiController.status(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'degraded' })
      );
    });
  });

  describe('produk', () => {
    it('mengembalikan daftar seluruh produk/layanan dengan status 200', async () => {
      vi.spyOn(LayananModel, 'getAll').mockResolvedValue(sampleLayananList);
      const req = {};
      const res = createMockRes();

      await apiController.produk(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sukses: true,
          jumlah: 3,
          data: sampleLayananList,
        })
      );
    });

    it('mengembalikan 500 jika terjadi kegagalan mengambil data', async () => {
      vi.spyOn(LayananModel, 'getAll').mockRejectedValue(new Error('DB error'));
      const req = {};
      const res = createMockRes();

      await apiController.produk(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ sukses: false })
      );
    });
  });

  describe('detailProduk', () => {
    it('mengembalikan detail layanan jika ID ditemukan (status 200)', async () => {
      vi.spyOn(LayananModel, 'getById').mockResolvedValue(sampleSingleLayanan);
      const req = { params: { id: 'L-99' } };
      const res = createMockRes();

      await apiController.detailProduk(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ sukses: true, data: sampleSingleLayanan })
      );
    });

    it('mengembalikan 404 jika ID layanan tidak ditemukan', async () => {
      vi.spyOn(LayananModel, 'getById').mockResolvedValue(null);
      const req = { params: { id: 'L-UNKNOWN' } };
      const res = createMockRes();

      await apiController.detailProduk(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ sukses: false, pesan: expect.stringContaining('tidak ditemukan') })
      );
    });
  });

  describe('tambahProduk', () => {
    it('menolak (400) jika nama layanan kosong', async () => {
      const req = { body: { nama: '   ', kategori: 'Umum' } };
      const res = createMockRes();

      await apiController.tambahProduk(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ sukses: false, pesan: expect.stringContaining('wajib diisi') })
      );
    });

    it('berhasil menambahkan layanan baru dan mengembalikan status 201', async () => {
      vi.spyOn(LayananModel, 'create').mockResolvedValue(sampleSingleLayanan);
      const req = {
        body: {
          nama: 'Servis Kelistrikan & Aki',
          kategori: 'Kelistrikan',
          hargaMulaiDari: 95000,
          estimasiMenit: 35,
        },
      };
      const res = createMockRes();

      await apiController.tambahProduk(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sukses: true,
          pesan: expect.stringContaining('berhasil ditambahkan'),
          data: sampleSingleLayanan,
        })
      );
    });
  });

  describe('ubahProduk', () => {
    it('mengembalikan 404 jika layanan yang akan diubah tidak ada di database', async () => {
      vi.spyOn(LayananModel, 'update').mockResolvedValue(null);
      const req = { params: { id: 'L-UNKNOWN' }, body: { nama: 'Nama Baru' } };
      const res = createMockRes();

      await apiController.ubahProduk(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('berhasil memperbarui layanan dan mengembalikan status 200', async () => {
      const updated = { ...sampleSingleLayanan, nama: 'Servis Kelistrikan Updated' };
      vi.spyOn(LayananModel, 'update').mockResolvedValue(updated);
      const req = { params: { id: 'L-99' }, body: { nama: 'Servis Kelistrikan Updated' } };
      const res = createMockRes();

      await apiController.ubahProduk(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ sukses: true, data: updated })
      );
    });
  });

  describe('hapusProduk', () => {
    it('mengembalikan 404 jika layanan yang akan dihapus tidak ditemukan', async () => {
      vi.spyOn(LayananModel, 'delete').mockResolvedValue(null);
      const req = { params: { id: 'L-UNKNOWN' } };
      const res = createMockRes();

      await apiController.hapusProduk(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('berhasil menghapus layanan dan mengembalikan status 200', async () => {
      vi.spyOn(LayananModel, 'delete').mockResolvedValue(sampleSingleLayanan);
      const req = { params: { id: 'L-99' } };
      const res = createMockRes();

      await apiController.hapusProduk(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ sukses: true, pesan: expect.stringContaining('berhasil dihapus') })
      );
    });
  });
});
