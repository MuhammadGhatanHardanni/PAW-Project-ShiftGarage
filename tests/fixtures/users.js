/**
 * tests/fixtures/users.js
 * Kredensial dan data contoh untuk pengujian autentikasi staf bengkel.
 */
module.exports = {
  validAdmin: {
    username: 'admin',
    password: 'bengkel123',
  },
  validVinsen: {
    username: 'vinsen',
    password: '1234',
  },
  invalidCredentials: {
    username: 'pengguna_asing',
    password: 'password_salah',
  },
  emptyPayload: {},
};
