const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup/test-setup.js'],
    clearMocks: true,
    restoreMocks: true,
    include: ['tests/**/*.{test,spec}.js'],
    exclude: [
      '**/node_modules/**',
      '**/PAW-ANTARA-WEEK10-main/**',
      '**/dist/**',
      '**/.git/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'controllers/**/*.js',
        'middlewares/**/*.js',
        'routes/**/*.js',
        'services/**/*.js',
        'utils/**/*.js',
      ],
      exclude: [
        'node_modules/**',
        'PAW-ANTARA-WEEK10-main/**',
        'tests/**',
        'views/**',
        'config/**',
      ],
    },
  },
});
