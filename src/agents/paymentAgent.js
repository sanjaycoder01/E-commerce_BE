/**
 * Payment agent: handles CHECKOUT intent.
 * Creates Razorpay order via payment.service; returns data for frontend Checkout.
 * When orderId is omitted (e.g. user taps "Proceed to checkout" after place order), uses latest PENDING order for this user.
 */

const paymentService = require('../services/payment.service');
const orderService = require('../services/order.service');
const { toValidObjectIdString } = require('../utils/mongoId');

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.intent
 * @param {object} input.params - { orderId? }
 * @param {string} [input.orderId] - From request body
 * @returns {Promise<{ type: string, message: string, data: object }>}
 */
async function handle({ userId, intent, params, orderId }) {
  let oid =
    toValidObjectIdString(orderId) ||
    toValidObjectIdString(params && params.orderId);
  if (!oid) {
    oid = await orderService.getLatestPendingOrderId(userId);
  }
  if (!oid) {
    throw new Error('No pending order for checkout. Place an order first, or pass orderId in the request.');
  }

  const checkoutData = await paymentService.createRazorpayOrder(oid, userId);

  return {
    type: 'checkout_ready',
    message: 'Proceed to payment. Use the details below to open Razorpay Checkout on the frontend.',
    data: {
      razorpayOrderId: checkoutData.razorpayOrderId,
      keyId: checkoutData.keyId,
      amount: checkoutData.amount,
      currency: checkoutData.currency,
      orderId: checkoutData.orderId,
    },
    suggestions: ['Complete payment', 'View order'],
  };
}

module.exports = { handle };
