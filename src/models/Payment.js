const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    provider: {
        type: String,
        enum: ['Razorpay', 'Stripe'],
        required: [true, 'Payment provider is required']
    },
    paymentId: {
        type: String,
        required: [true, 'Payment ID is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['CREATED', 'SUCCESS', 'FAILED', 'REFUNDED'],
        default: 'CREATED'
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    currency: {
        type: String,
        required: [true, 'Currency is required'],
        default: 'INR',
        uppercase: true
    }
}, {
    timestamps: true
});

// Indexes
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
