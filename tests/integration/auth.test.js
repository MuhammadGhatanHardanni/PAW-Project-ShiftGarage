import { describe, it, expect, vi, beforeEach } from 'vitest';
const request = require('supertest');
const app = require('../../app');
const LayananModel = require('../../models/layananModel');
const AntreanModel = require('../../models/antreanModel');
const BookingModel = require('../../models/bookingModel');
const { validAdmin, validVinsen, invalidCredentials } = require('../fixtures/users');
const { sampleLayananList, sampleAntreanList } = require('../fixtures/layanan');

describe('Integration: Admin Authentication & Protected Route Lifecycle', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(LayananModel, 'getAll').mockResolvedValue(sampleLayananList);
    vi.spyOn(AntreanModel, 'getAll').mockResolvedValue(sampleAntreanList);
    vi.spyOn(BookingModel, 'getAll').mockResolvedValue([]);
  });

  it('POST /admin/login berhasil dengan username "admin" dan password "bengkel123"', async () => {
    const response = await request(app)
      .post('/admin/login')
      .send(validAdmin);

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/admin');
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('sg_admin_auth=vinsen_authenticated');
  });

  it('POST /admin/login berhasil dengan akun mekanik "vinsen" dan password "1234"', async () => {
    const response = await request(app)
      .post('/admin/login')
      .send(validVinsen);

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/admin');
    expect(response.headers['set-cookie'][0]).toContain('sg_admin_auth=vinsen_authenticated');
  });

  it('POST /admin/login menolak kredensial yang salah dan redirect ke login error', async () => {
    const response = await request(app)
      .post('/admin/login')
      .send(invalidCredentials);

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/admin/login');
    expect(response.headers.location).toContain('tipe=error');
  });

  it('GET /admin memblokir akses tanpa cookie dan mengarahkan ke /admin/login', async () => {
    const response = await request(app).get('/admin');

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/admin/login');
  });

  it('GET /admin dapat diakses (200) jika memiliki cookie autentikasi valid', async () => {
    const response = await request(app)
      .get('/admin')
      .set('Cookie', ['sg_admin_auth=vinsen_authenticated']);

    expect(response.status).toBe(200);
    expect(response.text).toContain('ShiftGarage');
    expect(response.text).toContain('Pak Vinsen');
  });

  it('GET /admin/logout menghapus cookie dan mengarahkan kembali ke halaman login', async () => {
    const response = await request(app)
      .get('/admin/logout')
      .set('Cookie', ['sg_admin_auth=vinsen_authenticated']);

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/admin/login');
    expect(response.headers['set-cookie'][0]).toContain('sg_admin_auth=;');
  });
});
