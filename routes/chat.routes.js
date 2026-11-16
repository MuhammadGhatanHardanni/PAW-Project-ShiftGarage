/**
 * routes/chat.routes.js
 * Definisi rute untuk fitur AI Assistant (Google Gemini).
 *
 * Endpoint:
 *   POST /api/chat  → Mengirim pesan ke AI dan menerima respons kontekstual
 *
 * Tugas PAW — Integrasi Generative AI menggunakan Gemini
 * Mahasiswa: Muhammad Ghatan Hardanni - 20240140182
 */

const express = require('express');
const chatController = require('../controllers/chat.controller');
const validateChatInput = require('../middlewares/validateChatInput');

const router = express.Router();

// Endpoint REST API AI Assistant: POST /api/chat
router.post('/chat', validateChatInput, chatController.handleChat);

// Fallback jika router di-mount langsung pada path '/api/chat'
router.post('/', validateChatInput, chatController.handleChat);

module.exports = router;

