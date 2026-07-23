/**
 * Dedicated ports for E2E / Lighthouse so local dev servers are not disturbed.
 */
module.exports = {
  FRONTEND_PORT: Number(process.env.E2E_FRONTEND_PORT) || 3100,
  BACKEND_PORT: Number(process.env.E2E_BACKEND_PORT) || 5100,
  APPOINTMENT_PORT: Number(process.env.E2E_APPOINTMENT_PORT) || 5101,
  JWT_SECRET: process.env.E2E_JWT_SECRET || 'e2e-test-jwt-secret',
};
