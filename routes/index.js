/**
 * routes/index.js
 * Titik masuk utama router — menggabungkan web, API CRUD, dan Chat AI routes.
 */

const express    = require('express');
const apiRoutes  = require('./api');
const webRoutes  = require('./web');
const chatRoutes = require('./chat.routes');

const router = express.Router();

// Endpoint REST API AI: POST /api/chat
router.use('/api', chatRoutes);

// Endpoint REST API CRUD: /api/produk, /api/status, dll
router.use('/api', apiRoutes);

// Endpoint Halaman Web Frontend: /, /layanan, /chat, dll
router.use('/', webRoutes);

module.exports = router;
