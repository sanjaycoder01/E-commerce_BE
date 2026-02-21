/**
 * Tests for intent detection (fallback path when OPENAI_API_KEY is not set).
 */
const { describe, it, before } = require('node:test');
const assert = require('node:assert');

describe('intent.service (fallback)', () => {
  let detectIntent;
  let INTENTS;

  before(() => {
    const saved = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = '';
    const intentService = require('../src/services/intent.service');
    detectIntent = intentService.detectIntent;
    INTENTS = intentService.INTENTS;
    if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
  });

  it('returns UNKNOWN for empty message', async () => {
    const r = await detectIntent('');
    assert.strictEqual(r.intent, INTENTS.UNKNOWN);
    assert.deepStrictEqual(r.params, {});
  });

  it('detects LIST_PRODUCTS for "show me products"', async () => {
    const r = await detectIntent('show me products');
    assert.strictEqual(r.intent, INTENTS.LIST_PRODUCTS);
  });

  it('detects LIST_PRODUCTS when user asks for product name "Wireless Bluetooth Headphones"', async () => {
    const r = await detectIntent('show me Wireless Bluetooth Headphones');
    assert.strictEqual(r.intent, INTENTS.LIST_PRODUCTS);
  });

  it('detects LIST_PRODUCTS and extracts maxPrice for "show laptops under 50000"', async () => {
    const r = await detectIntent('show laptops under 50000');
    assert.strictEqual(r.intent, INTENTS.LIST_PRODUCTS);
    assert.strictEqual(r.params.maxPrice, 50000);
  });

  it('detects LIST_PRODUCTS and extracts maxPrice for "products under Rs 20000"', async () => {
    const r = await detectIntent('products under Rs 20000');
    assert.strictEqual(r.intent, INTENTS.LIST_PRODUCTS);
    assert.strictEqual(r.params.maxPrice, 20000);
  });

  it('detects ADD_TO_CART when productId in context', async () => {
    const r = await detectIntent('add to cart', { productId: '507f1f77bcf86cd799439011' });
    assert.strictEqual(r.intent, INTENTS.ADD_TO_CART);
    assert.strictEqual(r.params.productId, '507f1f77bcf86cd799439011');
  });

  it('detects GET_CART for "view cart"', async () => {
    const r = await detectIntent('view cart');
    assert.strictEqual(r.intent, INTENTS.GET_CART);
  });

  it('detects PLACE_ORDER for "place order"', async () => {
    const r = await detectIntent('place order');
    assert.strictEqual(r.intent, INTENTS.PLACE_ORDER);
  });

  it('detects CHECKOUT for "checkout"', async () => {
    const r = await detectIntent('checkout');
    assert.strictEqual(r.intent, INTENTS.CHECKOUT);
  });

  it('detects CHECKOUT and uses orderId from context', async () => {
    const r = await detectIntent('pay', { orderId: 'order123' });
    assert.strictEqual(r.intent, INTENTS.CHECKOUT);
    assert.strictEqual(r.params.orderId, 'order123');
  });

  it('detects GET_ORDER_STATUS for "order status"', async () => {
    const r = await detectIntent('order status');
    assert.strictEqual(r.intent, INTENTS.GET_ORDER_STATUS);
  });

  it('returns UNKNOWN for unrelated message', async () => {
    const r = await detectIntent('hello world');
    assert.strictEqual(r.intent, INTENTS.UNKNOWN);
  });
});
