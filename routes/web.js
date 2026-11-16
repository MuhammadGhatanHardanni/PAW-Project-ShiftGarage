/**
 * routes/web.js
 * Definisi rute halaman web (EJS views) dan aksi interaktif sistem Shift Garage.
 * Mendukung seluruh alur PRD: Booking Pelanggan, Kanban Pit, Pesanan Masuk, & CRUD Layanan.
 */

const express        = require('express');
const homeController = require('../controllers/homeController');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

// ─── 1. Halaman Publik & Reservasi Pelanggan ─────────────────────────────────
router.get('/',                           homeController.index);
router.post('/booking/kirim',             homeController.formBooking);
router.get('/api/antrean/cek/:plat',      homeController.cekStatusPlat);

// ─── 2. Autentikasi Staf Bengkel (Pak Vinsen) ────────────────────────────────
router.get('/admin/login',                homeController.adminLogin);
router.post('/admin/login',               homeController.adminAuthProcess);
router.get('/admin/logout',               homeController.adminLogout);

// ─── 3. Portal Admin Terpadu (Terproteksi Middleware) ─────────────────────────
router.get('/admin',                      homeController.authAdminMiddleware, homeController.layanan);
router.get('/layanan',                    homeController.authAdminMiddleware, homeController.layanan);

// Aksi Alur Pesanan Masuk (F-01 & US-01)
router.post('/admin/booking/terima/:id',  homeController.authAdminMiddleware, homeController.terimaBooking);
router.post('/admin/booking/tolak/:id',   homeController.authAdminMiddleware, homeController.tolakBooking);
router.post('/admin/booking/hapus/:id',   homeController.authAdminMiddleware, homeController.hapusBooking);

// Aksi Kanban Board Antrean Pit (F-02 & US-02)
router.post('/admin/antrean/status/:id',  homeController.authAdminMiddleware, homeController.updateStatusAntrean);
router.post('/admin/antrean/tambah-manual', homeController.authAdminMiddleware, homeController.tambahAntreanManual);
router.post('/admin/antrean/hapus/:id',   homeController.authAdminMiddleware, homeController.hapusAntrean);

// Aksi CRUD Katalog Layanan Database PostgreSQL (PAW Pertemuan 7)
router.post('/layanan/tambah',            homeController.authAdminMiddleware, homeController.formTambah);
router.post('/layanan/update/:id',        homeController.authAdminMiddleware, homeController.formUpdate);
router.post('/layanan/delete/:id',        homeController.authAdminMiddleware, homeController.formHapus);

// Aksi AI Admin Agent (CRUD via Natural Language Chatbot)
router.post('/api/admin/chat',            homeController.authAdminMiddleware, chatController.handleAdminAiChat);

// ─── 4. Halaman Konsultasi AI Assistant Penuh (Google Gemini) ────────────────
router.get('/chat',                       chatController.renderChatPage);

module.exports = router;
