/**
 * Order agent: handles PLACE_ORDER intent.
 * Delegates to order.service; shippingAddress from request body or must be provided.
 */

const orderService = require('../services/order.service');

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.intent
 * @param {object} input.params
 * @param {object} [input.shippingAddress] - From request body
 * @returns {Promise<{ type: string, message: string, data: object }>}
 */
async function handle({ userId, intent, params, shippingAddress }) {
  const address = shippingAddress || (params && params.shippingAddress);
  if (!address || typeof address !== 'object') {
    throw new Error('Shipping address is required to place an order. Please provide fullName, phone, address, city, state, and pincode.');
  }

  const body = { shippingAddress: address };
  const order = await orderService.createOrder(userId, body);

  return {
    type: 'order_created',
    message: `Order placed successfully. Order ID: ${order._id}. You can proceed to checkout.`,
    data: {
      orderId: order._id.toString(),
      totalAmount: order.totalAmount,
      items: order.items,
      shippingAddress: order.shippingAddress,
    },
    suggestions: ['Proceed to checkout', 'View order'],
  };
}

module.exports = { handle };
