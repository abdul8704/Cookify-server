const express = require('express');
const router = express.Router();
const UserController = require('../controller/user.controller.js');
const UserValidation = require('../validation/user.validation.js');

router.get('/', UserController.getAllUsers);
router.get('/:id', UserValidation.validateIdParam, UserController.getUserById);
router.post('/', UserValidation.validateCreateUser, UserController.createUser);
router.put('/:id', UserValidation.validateUpdateUser, UserController.updateUser);
router.delete('/:id', UserValidation.validateDeleteUser, UserController.deleteUser);

module.exports = router;