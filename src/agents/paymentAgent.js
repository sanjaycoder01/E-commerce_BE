/**
 * Payment agent: handles CHECKOUT intent.
 * Creates Razorpay order via payment.service; returns data for frontend Checkout.
 */

const paymentService = require('../services/payment.service');

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.intent
 * @param {object} input.params - { orderId? }
 * @param {string} [input.orderId] - From request body
 * @returns {Promise<{ type: string, message: string, data: object }>}
 */
async function handle({ userId, intent, params, orderId }) {
  const oid = orderId || (params && params.orderId);
  if (!oid || !String(oid).trim()) {
    throw new Error('Order ID is required for checkout. Please place an order first or provide the orderId.');
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
