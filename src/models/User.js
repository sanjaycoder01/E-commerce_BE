const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: false,
        trim: true
    },
    phone: {
        type: String,
        required: false,
        trim: true
    },
    street: {
        type: String,
        required: false,
        trim: true
    },
    city: {
        type: String,
        required: false,
        trim: true
    },
    state: {
        type: String,
        required: false,
        trim: true
    },
    pincode: {
        type: String,
        required: false,
        trim: true
    },
    country: {
        type: String,
        required: false,
        trim: true,
        default: 'India'
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    phone: {
        type: String,
        trim: true
    },
    addresses: {
        type: [addressSchema],
        default: []
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
