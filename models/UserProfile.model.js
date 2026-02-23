const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    goals: {
      type: String,
      enum: ['weightloss', 'weightgain', 'maintain'],
      default: 'maintain',
    },
    height: {
      type: Number, // in cm
      default: null,
    },
    weight: {
      type: Number, // in kg
      default: null,
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active', ''],
      default: '',
    },
    dietaryPreferences: {
      type: [String], // e.g. ['vegetarian', 'gluten-free']
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
