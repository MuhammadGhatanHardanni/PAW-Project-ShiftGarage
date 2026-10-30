/**
 * routes/index.js
 * Titik masuk utama router — menggabungkan web dan API routes.
 */

const express    = require('express');
const apiRoutes  = require('./api');
const webRoutes  = require('./web');

const router = express.Router();

router.use('/api', apiRoutes);
router.use('/',    webRoutes);

module.exports = router;

