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
const { swarmLog } = require('../utils/swarmLog');
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
    case INTENTS.GREETING:
      return {
        type: 'message',
        message:
          "Hi! I'm your shopping assistant. Ask me to list products, add items to your cart, view your cart, place an order, or checkout.",
        data: null,
      };
    case INTENTS.UNKNOWN:
      return {
        type: 'unknown',
        message: "I didn't understand that. You can ask to list products, add to cart, view cart, place order, or checkout.",
        data: null,
        suggestions: ['List products', 'Place order'],
      };
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
    swarmLog('execute: empty steps → unknown response');
    return {
      type: 'unknown',
      message: "I didn't understand that.",
      data: null,
      suggestions: ['List products', 'Place order'],
    };
  }

  if (steps.length === 1) {
    const step = steps[0];
    swarmLog('execute: single step', { intent: step.intent });
    const stepStart = Date.now();
    try {
      const out = await dispatchStep(step, ctx);
      swarmLog(`execute: step 0 ${step.intent} → ${out.type} (${Date.now() - stepStart}ms)`);
      return out;
    } catch (err) {
      swarmLog(`execute: step 0 ${step.intent} FAILED`, { error: err.message });
      throw err;
    }
  }

  const allRead = steps.every((s) => isReadOnlyIntent(s.intent));
  const strategy = allRead ? 'parallel (read-only)' : 'sequential (writes or mixed)';
  swarmLog('execute: start', {
    strategy,
    intents: steps.map((s) => s.intent),
    userId: ctx.userId,
  });

  let outcomes;
  if (allRead) {
    const t0 = Date.now();
    outcomes = await Promise.all(
      steps.map(async (step, i) => {
        const stepStart = Date.now();
        try {
          const out = await dispatchStep(step, ctx);
          swarmLog(`execute: step ${i} ${step.intent} → ${out.type} (${Date.now() - stepStart}ms)`);
          return out;
        } catch (err) {
          swarmLog(`execute: step ${i} ${step.intent} FAILED`, { error: err.message });
          throw err;
        }
      }),
    );
    swarmLog(`execute: parallel batch done (${Date.now() - t0}ms total)`);
  } else {
    outcomes = [];
    const t0 = Date.now();
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStart = Date.now();
      try {
        const out = await dispatchStep(step, ctx);
        swarmLog(`execute: step ${i} ${step.intent} → ${out.type} (${Date.now() - stepStart}ms)`);
        outcomes.push(out);
      } catch (err) {
        swarmLog(`execute: step ${i} ${step.intent} FAILED`, { error: err.message });
        throw err;
      }
    }
    swarmLog(`execute: sequential chain done (${Date.now() - t0}ms total)`);
  }

  const merged = mergeOutcomes(outcomes);
  swarmLog('execute: merged response', {
    type: merged.type,
    resultTypes: outcomes.map((o) => o.type),
  });
  return merged;
}

module.exports = {
  execute,
  dispatchStep,
  isReadOnlyIntent,
};
