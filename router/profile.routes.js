const express = require('express');
const router = express.Router();
const ProfileController = require('../controller/profile.controller');
const { validateProfileUpdate } = require('../validation/profile.validation');

// GET  /api/profile/me   – fetch current user's profile
router.get('/me', ProfileController.getMyProfile);

// PUT  /api/profile/me   – update (upsert) current user's profile
router.put('/me', validateProfileUpdate, ProfileController.updateMyProfile);

module.exports = router;
