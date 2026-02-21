const paymentService = require('../services/payment.service');
const { verifyRazorpayWebhookSignature } = require('../utils/verifySignature');
const config = require('../config');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

async function createOrder(req, res, next) {
  try {
    const { orderId } = req.body;
    const data = await paymentService.createRazorpayOrder(orderId, req.user.id);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

async function verifyPayment(req, res, next) {
  try {
    const result = await paymentService.verifyPayment(req.user.id, req.body);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Razorpay webhook handler. Must be mounted with express.raw({ type: 'application/json' }).
 * Verifies X-Razorpay-Signature, then handles payment.captured to update Order + Payment.
 */
async function webhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const secret = config.razorpay.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = req.body;

  if (!rawBody || !signature || !secret) {
    return res.status(400).json({ status: 'error', message: 'Missing signature or webhook secret' });
  }

  const isValid = verifyRazorpayWebhookSignature(rawBody, signature, secret);
  if (!isValid) {
    return res.status(400).json({ status: 'error', message: 'Invalid webhook signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString ? rawBody.toString() : rawBody);
  } catch {
    return res.status(400).json({ status: 'error', message: 'Invalid JSON body' });
  }

  const event = payload.event;
  if (event === 'payment.captured') {
    const entity = payload.payload?.payment?.entity;
    if (!entity || !entity.order_id) {
      return res.status(200).json({ status: 'ok' });
    }
    const razorpayOrderId = entity.order_id;
    const razorpayPaymentId = entity.id;
    const amount = (entity.amount || 0) / 100;
    const currency = (entity.currency || 'INR').toUpperCase();

    try {
      const order = await Order.findOne({ razorpayOrderId });
      if (!order) {
        return res.status(200).json({ status: 'ok' });
      }
      if (order.paymentStatus === 'PAID') {
        return res.status(200).json({ status: 'ok' });
      }
      order.paymentStatus = 'PAID';
      await order.save();

      await Payment.findOneAndUpdate(
        { order: order._id },
        {
          order: order._id,
          user: order.user,
          provider: 'Razorpay',
          paymentId: razorpayPaymentId,
          status: 'SUCCESS',
          amount,
          currency,
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error('Webhook payment.captured handler error:', err);
      return res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
    }
  }

  res.status(200).json({ status: 'ok' });
}

module.exports = {
  createOrder,
  verifyPayment,
  webhook,
};
