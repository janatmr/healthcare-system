const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const optionalBootstrapAdmin = require('../middleware/optionalBootstrapAdmin');
const validate = require('../middleware/validate');
const {
  loginValidators,
  registerValidators,
  changePasswordValidators,
} = require('../validators/auth.validators');

const router = express.Router();

router.post('/login', loginValidators, validate, authController.login);

router.post('/logout', authenticate, authController.logout);

router.post(
  '/register',
  registerValidators,
  validate,
  optionalBootstrapAdmin,
  authController.register
);

router.get('/profile', authenticate, authController.getProfile);

router.patch(
  '/change-password',
  authenticate,
  changePasswordValidators,
  validate,
  authController.changePassword
);

module.exports = router;
