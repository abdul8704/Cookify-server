const express = require('express');
const router = express.Router();
const AuthController = require('../controller/auth.controller');
const AuthValidation = require('../validation/auth.validation');
const PasswordResetController = require('../controller/passwordReset.controller');
const PasswordResetValidation = require('../validation/passwordReset.validation');

router.post('/register', AuthValidation.validateRegister, AuthController.register);
router.post('/login', AuthValidation.validateLogin, AuthController.login);
router.post('/check-username', AuthValidation.validateCheckUsername, AuthController.checkUsername);
router.post('/refresh', AuthValidation.validateRefresh, AuthController.refresh);
router.post('/logout', AuthController.logout);

// Password reset flow
router.post('/forgot-password', PasswordResetValidation.validateForgotPassword, PasswordResetController.forgotPassword);
router.post('/verify-otp', PasswordResetValidation.validateVerifyOTP, PasswordResetController.verifyOTP);
router.post('/reset-password', PasswordResetValidation.validateResetPassword, PasswordResetController.resetPassword);

module.exports = router;
