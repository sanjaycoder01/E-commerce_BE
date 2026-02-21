/**
 * Confirmation agent: handles GET_ORDER_STATUS (and post-payment confirmation).
 * Delegates to order.service; can return single order or list.
 */

const orderService = require('../services/order.service');

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.intent - GET_ORDER_STATUS
 * @param {object} input.params - { orderId? }
 * @param {string} [input.orderId] - From request body
 * @returns {Promise<{ type: string, message: string, data: object }>}
 */
async function handle({ userId, intent, params, orderId }) {
  const oid = orderId || (params && params.orderId);

  if (oid && String(oid).trim()) {
    const order = await orderService.getOrderById(userId, oid);
    return {
      type: 'order_confirmed',
      message: `Order ${order._id}: ${order.orderStatus}, Payment: ${order.paymentStatus}.`,
      data: order,
      suggestions: ['Track order', 'Browse more'],
    };
  }

  // No orderId: return recent orders list
  const orders = await orderService.getOrders(userId);
  const message = orders.length === 0 ? 'You have no orders yet.' : `You have ${orders.length} order(s).`;
  return {
    type: 'order_confirmed',
    message,
    data: { orders },
    suggestions: orders.length > 0 ? ['View order details', 'Browse products'] : ['Browse products'],
  };
}

module.exports = { handle };
