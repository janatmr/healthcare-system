const { body, param, query } = require('express-validator');
const { STATUSES } = require('../models/Appointment');

const mongoIdParam = [
  param('id').isMongoId().withMessage('Invalid appointment id'),
];

const doctorIdParam = [
  param('doctorId').isMongoId().withMessage('Invalid doctorId'),
];

const patientIdParam = [
  param('patientId').isMongoId().withMessage('Invalid patientId'),
];

const listValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  query('doctorId').optional().isMongoId().withMessage('Invalid doctorId'),
  query('patientId').optional().isMongoId().withMessage('Invalid patientId'),
  query('date').optional().isISO8601().withMessage('date must be a valid date'),
  query('sort').optional().isString().trim(),
];

const createValidators = [
  body('patientId').notEmpty().withMessage('patientId is required').isMongoId().withMessage('Invalid patientId'),
  body('doctorId').notEmpty().withMessage('doctorId is required').isMongoId().withMessage('Invalid doctorId'),
  body('appointmentDate')
    .notEmpty()
    .withMessage('appointmentDate is required')
    .isISO8601()
    .withMessage('appointmentDate must be a valid date')
    .toDate(),
  body('appointmentTime')
    .notEmpty()
    .withMessage('appointmentTime is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('appointmentTime must be HH:mm'),
  body('duration').optional().isInt({ min: 5 }).withMessage('duration must be at least 5 minutes'),
  body('department').trim().notEmpty().withMessage('department is required'),
  body('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  body('notes').optional().trim().isString(),
];

const updateValidators = [
  ...mongoIdParam,
  body('patientId').optional().isMongoId().withMessage('Invalid patientId'),
  body('doctorId').optional().isMongoId().withMessage('Invalid doctorId'),
  body('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('appointmentDate must be a valid date')
    .toDate(),
  body('appointmentTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('appointmentTime must be HH:mm'),
  body('duration').optional().isInt({ min: 5 }).withMessage('duration must be at least 5 minutes'),
  body('department').optional().trim().notEmpty().withMessage('department cannot be empty'),
  body('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  body('notes').optional().trim().isString(),
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
  doctorIdParam,
  patientIdParam,
  listValidators,
  createValidators,
  updateValidators,
  updateStatusValidators,
};
