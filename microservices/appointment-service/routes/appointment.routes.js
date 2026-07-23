const express = require('express');
const appointmentController = require('../controllers/appointment.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  mongoIdParam,
  doctorIdParam,
  patientIdParam,
  listValidators,
  createValidators,
  updateValidators,
  updateStatusValidators,
} = require('../validators/appointment.validators');

const router = express.Router();

router.use(authenticate);

router.get(
  '/stats/summary',
  authorize('Admin', 'Doctor', 'Nurse'),
  appointmentController.summary
);

router.get(
  '/',
  authorize('Admin', 'Doctor', 'Nurse'),
  listValidators,
  validate,
  appointmentController.list
);

router.get(
  '/doctor/:doctorId',
  authorize('Admin', 'Doctor', 'Nurse'),
  doctorIdParam,
  listValidators,
  validate,
  appointmentController.listByDoctor
);

router.get(
  '/patient/:patientId',
  authorize('Admin', 'Doctor', 'Nurse'),
  patientIdParam,
  listValidators,
  validate,
  appointmentController.listByPatient
);

router.get(
  '/:id',
  authorize('Admin', 'Doctor', 'Nurse'),
  mongoIdParam,
  validate,
  appointmentController.getById
);

router.post(
  '/',
  authorize('Admin', 'Doctor'),
  createValidators,
  validate,
  appointmentController.create
);

router.put(
  '/:id',
  authorize('Admin', 'Doctor'),
  updateValidators,
  validate,
  appointmentController.update
);

router.patch(
  '/:id/status',
  authorize('Admin', 'Doctor'),
  updateStatusValidators,
  validate,
  appointmentController.updateStatus
);

router.delete(
  '/:id',
  authorize('Admin', 'Doctor'),
  mongoIdParam,
  validate,
  appointmentController.remove
);

module.exports = router;
