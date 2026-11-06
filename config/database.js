/**
 * config/database.js
 * Modul konfigurasi dan koneksi PostgreSQL menggunakan Connection Pool (pg.Pool).
 * Kredensial dibaca secara aman dari environment variable (.env).
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'shift_garage',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('\x1b[31m[Database Error]\x1b[0m Kesalahan tak terduga pada PostgreSQL Pool:', err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};

