const { body, param, query } = require('express-validator');
const {
  GENDERS,
  BLOOD_GROUPS,
  STATUSES,
} = require('../models/Patient');

const mongoIdParam = [
  param('id').isMongoId().withMessage('Invalid patient id'),
];

const listPatientValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  query('search').optional().isString().trim(),
  query('sort').optional().isString().trim(),
];

const createPatientValidators = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(GENDERS)
    .withMessage(`Gender must be one of: ${GENDERS.join(', ')}`),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .toDate(),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('address').optional().trim().isString(),
  body('bloodGroup')
    .optional()
    .isIn(BLOOD_GROUPS)
    .withMessage(`bloodGroup must be one of: ${BLOOD_GROUPS.join(', ')}`),
  body('emergencyContact').optional().isObject(),
  body('emergencyContact.name').optional().trim().isString(),
  body('emergencyContact.phone').optional().trim().isString(),
  body('emergencyContact.relationship').optional().trim().isString(),
  body('allergies').optional().isArray(),
  body('allergies.*').optional().isString(),
  body('medicalConditions').optional().isArray(),
  body('medicalConditions.*').optional().isString(),
  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(', ')}`),
];

const updatePatientValidators = [
  ...mongoIdParam,
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('gender')
    .optional()
    .isIn(GENDERS)
    .withMessage(`Gender must be one of: ${GENDERS.join(', ')}`),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .toDate(),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('address').optional().trim().isString(),
  body('bloodGroup')
    .optional()
    .isIn(BLOOD_GROUPS)
    .withMessage(`bloodGroup must be one of: ${BLOOD_GROUPS.join(', ')}`),
  body('emergencyContact').optional().isObject(),
  body('allergies').optional().isArray(),
  body('medicalConditions').optional().isArray(),
  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(', ')}`),
];

const updateStatusValidators = [
  ...mongoIdParam,
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(', ')}`),
];

module.exports = {
  mongoIdParam,
  listPatientValidators,
  createPatientValidators,
  updatePatientValidators,
  updateStatusValidators,
};
