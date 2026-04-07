/**
 * Swarm executor: runs multiple agent steps from a swarm plan.
 * Read-only intents run in parallel; any mutation runs steps sequentially in order.
 */

const productAgent = require('../agents/productAgent');
const cartAgent = require('../agents/cartAgent');
const orderAgent = require('../agents/orderAgent');
const paymentAgent = require('../agents/paymentAgent');
const confirmationAgent = require('../agents/confirmationAgent');

const intentService = require('./intent.service');
const { INTENTS } = intentService;

const READ_INTENTS = new Set([
  INTENTS.LIST_PRODUCTS,
  INTENTS.GET_CART,
  INTENTS.GET_ORDER_STATUS,
]);

function isReadOnlyIntent(intent) {
  return READ_INTENTS.has(intent);
}

/**
 * @param {object} ctx
 * @param {string} ctx.userId
 * @param {string} [ctx.productId]
 * @param {number} [ctx.quantity]
 * @param {string} [ctx.orderId]
 * @param {object} [ctx.shippingAddress]
 */
async function dispatchStep({ intent, params }, ctx) {
  const { userId, productId, quantity, orderId, shippingAddress } = ctx;

  switch (intent) {
    case INTENTS.LIST_PRODUCTS:
      return productAgent.handle({ userId, intent, params });
    case INTENTS.ADD_TO_CART:
    case INTENTS.GET_CART:
      return cartAgent.handle({ userId, intent, params, productId, quantity });
    case INTENTS.PLACE_ORDER:
      return orderAgent.handle({ userId, intent, params, shippingAddress });
    case INTENTS.CHECKOUT:
      return paymentAgent.handle({ userId, intent, params, orderId });
    case INTENTS.GET_ORDER_STATUS:
      return confirmationAgent.handle({ userId, intent, params, orderId });
    default:
      return {
        type: 'unknown',
        message: 'Unsupported intent in swarm step.',
        data: null,
        suggestions: [],
      };
  }
}

function mergeOutcomes(outcomes) {
  const messages = outcomes.map((o) => o.message).filter(Boolean);
  const suggestionSets = outcomes.flatMap((o) => (Array.isArray(o.suggestions) ? o.suggestions : []));
  const seen = new Set();
  const suggestions = [];
  for (const s of suggestionSets) {
    if (s && !seen.has(s)) {
      seen.add(s);
      suggestions.push(s);
      if (suggestions.length >= 8) break;
    }
  }

  return {
    type: 'swarm',
    message: messages.join(' '),
    data: {
      results: outcomes.map((o, stepIndex) => ({
        stepIndex,
        type: o.type,
        message: o.message,
        data: o.data,
        suggestions: o.suggestions,
      })),
    },
    suggestions,
  };
}

/**
 * @param {Array<{ intent: string, params: object }>} steps
 * @param {object} ctx
 */
async function execute(steps, ctx) {
  if (!steps || steps.length === 0) {
    return {
      type: 'unknown',
      message: "I didn't understand that.",
      data: null,
      suggestions: ['List products', 'View cart'],
    };
  }

  const allRead = steps.every((s) => isReadOnlyIntent(s.intent));

  let outcomes;
  if (allRead) {
    outcomes = await Promise.all(steps.map((step) => dispatchStep(step, ctx)));
  } else {
    outcomes = [];
    for (const step of steps) {
      outcomes.push(await dispatchStep(step, ctx));
    }
  }

  return mergeOutcomes(outcomes);
}

module.exports = {
  execute,
  dispatchStep,
  isReadOnlyIntent,
};
