const InventoryItem = require('../models/Inventory.model');

async function listInventoryForUser(userId) {
  return InventoryItem.find({ userId }).populate('ingredientId');
}

async function getInventoryItemById(userId, itemId) {
  return InventoryItem.findOne({ _id: itemId, userId }).populate('ingredientId');
}

async function upsertInventoryItem({ userId, ingredientId, type, quantity, units }) {
  const filter = { userId, ingredientId, type };
  const update = { quantity, units };

  const options = {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true
  };

  return InventoryItem.findOneAndUpdate(filter, update, options);
}

async function updateInventoryItemById(userId, itemId, updates) {
  return InventoryItem.findOneAndUpdate(
    { _id: itemId, userId },
    updates,
    { new: true, runValidators: true }
  );
}

async function deleteInventoryItemById(userId, itemId) {
  return InventoryItem.findOneAndDelete({ _id: itemId, userId });
}

module.exports = {
  listInventoryForUser,
  getInventoryItemById,
  upsertInventoryItem,
  updateInventoryItemById,
  deleteInventoryItemById
};
