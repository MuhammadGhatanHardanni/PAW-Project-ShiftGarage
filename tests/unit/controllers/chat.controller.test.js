import { describe, it, expect, vi, beforeEach } from 'vitest';
const chatController = require('../../../controllers/chat.controller');
const geminiService = require('../../../services/gemini.service');
const LayananModel = require('../../../models/layananModel');

function createMockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.render = vi.fn().mockReturnValue(res);
  return res;
}

describe('controllers/chat.controller.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('handleChat', () => {
    it('mengembalikan status 200 dan teks balasan AI ketika request sukses', async () => {
      const mockReply = 'Biaya ganti oli di Shift Garage mulai Rp 80.000.';
      vi.spyOn(geminiService, 'generateChatReply').mockResolvedValue(mockReply);

      const req = { body: { message: 'Berapa tarif ganti oli?' } };
      const res = createMockRes();

      await chatController.handleChat(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reply: mockReply,
          timestamp: expect.any(String),
        },
      });
    });

    it('mengembalikan status 500 jika service AI melempar error', async () => {
      vi.spyOn(geminiService, 'generateChatReply').mockRejectedValue(new Error('Quota exceeded'));

      const req = { body: { message: 'Konsultasi motor' } };
      const res = createMockRes();

      await chatController.handleChat(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, pesan: expect.any(String) })
      );
    });
  });

  describe('handleAdminAiChat', () => {
    it('menolak (400) jika prompt admin kosong', async () => {
      const req = { body: { prompt: '   ' } };
      const res = createMockRes();

      await chatController.handleAdminAiChat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, pesan: expect.stringContaining('tidak boleh kosong') })
      );
    });

    it('menjalankan perintah AI admin dan mengembalikan balasan (200)', async () => {
      const mockAction = {
        reply: 'Status antrean PIT-01 diperbarui ke selesai',
        actionExecuted: true,
        actionType: 'UPDATE_ANTREAN',
      };
      vi.spyOn(geminiService, 'processAdminAiAction').mockResolvedValue(mockAction);

      const req = { body: { prompt: 'Selesaikan antrean PIT-01' } };
      const res = createMockRes();

      await chatController.handleAdminAiChat(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAction,
      });
    });
  });

  describe('renderChatPage', () => {
    it('merender view chat dengan judul dan nama aplikasi', async () => {
      vi.spyOn(LayananModel, 'getAll').mockResolvedValue([]);
      const req = {};
      const res = createMockRes();

      await chatController.renderChatPage(req, res);

      expect(res.render).toHaveBeenCalledWith('chat', expect.objectContaining({
        judul: expect.stringContaining('Shift Garage'),
        appName: expect.any(String),
      }));
    });
  });
});
