/**
 * Chat orchestrator: receives chat message, detects intent, routes to correct agent,
 * returns unified JSON for frontend chat UI.
 * Compound messages ("show cart and list phones") use swarm planning: multiple intents
 * in one turn (parallel reads, sequential mutations).
 * All business logic lives in agents/services; this layer only routes and formats.
 */

const intentService = require('../services/intent.service');
const swarmPlanner = require('../services/swarmPlanner.service');
const swarmExecutor = require('../services/swarmExecutor.service');
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
    const swarmPlan = await swarmPlanner.buildPlan(message || '', context);

    if (swarmPlan.mode === 'swarm' && swarmPlan.steps && swarmPlan.steps.length >= 2) {
      const result = await swarmExecutor.execute(swarmPlan.steps, {
        userId,
        productId,
        quantity,
        orderId,
        shippingAddress,
      });
      return res.status(200).json(result);
    }

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
