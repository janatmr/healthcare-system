const { FRONTEND_PORT } = require('./tests/e2e/ports');

const origin = process.env.E2E_BASE_URL || `http://127.0.0.1:${FRONTEND_PORT}`;

module.exports = {
  ci: {
    collect: {
      url: [`${origin}/login`, `${origin}/dashboard`],
      startServerCommand: 'node tests/e2e/start-test-stack.js',
      startServerReadyPattern: 'Stack ready',
      startServerReadyTimeout: 240000,
      numberOfRuns: 2,
      puppeteerScript: './tests/lighthouse/authenticate.cjs',
      puppeteerLaunchOptions: {
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      },
      settings: {
        preset: 'desktop',
        disableStorageReset: true,
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
