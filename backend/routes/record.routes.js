const express = require('express');
const recordController = require('../controllers/record.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  mongoIdParam,
  listRecordValidators,
  createRecordValidators,
  updateRecordValidators,
} = require('../validators/record.validators');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize('Admin', 'Doctor', 'Nurse'),
  listRecordValidators,
  validate,
  recordController.list
);

router.get(
  '/:id',
  authorize('Admin', 'Doctor', 'Nurse'),
  mongoIdParam,
  validate,
  recordController.getById
);

router.post(
  '/',
  authorize('Admin', 'Doctor'),
  createRecordValidators,
  validate,
  recordController.create
);

router.put(
  '/:id',
  authorize('Admin', 'Doctor'),
  updateRecordValidators,
  validate,
  recordController.update
);

router.delete(
  '/:id',
  authorize('Admin', 'Doctor'),
  mongoIdParam,
  validate,
  recordController.remove
);

module.exports = router;
