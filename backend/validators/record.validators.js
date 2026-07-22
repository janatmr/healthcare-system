const { body, param, query } = require('express-validator');

const mongoIdParam = [
  param('id').isMongoId().withMessage('Invalid record id'),
];

const listRecordValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('patientId').optional().isMongoId().withMessage('Invalid patientId'),
  query('sort').optional().isString().trim(),
];

const createRecordValidators = [
  body('patientId')
    .notEmpty()
    .withMessage('patientId is required')
    .isMongoId()
    .withMessage('Invalid patientId'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('medication').optional().isArray(),
  body('medication.*').optional().isString(),
  body('labResults').optional().isArray(),
  body('labResults.*.name').optional().trim().notEmpty(),
  body('labResults.*.value').optional().isString(),
  body('labResults.*.unit').optional().isString(),
  body('labResults.*.date').optional().isISO8601().toDate(),
  body('prescriptions').optional().isArray(),
  body('prescriptions.*').optional().isString(),
  body('referrals').optional().isArray(),
  body('referrals.*').optional().isString(),
  body('doctorNotes').optional().trim().isString(),
  body('visitDate').optional().isISO8601().withMessage('visitDate must be a valid date').toDate(),
];

const updateRecordValidators = [
  ...mongoIdParam,
  body('patientId').optional().isMongoId().withMessage('Invalid patientId'),
  body('diagnosis').optional().trim().notEmpty().withMessage('Diagnosis cannot be empty'),
  body('medication').optional().isArray(),
  body('labResults').optional().isArray(),
  body('prescriptions').optional().isArray(),
  body('referrals').optional().isArray(),
  body('doctorNotes').optional().trim().isString(),
  body('visitDate').optional().isISO8601().withMessage('visitDate must be a valid date').toDate(),
];

module.exports = {
  mongoIdParam,
  listRecordValidators,
  createRecordValidators,
  updateRecordValidators,
};
