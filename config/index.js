const path = require('path');

module.exports = {
  appName: 'BengkelAI',
  port: process.env.PORT || 3000,
  logDir: path.join(__dirname, '..', 'logs'),
  logFile: 'access.log',
  version: '1.0.0 / 15 Oktober 2026',
  author: 'Muhammad Ghatan Hardanni & 202140182',
};

