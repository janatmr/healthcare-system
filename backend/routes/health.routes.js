const express = require('express');

const router = express.Router();

/**
 * GET /health
 * Liveness probe — no auth, no database dependency.
 */
router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
