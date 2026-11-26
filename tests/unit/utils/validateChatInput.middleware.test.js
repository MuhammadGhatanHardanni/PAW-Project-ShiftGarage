import { describe, it, expect, vi } from 'vitest';
const validateChatInput = require('../../../middlewares/validateChatInput');

function createMockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('middlewares/validateChatInput.js', () => {
  it('menolak request jika field message tidak ada', () => {
    const req = { body: {} };
    const res = createMockRes();
    const next = vi.fn();

    validateChatInput(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, pesan: expect.stringContaining('wajib') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('menolak request jika message bukan string', () => {
    const req = { body: { message: 12345 } };
    const res = createMockRes();
    const next = vi.fn();

    validateChatInput(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, pesan: expect.stringContaining('string') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('menolak pesan yang hanya berisi spasi kosong', () => {
    const req = { body: { message: '    ' } };
    const res = createMockRes();
    const next = vi.fn();

    validateChatInput(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, pesan: expect.stringContaining('kosong') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('menolak pesan yang terlalu pendek (< 2 karakter)', () => {
    const req = { body: { message: 'a' } };
    const res = createMockRes();
    const next = vi.fn();

    validateChatInput(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, pesan: expect.stringContaining('terlalu pendek') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('menolak pesan yang melebihi 500 karakter', () => {
    const req = { body: { message: 'b'.repeat(501) } };
    const res = createMockRes();
    const next = vi.fn();

    validateChatInput(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, pesan: expect.stringContaining('terlalu panjang') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('meneruskan ke next() dan melakukan trim pada pesan yang valid', () => {
    const req = { body: { message: '  Berapa biaya ganti oli Vario 160?  ' } };
    const res = createMockRes();
    const next = vi.fn();

    validateChatInput(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.message).toBe('Berapa biaya ganti oli Vario 160?');
    expect(res.status).not.toHaveBeenCalled();
  });
});
