const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const recordRoutes = require('./record.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/records', recordRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
