import { describe, it, expect, vi, beforeEach } from 'vitest';
const request = require('supertest');
const app = require('../../app');
const geminiService = require('../../services/gemini.service');

describe('Integration: Fitur Chat AI (/api/chat & /api/admin/chat)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/chat (Konsultasi Publik)', () => {
    it('menolak (400) request jika message kosong atau hanya spasi', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '    ' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.pesan).toContain('tidak boleh kosong');
    });

    it('menolak (400) request jika panjang pesan melebihi 500 karakter', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'x'.repeat(501) });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('berhasil memproses pertanyaan valid melalui alur route -> middleware -> controller -> service -> response', async () => {
      const mockReply = 'Servis Rutin di Shift Garage berbiaya Rp 80.000 dengan estimasi 60 menit pengerjaan.';
      vi.spyOn(geminiService, 'generateChatReply').mockResolvedValue(mockReply);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Berapa tarif dan estimasi waktu Servis Rutin?' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reply).toBe(mockReply);
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('POST /api/admin/chat (Asisten AI Admin Terproteksi)', () => {
    it('memblokir akses jika tanpa cookie autentikasi admin', async () => {
      const response = await request(app)
        .post('/api/admin/chat')
        .send({ prompt: 'Selesaikan antrean PIT-01' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/admin/login');
    });

    it('berhasil memproses perintah admin jika sudah login', async () => {
      const mockResult = {
        reply: 'Status antrean PIT-01 telah diperbarui ke selesai',
        actionExecuted: true,
        actionType: 'UPDATE_ANTREAN',
      };
      vi.spyOn(geminiService, 'processAdminAiAction').mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/admin/chat')
        .set('Cookie', ['sg_admin_auth=vinsen_authenticated'])
        .send({ prompt: 'Selesaikan antrean PIT-01' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.actionExecuted).toBe(true);
    });
  });
});
