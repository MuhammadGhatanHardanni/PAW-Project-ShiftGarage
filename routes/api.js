/**
 * routes/api.js
 * Definisi rute REST API CRUD /api/*
 */

const express       = require('express');
const apiController = require('../controllers/apiController');

const router = express.Router();

// Status Server
router.get('/status', apiController.status);

// Operasi CRUD Produk / Layanan
router.get('/produk',        apiController.produk);
router.get('/produk/:id',    apiController.detailProduk);
router.post('/produk',       apiController.tambahProduk);
router.put('/produk/:id',    apiController.ubahProduk);
router.delete('/produk/:id', apiController.hapusProduk);

module.exports = router;
