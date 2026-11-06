/**
 * routes/web.js
 * Definisi rute halaman web (EJS views) dan aksi antarmuka pengguna
 */

const express        = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

router.get('/',                    homeController.index);
router.get('/layanan',             homeController.layanan);
router.post('/layanan/tambah',     homeController.formTambah);
router.post('/layanan/update/:id', homeController.formUpdate);
router.post('/layanan/delete/:id', homeController.formHapus);

module.exports = router;
