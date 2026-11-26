import { vi } from 'vitest';

/**
 * tests/setup/test-setup.js
 * Inisialisasi konfigurasi pengujian global untuk Vitest.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '3999';
process.env.SESSION_SECRET = 'test-secret-key-shift-garage';
process.env.GEMINI_API_KEY = 'test-mock-gemini-key';

// Mock console.log dan console.error selama test agar output rapi
if (!process.env.DEBUG_TESTS) {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  // vi.spyOn(console, 'error').mockImplementation(() => {});
}
