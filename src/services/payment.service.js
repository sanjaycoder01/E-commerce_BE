const Razorpay = require('razorpay');
const config = require('../config');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { verifyRazorpaySignature } = require('../utils/verifySignature');
const mongoose = require('mongoose');

const razorpayConfig = config.razorpay;

function getRazorpayInstance() {
  if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
    throw new Error('Razorpay keys are not configured');
  }
  return new Razorpay({
    key_id: razorpayConfig.keyId,
    key_secret: razorpayConfig.keySecret,
  });
}

/**
 * Create a Razorpay order for the given app order. Returns data needed for Razorpay Checkout on frontend.
 * @param {string} orderId - Our Order _id
 * @param {string} userId - Logged-in user id
 */
async function createRazorpayOrder(orderId, userId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error('Invalid order id');
  }

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.paymentStatus === 'PAID') {
    throw new Error('Order is already paid');
  }

  const amountPaise = Math.round(order.totalAmount * 100);
  if (amountPaise < 100) {
    throw new Error('Amount must be at least 1 INR');
  }

  const razorpay = getRazorpayInstance();
  const options = {
    amount: amountPaise,
    currency: razorpayConfig.currency || 'INR',
    receipt: orderId.toString(),
  };

  const razorpayOrder = await razorpay.orders.create(options);

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  return {
    razorpayOrderId: razorpayOrder.id,
    keyId: razorpayConfig.keyId,
    amount: order.totalAmount,
    currency: razorpayConfig.currency || 'INR',
    orderId: order._id.toString(),
  };
}

/**
 * Verify payment signature from Razorpay Checkout and update Order + Payment.
 * @param {string} userId
 * @param {object} body - { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
 */
async function verifyPayment(userId, body) {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new Error('Missing required fields: orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature');
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error('Invalid order id');
  }

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.paymentStatus === 'PAID') {
    return { order, payment: await Payment.findOne({ order: order._id }).lean(), alreadyPaid: true };
  }
  if (order.razorpayOrderId !== razorpayOrderId) {
    throw new Error('Razorpay order does not match');
  }

  const isValid = verifyRazorpaySignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    razorpayConfig.keySecret
  );
  if (!isValid) {
    throw new Error('Invalid payment signature');
  }

  order.paymentStatus = 'PAID';
  await order.save();

  const payment = await Payment.findOneAndUpdate(
    { order: order._id },
    {
      order: order._id,
      user: new mongoose.Types.ObjectId(userId),
      provider: 'Razorpay',
      paymentId: razorpayPaymentId,
      status: 'SUCCESS',
      amount: order.totalAmount,
      currency: razorpayConfig.currency || 'INR',
    },
    { upsert: true, new: true }
  ).lean();

  return { order: order.toObject ? order.toObject() : order, payment, alreadyPaid: false };
}

module.exports = {
  createRazorpayOrder,
  verifyPayment,
};
