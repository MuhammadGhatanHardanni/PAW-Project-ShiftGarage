/**
 * routes/web.js
 * Definisi endpoint halaman web (EJS).
 */

const express        = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

router.get('/',        homeController.index);
router.get('/layanan', homeController.layanan);

module.exports = router;

