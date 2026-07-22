const express = require('express');
const patientController = require('../controllers/patient.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  mongoIdParam,
  listPatientValidators,
  createPatientValidators,
  updatePatientValidators,
  updateStatusValidators,
} = require('../validators/patient.validators');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize('Admin', 'Doctor', 'Nurse'),
  listPatientValidators,
  validate,
  patientController.list
);

router.get(
  '/:id',
  authorize('Admin', 'Doctor', 'Nurse'),
  mongoIdParam,
  validate,
  patientController.getById
);

router.post(
  '/',
  authorize('Admin', 'Doctor'),
  createPatientValidators,
  validate,
  patientController.create
);

router.put(
  '/:id',
  authorize('Admin', 'Doctor'),
  updatePatientValidators,
  validate,
  patientController.update
);

router.patch(
  '/:id/status',
  authorize('Admin', 'Doctor', 'Nurse'),
  updateStatusValidators,
  validate,
  patientController.updateStatus
);

router.delete(
  '/:id',
  authorize('Admin', 'Doctor'),
  mongoIdParam,
  validate,
  patientController.remove
);

module.exports = router;
