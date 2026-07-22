const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.get(
  '/statistics',
  authorize('Admin', 'Doctor', 'Nurse'),
  dashboardController.getStatistics
);

module.exports = router;
