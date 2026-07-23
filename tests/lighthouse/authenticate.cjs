const { FRONTEND_PORT } = require('../e2e/ports');

/**
 * Authenticate before auditing protected routes.
 * Skips /login so the public sign-in page is measured without a session.
 */
module.exports = async (browser, context = {}) => {
  const targetUrl = context.url || '';
  if (!targetUrl.includes('/dashboard')) {
    return;
  }

  const origin = process.env.E2E_BASE_URL || `http://127.0.0.1:${FRONTEND_PORT}`;
  const page = await browser.newPage();
  await page.goto(`${origin}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#email', { visible: true, timeout: 30000 });
  await page.type('#email', 'doctor1@hospital.local');
  await page.type('#password', 'Password123!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForSelector('h1', { timeout: 30000 });
  await page.close();
};
