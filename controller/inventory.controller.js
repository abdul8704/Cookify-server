const inventoryService = require('../service/inventory.service');

const listInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await inventoryService.listInventoryForUser(userId);
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error('List inventory error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const item = await inventoryService.getInventoryItemById(userId, id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (err) {
    console.error('Get inventory item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createOrUpdateInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ingredientId, type, imageURL } = req.body || {};

    if (!ingredientId) {
      return res.status(400).json({ success: false, message: 'ingredientId is required' });
    }

    const item = await inventoryService.upsertInventoryItem({
      userId,
      ingredientId,
      type: type || 'other',
      imageURL: imageURL || ''
    });

    return res.status(200).json({ success: true, data: item });
  } catch (err) {
    console.error('Create/update inventory item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = { ...req.body };

    // Never allow changing userId directly
    delete updates.userId;

    const item = await inventoryService.updateInventoryItemById(userId, id, updates);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (err) {
    console.error('Update inventory item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const item = await inventoryService.deleteInventoryItemById(userId, id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    return res.status(200).json({ success: true, message: 'Inventory item deleted' });
  } catch (err) {
    console.error('Delete inventory item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listInventory,
  getInventoryItem,
  createOrUpdateInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
};
