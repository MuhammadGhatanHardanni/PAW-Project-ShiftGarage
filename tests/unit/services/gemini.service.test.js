import { describe, it, expect, vi, beforeEach } from 'vitest';
const LayananModel = require('../../../models/layananModel');
const AntreanModel = require('../../../models/antreanModel');
const geminiConfig = require('../../../config/gemini');
const {
  buildDatabaseContext,
  buildSystemInstruction,
  checkBackendGuardrail,
  generateChatReply,
  processAdminAiAction,
} = require('../../../services/gemini.service');
const { sampleLayananList, sampleAntreanList } = require('../../fixtures/layanan');

describe('services/gemini.service.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('buildDatabaseContext', () => {
    it('membuat string konteks dari data layanan PostgreSQL', async () => {
      vi.spyOn(LayananModel, 'getAll').mockResolvedValue(sampleLayananList);

      const context = await buildDatabaseContext();

      expect(context).toContain('Servis Rutin');
      expect(context).toContain('Tune-Up Injeksi');
      expect(context).toContain('Rp 80.000');
    });

    it('menangani kondisi jika data layanan kosong', async () => {
      vi.spyOn(LayananModel, 'getAll').mockResolvedValue([]);

      const context = await buildDatabaseContext();

      expect(context).toContain('belum ada data layanan');
    });

    it('menangani error ketika query database gagal', async () => {
      vi.spyOn(LayananModel, 'getAll').mockRejectedValue(new Error('Koneksi DB terputus'));

      const context = await buildDatabaseContext();

      expect(context).toContain('Gagal memuat katalog layanan');
    });
  });

  describe('buildSystemInstruction', () => {
    it('menyusun instruksi sistem lengkap dengan identitas bengkel dan guardrail', () => {
      const dbText = '1. Servis Rutin - Rp 80.000';
      const instruction = buildSystemInstruction(dbText);

      expect(instruction).toContain('Shift AI Assistant');
      expect(instruction).toContain('Shift Garage');
      expect(instruction).toContain('Muhammad Ghatan Hardanni');
      expect(instruction).toContain('Jl. Kaliurang KM 9');
      expect(instruction).toContain('ATURAN PERILAKU & AI GUARDRAIL');
      expect(instruction).toContain(dbText);
    });
  });

  describe('checkBackendGuardrail', () => {
    it('memblokir pertanyaan yang meminta kode pemrograman game/aplikasi', () => {
      const hasil = checkBackendGuardrail('Buatkan saya kode program python untuk membuat game');
      expect(hasil.blocked).toBe(true);
      expect(hasil.reply).toContain('hanya dapat membantu menjawab pertanyaan seputar informasi bengkel motor');
    });

    it('memblokir pertanyaan tentang resep masakan', () => {
      const hasil = checkBackendGuardrail('Tolong carikan resep masakan nasi goreng enak');
      expect(hasil.blocked).toBe(true);
    });

    it('memblokir pertanyaan tentang presiden', () => {
      const hasil = checkBackendGuardrail('Siapa presiden Indonesia saat ini?');
      expect(hasil.blocked).toBe(true);
    });

    it('mengizinkan pertanyaan valid seputar servis motor', () => {
      const hasil = checkBackendGuardrail('Berapa tarif ganti oli dan servis rem motor matic?');
      expect(hasil.blocked).toBe(false);
    });
  });

  describe('generateChatReply', () => {
    it('mengembalikan respons penolakan ramah jika terkena guardrail', async () => {
      const reply = await generateChatReply('Buatkan coding aplikasi');
      expect(reply).toContain('hanya dapat membantu');
    });

    it('mengembalikan fallback context jika API key Gemini belum dipasang', async () => {
      vi.spyOn(geminiConfig, 'isConfigured').mockReturnValue(false);
      vi.spyOn(LayananModel, 'getAll').mockResolvedValue(sampleLayananList);

      const reply = await generateChatReply('Berapa harga servis rutin?');
      expect(reply).toContain('GEMINI_API_KEY');
      expect(reply).toContain('Servis Rutin');
    });

    it('memanggil Google Gemini API dan mengembalikan balasan teks jika key terpasang', async () => {
      vi.spyOn(geminiConfig, 'isConfigured').mockReturnValue(true);
      vi.spyOn(LayananModel, 'getAll').mockResolvedValue(sampleLayananList);

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => 'Biaya Servis Rutin di Shift Garage mulai dari Rp 80.000 dengan estimasi 60 menit.',
        },
      });

      vi.spyOn(geminiConfig, 'getModel').mockReturnValue({
        generateContent: mockGenerateContent,
      });

      const reply = await generateChatReply('Berapa harga servis rutin motor?');

      expect(reply).toContain('Rp 80.000');
    });
  });

  describe('processAdminAiAction', () => {
    it('memperbarui status antrean pit menjadi selesai jika ada perintah terkait', async () => {
      vi.spyOn(LayananModel, 'getAll').mockResolvedValue(sampleLayananList);
      vi.spyOn(AntreanModel, 'getAll').mockResolvedValue(sampleAntreanList);
      const updateStatusSpy = vi.spyOn(AntreanModel, 'updateStatus').mockResolvedValue(true);

      const hasil = await processAdminAiAction('Selesaikan antrean motor AB 3112 QA');

      expect(hasil.actionExecuted).toBe(true);
      expect(hasil.actionType).toBe('UPDATE_ANTREAN');
      expect(updateStatusSpy).toHaveBeenCalledWith('PIT-01', 'selesai');
      expect(hasil.reply).toContain('Status Antrean Pit Diperbarui');
    });

    it('menghapus layanan jika ada perintah hapus layanan spesifik', async () => {
      vi.spyOn(LayananModel, 'getAll').mockResolvedValue(sampleLayananList);
      vi.spyOn(AntreanModel, 'getAll').mockResolvedValue(sampleAntreanList);
      const deleteSpy = vi.spyOn(LayananModel, 'delete').mockResolvedValue(true);

      const hasil = await processAdminAiAction('Hapus layanan Ganti Ban');

      expect(hasil.actionExecuted).toBe(true);
      expect(hasil.actionType).toBe('DELETE_LAYANAN');
      expect(deleteSpy).toHaveBeenCalledWith('L-03');
      expect(hasil.reply).toContain('Layanan Berhasil Dihapus');
    });
  });
});
