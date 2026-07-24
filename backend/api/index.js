/**
 * Vercel serverless entry for the Express backend.
 * Local/Docker/K8s continue to use server.js (long-lived process).
 */
const app = require('../app');
const { connectDB } = require('../config/db');

let ready;

async function ensureReady() {
  if (!ready) {
    ready = connectDB();
  }
  await ready;
}

module.exports = async (req, res) => {
  await ensureReady();
  return app(req, res);
};
