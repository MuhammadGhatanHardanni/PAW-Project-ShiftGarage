import { describe, it, expect, vi } from 'vitest';
const homeController = require('../../../controllers/homeController');

function createMockRes() {
  const res = {};
  res.redirect = vi.fn().mockReturnValue(res);
  return res;
}

describe('middlewares/auth.middleware (homeController.authAdminMiddleware)', () => {
  it('mengarahkan ke /admin/login jika tidak ada cookie autentikasi', () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = vi.fn();

    homeController.authAdminMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/admin/login'));
    expect(next).not.toHaveBeenCalled();
  });

  it('mengarahkan ke /admin/login jika nilai cookie bukan vinsen_authenticated', () => {
    const req = { headers: { cookie: 'sg_admin_auth=invalid_token' } };
    const res = createMockRes();
    const next = vi.fn();

    homeController.authAdminMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/admin/login'));
    expect(next).not.toHaveBeenCalled();
  });

  it('memanggil next() jika cookie vinsen_authenticated valid', () => {
    const req = { headers: { cookie: 'sg_admin_auth=vinsen_authenticated' } };
    const res = createMockRes();
    const next = vi.fn();

    homeController.authAdminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
