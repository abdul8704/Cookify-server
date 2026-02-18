const express = require('express');
const router = express.Router();
const AuthController = require('../controller/auth.controller');
const AuthValidation = require('../validation/auth.validation');

router.post('/register', AuthValidation.validateRegister, AuthController.register);
router.post('/login', AuthValidation.validateLogin, AuthController.login);

module.exports = router;
