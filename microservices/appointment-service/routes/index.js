const express = require('express');
const healthRoutes = require('./health.routes');
const appointmentRoutes = require('./appointment.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/appointments', appointmentRoutes);

module.exports = router;
