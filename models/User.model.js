const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    username: {
        type: String,   
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('User', userSchema);