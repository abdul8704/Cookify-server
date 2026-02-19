const express = require('express');
const router = express.Router();
const InventoryController = require('../controller/inventory.controller');
const InventoryValidation = require('../validation/inventory.validation');

// All routes use authenticated user from req.user.id
router.get('/', InventoryController.listInventory);
router.get('/:id', InventoryValidation.validateIdParam, InventoryController.getInventoryItem);
router.post('/', InventoryValidation.validateCreateOrUpdateInventory, InventoryController.createOrUpdateInventoryItem);
router.put('/:id', InventoryValidation.validateUpdateInventory, InventoryController.updateInventoryItem);
router.delete('/:id', InventoryValidation.validateIdParam, InventoryController.deleteInventoryItem);

module.exports = router;
