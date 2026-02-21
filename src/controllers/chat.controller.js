/**
 * Chat orchestrator: receives chat message, detects intent, routes to correct agent,
 * returns unified JSON for frontend chat UI.
 * All business logic lives in agents/services; this layer only routes and formats.
 */

const intentService = require('../services/intent.service');
const productAgent = require('../agents/productAgent');
const cartAgent = require('../agents/cartAgent');
const orderAgent = require('../agents/orderAgent');
const paymentAgent = require('../agents/paymentAgent');
const confirmationAgent = require('../agents/confirmationAgent');

const { INTENTS } = intentService;

/**
 * POST /api/chat
 * Body: { message, productId?, quantity?, orderId?, shippingAddress? }
 */
async function chat(req, res, next) {
  try {
    const { message, productId, quantity, orderId, shippingAddress } = req.body || {};
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        type: 'error',
        message: 'Unauthorized. Please log in.',
      });
    }

    const context = { productId, orderId };
    const { intent, params } = await intentService.detectIntent(message || '', context);

    let result;
    switch (intent) {
      case INTENTS.LIST_PRODUCTS:
        result = await productAgent.handle({ userId, intent, params });
        break;
      case INTENTS.ADD_TO_CART:
      case INTENTS.GET_CART:
        result = await cartAgent.handle({ userId, intent, params, productId, quantity });
        break;
      case INTENTS.PLACE_ORDER:
        result = await orderAgent.handle({ userId, intent, params, shippingAddress });
        break;
      case INTENTS.CHECKOUT:
        result = await paymentAgent.handle({ userId, intent, params, orderId });
        break;
      case INTENTS.GET_ORDER_STATUS:
        result = await confirmationAgent.handle({ userId, intent, params, orderId });
        break;
      default:
        result = {
          type: 'unknown',
          message: "I didn't understand that. You can ask to list products, add to cart, view cart, place order, or checkout.",
          data: null,
          suggestions: ['List products', 'View cart', 'Place order'],
        };
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      type: 'error',
      message: err.message || 'Something went wrong. Please try again.',
      data: null,
    });
  }
}

module.exports = { chat };
