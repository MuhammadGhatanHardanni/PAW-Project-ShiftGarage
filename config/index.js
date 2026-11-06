require('dotenv').config();
const path = require('path');

module.exports = {
  appName: 'Shift Garage',
  port: process.env.PORT || 3000,
  logDir: path.join(__dirname, '..', 'logs'),
  logFile: 'access.log',
  version: '2.0.0 / Pertemuan 7 (Database & CRUD)',
  author: 'Muhammad Ghatan Hardanni - 202140182',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    database: process.env.DB_NAME || 'shift_garage',
  },
};
