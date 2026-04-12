/**
 * Order agent: handles PLACE_ORDER intent.
 * Uses shippingAddress from the chat request when complete; otherwise loads from user profile (same data as GET /api/auth/profile).
 */

const orderService = require('../services/order.service');
const profileService = require('../services/profile.service');

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.intent
 * @param {object} input.params
 * @param {object} [input.shippingAddress] - From request body
 * @returns {Promise<{ type: string, message: string, data: object }>}
 */
async function handle({ userId, intent, params, shippingAddress }) {
  let address = shippingAddress || (params && params.shippingAddress);
  if (!profileService.hasCompleteShippingShape(address)) {
    const fromProfile = await profileService.getShippingAddressForOrder(userId);
    if (fromProfile) {
      address = fromProfile;
    }
  }

  if (!address || typeof address !== 'object' || !profileService.hasCompleteShippingShape(address)) {
    throw new Error(
      'No complete shipping address. Add one in your profile (street, city, state, pincode, and name/phone) via PATCH /api/auth/updateprofile, or send shippingAddress in the chat request.',
    );
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
