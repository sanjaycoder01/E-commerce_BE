const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: [true, 'Product is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        default: 1
    },
    priceSnapshot: {
        type: Number,
        required: [true, 'Price snapshot is required'],
        min: [0, 'Price cannot be negative']
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        unique: true
    },
    items: {
        type: [cartItemSchema],
        default: []
    },
    totalPrice: {
        type: Number,
        default: 0,
        min: [0, 'Total price cannot be negative']
    }
}, {
    timestamps: true
});

// Indexes
cartSchema.index({ user: 1 });

// Calculate total price before saving
cartSchema.pre('save', function(next) {
    if (this.items && this.items.length > 0) {
        this.totalPrice = this.items.reduce((total, item) => {
            return total + (item.priceSnapshot * item.quantity);
        }, 0);
    } else {
        this.totalPrice = 0;
    }
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
