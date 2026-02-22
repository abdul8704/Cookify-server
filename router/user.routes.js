const express = require('express');
const router = express.Router();
const UserController = require('../controller/user.controller.js');
const UserValidation = require('../validation/user.validation.js');
const requireAdmin = require('../middleware/admin.middleware');

router.get('/me', UserController.getMe);
router.get('/', requireAdmin, UserController.getAllUsers);
router.get('/:id', UserValidation.validateIdParam, UserController.getUserById);
router.post('/', UserValidation.validateCreateUser, UserController.createUser);
router.put('/:id', UserValidation.validateUpdateUser, UserController.updateUser);
router.patch('/:id/role', requireAdmin, UserController.updateUserRole);
router.delete('/:id', requireAdmin, UserValidation.validateDeleteUser, UserController.deleteUser);

module.exports = router;