/**
 * Intent detection for conversational commerce.
 * Uses Groq to classify user message and extract params; falls back to keyword matching
 * when GROQ_API_KEY is missing or the API call fails.
 * AI is used only in this layer — all business logic remains deterministic in services/agents.
 */

const Groq = require('groq-sdk');

const INTENTS = Object.freeze({
  LIST_PRODUCTS: 'LIST_PRODUCTS',
  ADD_TO_CART: 'ADD_TO_CART',
  PLACE_ORDER: 'PLACE_ORDER',
  CHECKOUT: 'CHECKOUT',
  GET_ORDER_STATUS: 'GET_ORDER_STATUS',
  GET_CART: 'GET_CART',
  GREETING: 'GREETING',
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
    const groq = getGroqClient();
    if (groq) {
      const result = await detectIntentWithGroq(groq, trimmed, context);
      if (result) {
        if (result.intent === INTENTS.UNKNOWN && looksLikeGreetingOnly(trimmed)) {
          return { intent: INTENTS.GREETING, params: {} };
        }
        return result;
      }
    }
  } catch (err) {
    console.warn('Intent detection (Groq) failed, using fallback:', err.message);
  }

  return detectIntentFallback(trimmed, context);
}

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  return new Groq({ apiKey: apiKey.trim() });
}

/** Drop null/undefined so Groq tool args with explicit nulls do not break downstream merges. */
function omitNullish(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v != null) out[k] = v;
  }
  return out;
}

/**
 * Use Groq chat completion with tool/function to get structured intent + params.
 */
async function detectIntentWithGroq(groq, message, context) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are an intent classifier for an e-commerce chat. Classify the user message into exactly one intent and extract relevant parameters. Use GREETING for short hellos, thanks, goodbyes, or small talk with no shopping action (e.g. "hi", "thank you"). Use the context when provided (e.g. productId, orderId from the UI). Respond only with the tool call.`,
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
                  INTENTS.GREETING,
                  INTENTS.UNKNOWN,
                ],
                description: 'The detected intent',
              },
              query: {
                type: ['string', 'null'],
                description: 'Search query for product name (LIST_PRODUCTS); omit or null if unused',
              },
              category: {
                type: ['string', 'null'],
                description: 'Category name e.g. laptop, phone (LIST_PRODUCTS); omit or null if unused',
              },
              maxPrice: {
                type: ['number', 'null'],
                description: 'Maximum price in INR (LIST_PRODUCTS); omit or null if unused',
              },
              minPrice: {
                type: ['number', 'null'],
                description: 'Minimum price in INR (LIST_PRODUCTS); omit or null if unused',
              },
              productId: {
                type: ['string', 'null'],
                description: 'MongoDB ObjectId of product (ADD_TO_CART); omit or null if unused',
              },
              quantity: {
                type: ['number', 'null'],
                description: 'Quantity (ADD_TO_CART), default 1; omit or null if unused',
              },
              orderId: {
                type: ['string', 'null'],
                description: 'Order ID for CHECKOUT or GET_ORDER_STATUS; omit or null if unused',
              },
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
  const params = omitNullish(parsed);
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
 * Keyword-based fallback when Groq is unavailable.
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

  if (looksLikeGreetingOnly(message)) {
    return { intent: INTENTS.GREETING, params: {} };
  }

  return { intent: INTENTS.UNKNOWN, params: {} };
}

/**
 * Short conversational turns without a shopping intent (fallback when Groq is off).
 */
function looksLikeGreetingOnly(message) {
  const t = (message && String(message).trim()) || '';
  if (!t || t.length > 120) return false;
  const s = t.toLowerCase();
  return (
    /^(hi|hello|hey|hiya|howdy|yo|sup|greetings)(\s+there|\s+you)?\s*[!.?]*$/i.test(s) ||
    /^good\s+(morning|afternoon|evening)\b/.test(s) ||
    /^(thanks?|thank\s+you|thx|ty)\s*[!.?]*$/i.test(s) ||
    /^(bye|goodbye|see\s+you|cya)\s*[!.?]*$/i.test(s) ||
    /^how\s+are\s+you\b/.test(s)
  );
}

module.exports = { detectIntent, INTENTS };
