/**
 * Intent detection for conversational commerce.
 * Uses OpenAI to classify user message and extract params; falls back to keyword matching
 * when OPENAI_API_KEY is missing or the API call fails.
 * AI is used only in this layer — all business logic remains deterministic in services/agents.
 */

const OpenAI = require('openai');

const INTENTS = Object.freeze({
  LIST_PRODUCTS: 'LIST_PRODUCTS',
  ADD_TO_CART: 'ADD_TO_CART',
  PLACE_ORDER: 'PLACE_ORDER',
  CHECKOUT: 'CHECKOUT',
  GET_ORDER_STATUS: 'GET_ORDER_STATUS',
  GET_CART: 'GET_CART',
  UNKNOWN: 'UNKNOWN',
});

/**
 * Detect intent and extract params from user message.
 * @param {string} message - User's chat message
 * @param {object} context - Optional { productId, orderId } from request body (UI selection)
 * @returns {Promise<{ intent: string, params: object }>}
 */
async function detectIntent(message, context = {}) {
  const trimmed = (message && String(message).trim()) || '';
  if (!trimmed) {
    return { intent: INTENTS.UNKNOWN, params: {} };
  }

  try {
    const openai = getOpenAIClient();
    if (openai) {
      const result = await detectIntentWithOpenAI(openai, trimmed, context);
      if (result) return result;
    }
  } catch (err) {
    console.warn('Intent detection (OpenAI) failed, using fallback:', err.message);
  }

  return detectIntentFallback(trimmed, context);
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  return new OpenAI({ apiKey: apiKey.trim() });
}

/**
 * Use OpenAI chat completion with tool/function to get structured intent + params.
 */
async function detectIntentWithOpenAI(openai, message, context) {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an intent classifier for an e-commerce chat. Classify the user message into exactly one intent and extract relevant parameters. Use the context when provided (e.g. productId, orderId from the UI). Respond only with the tool call.`,
      },
      {
        role: 'user',
        content: [
          message,
          context.productId ? `[Context: productId=${context.productId}]` : '',
          context.orderId ? `[Context: orderId=${context.orderId}]` : '',
        ].filter(Boolean).join(' '),
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'set_intent',
          description: 'Set the detected intent and parameters for the e-commerce flow',
          parameters: {
            type: 'object',
            properties: {
              intent: {
                type: 'string',
                enum: [
                  INTENTS.LIST_PRODUCTS,
                  INTENTS.ADD_TO_CART,
                  INTENTS.PLACE_ORDER,
                  INTENTS.CHECKOUT,
                  INTENTS.GET_ORDER_STATUS,
                  INTENTS.GET_CART,
                  INTENTS.UNKNOWN,
                ],
                description: 'The detected intent',
              },
              query: { type: 'string', description: 'Search query for product name (LIST_PRODUCTS)' },
              category: { type: 'string', description: 'Category name e.g. laptop, phone (LIST_PRODUCTS)' },
              maxPrice: { type: 'number', description: 'Maximum price in INR (LIST_PRODUCTS)' },
              minPrice: { type: 'number', description: 'Minimum price in INR (LIST_PRODUCTS)' },
              productId: { type: 'string', description: 'MongoDB ObjectId of product (ADD_TO_CART)' },
              quantity: { type: 'number', description: 'Quantity (ADD_TO_CART), default 1' },
              orderId: { type: 'string', description: 'Order ID for CHECKOUT or GET_ORDER_STATUS' },
            },
            required: ['intent'],
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'set_intent' } },
    max_tokens: 256,
  });

  const choice = response.choices && response.choices[0];
  const toolCalls = choice && choice.message && choice.message.tool_calls;
  if (!toolCalls || toolCalls.length === 0) {
    return { intent: INTENTS.UNKNOWN, params: {} };
  }

  const args = toolCalls[0].function?.arguments;
  if (!args) return { intent: INTENTS.UNKNOWN, params: {} };

  let parsed;
  try {
    parsed = JSON.parse(args);
  } catch {
    return { intent: INTENTS.UNKNOWN, params: {} };
  }

  const intent = parsed.intent && INTENTS[parsed.intent] ? parsed.intent : INTENTS.UNKNOWN;
  const params = { ...parsed };
  delete params.intent;

  // Merge context: body productId/orderId override or fill in
  if (context.productId && (intent === INTENTS.ADD_TO_CART || intent === INTENTS.LIST_PRODUCTS)) {
    params.productId = params.productId || context.productId;
  }
  if (context.orderId && (intent === INTENTS.CHECKOUT || intent === INTENTS.GET_ORDER_STATUS)) {
    params.orderId = params.orderId || context.orderId;
  }

  return { intent, params };
}

/**
 * Keyword-based fallback when OpenAI is unavailable.
 */
function detectIntentFallback(message, context) {
  const lower = message.toLowerCase();

  if (/\b(list|show|search|find|get|browse|products?|items?)\b/.test(lower) && !/\b(cart|order|checkout|pay)\b/.test(lower)) {
    const maxMatch = message.match(/(?:under|below|less than)\s*(?:rs\.?|inr)?\s*(\d+)/i);
    const minMatch = message.match(/(?:above|over|more than)\s*(?:rs\.?|inr)?\s*(\d+)/i);
    const params = {};
    if (maxMatch) params.maxPrice = Number(maxMatch[1]);
    if (minMatch) params.minPrice = Number(minMatch[1]);
    return { intent: INTENTS.LIST_PRODUCTS, params };
  }

  if (/\b(add|put)\b.*\b(cart)\b|\b(cart)\b.*\b(add|put)\b/.test(lower) || (context.productId && /add|cart/i.test(lower))) {
    return {
      intent: INTENTS.ADD_TO_CART,
      params: { productId: context.productId || '', quantity: 1 },
    };
  }

  if (/\b(view\s+)?cart\b|\b(my\s+)?cart\b/.test(lower)) {
    return { intent: INTENTS.GET_CART, params: {} };
  }

  if (/\bplace\s+order\b|\bplace\s+order\b|order\s+now\b/.test(lower)) {
    return { intent: INTENTS.PLACE_ORDER, params: {} };
  }

  if (/\bcheckout\b|\bpay\b|\bpayment\b/.test(lower) || context.orderId) {
    return { intent: INTENTS.CHECKOUT, params: { orderId: context.orderId || '' } };
  }

  if (/\b(order\s+status\b|status\s+of\s+order|track\s+order)\b/.test(lower)) {
    return { intent: INTENTS.GET_ORDER_STATUS, params: { orderId: context.orderId || '' } };
  }

  return { intent: INTENTS.UNKNOWN, params: {} };
}

module.exports = { detectIntent, INTENTS };
