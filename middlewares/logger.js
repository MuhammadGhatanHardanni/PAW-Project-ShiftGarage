/**
 * middlewares/logger.js
 * Middleware logger — mencatat setiap request HTTP ke terminal (console)
 * dan juga ke file log di folder /logs.
 *
 * Log format (terminal):
 *   [TIMESTAMP] METHOD /path → STATUS (X ms)
 *
 * Log format (file):
 *   Markdown table row  |  waktu | method | url | status | durasi | ip  |
 */

const fs   = require('fs');
const path = require('path');
const config = require('../config');

// ─── Persiapan file log ───────────────────────────────────────────────────────
const logDir  = config.logDir;
const logPath = path.join(logDir, config.logFile);

fs.mkdirSync(logDir, { recursive: true });

// Tulis header Markdown hanya jika file belum ada
if (!fs.existsSync(logPath)) {
  const header =
    '# Log Akses — Shift Garage\n\n' +
    '| Waktu | Method | URL | Status | Durasi | IP |\n' +
    '|---|---|---|---|---|---|\n';
  fs.writeFileSync(logPath, header);
}

// Escape karakter "|" agar tabel Markdown tidak rusak
const aman = (s) => String(s).replace(/\|/g, '%7C');

// ─── Middleware ───────────────────────────────────────────────────────────────
module.exports = (req, res, next) => {
  const mulai = process.hrtime.bigint();

  res.on('finish', () => {
    const durasiMs  = (Number(process.hrtime.bigint() - mulai) / 1e6).toFixed(1);
    const waktu     = new Date().toISOString();
    const method    = req.method;
    const url       = req.originalUrl;
    const status    = res.statusCode;
    const ip        = req.ip || req.socket?.remoteAddress || '-';

    // ── Cetak ke terminal ────────────────────────────────────────────────────
    const warnaTeks = status >= 500 ? '\x1b[31m'   // merah — error server
                    : status >= 400 ? '\x1b[33m'   // kuning — not found / bad request
                    : status >= 300 ? '\x1b[36m'   // cyan  — redirect
                    :                 '\x1b[32m';   // hijau  — sukses
    const reset = '\x1b[0m';

    console.log(
      `${warnaTeks}[${waktu}] ${method} ${url} → ${status} (${durasiMs} ms)${reset}`
    );

    // ── Tulis ke file log ────────────────────────────────────────────────────
    const baris =
      `| ${waktu} | ${method} | ${aman(url)} | ${status} | ${durasiMs} ms | ${aman(ip)} |\n`;

    fs.appendFile(logPath, baris, (err) => {
      if (err) console.error('\x1b[31mGagal menulis log:\x1b[0m', err.message);
    });
  });

  next();
};

