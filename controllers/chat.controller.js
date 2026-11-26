/**
 * controllers/chat.controller.js
 * Controller untuk menangani komunikasi chat AI Assistant.
 * Mengatur alur request pengguna, memanggil service Gemini, dan mengembalikan respons format JSON standar.
 *
 * Tugas PAW — Integrasi Generative AI menggunakan Gemini
 * Mahasiswa: Muhammad Ghatan Hardanni - 20240140182
 */

const geminiService = require('../services/gemini.service');
const geminiConfig = require('../config/gemini');
const LayananModel = require('../models/layananModel');
const config = require('../config');

const ChatController = {
  /**
   * Endpoint REST API: POST /api/chat
   * Menerima { "message": "..." } dan mengembalikan { "success": true, "data": { "reply": "..." } }
   */
  async handleChat(req, res) {
    try {
      const userMessage = req.body.message;

      // Panggil service Gemini untuk memproses context & prompt
      const reply = await geminiService.generateChatReply(userMessage);

      // Kembalikan response JSON sesuai spesifikasi tugas
      return res.status(200).json({
        success: true,
        data: {
          reply: reply,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('[ChatController] Error saat memproses chat:', err);
      return res.status(500).json({
        success: false,
        pesan: 'Terjadi kesalahan pada server saat memproses balasan AI.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  },

  /**
   * Endpoint REST API Khusus Admin: POST /api/admin/chat
   * Menerima perintah dari Pak Vinsen. Mendukung eksekusi aksi CRUD database via Natural Language!
   */
  async handleAdminAiChat(req, res) {
    try {
      const userMessage = req.body.message || req.body.prompt;
      if (!userMessage || !String(userMessage).trim()) {
        return res.status(400).json({
          success: false,
          pesan: 'Pesan instruksi AI tidak boleh kosong',
        });
      }
      const result = await geminiService.processAdminAiAction(userMessage);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error('[ChatController Admin] Error saat memproses admin AI chat:', err);
      return res.status(500).json({
        success: false,
        pesan: 'Terjadi kesalahan pada server saat memproses perintah AI: ' + err.message,
      });
    }
  },

  /**
   * Halaman Antarmuka Web Chatbot: GET /chat
   * Merender halaman penuh AI Assistant (views/chat.ejs)
   */
  async renderChatPage(req, res) {
    try {
      const layanan = await LayananModel.getAll();

      return res.render('chat', {
        judul: `AI Assistant — Tanya Bengkel | ${config.appName}`,
        appName: config.appName,
        layanan: layanan,
        geminiConfigured: geminiConfig.isConfigured(),
        modelName: geminiConfig.modelName,
        tahun: new Date().getFullYear(),
      });
    } catch (err) {
      console.error('[ChatController] Gagal merender halaman chat:', err.message);
      return res.status(500).render('404', {
        judul: `Error — ${config.appName}`,
        appName: config.appName,
        pesan: 'Gagal memuat halaman AI Assistant.',
        tahun: new Date().getFullYear(),
      });
    }
  },
};

module.exports = ChatController;

