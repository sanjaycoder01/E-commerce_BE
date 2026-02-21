/**
 * Tests for chat controller: orchestrator routing and response shape.
 * Mocks intentService and agents to avoid DB/OpenAI.
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const intentService = require('../src/services/intent.service');
const productAgent = require('../src/agents/productAgent');
const { chat } = require('../src/controllers/chat.controller');

describe('chat.controller', () => {
  let originalDetectIntent;
  let originalProductHandle;

  beforeEach(() => {
    originalDetectIntent = intentService.detectIntent;
    originalProductHandle = productAgent.handle;
  });

  afterEach(() => {
    intentService.detectIntent = originalDetectIntent;
    productAgent.handle = originalProductHandle;
  });

  function mockRes() {
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
    return res;
  }

  it('returns 401 when req.user is missing', async () => {
    const req = { body: { message: 'hello' }, user: null };
    const res = mockRes();
    await chat(req, res);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.type, 'error');
    assert.ok(res.body.message.includes('Unauthorized') || res.body.message.includes('log in'));
  });

  it('returns 200 and product_list when intent is LIST_PRODUCTS and agent returns data', async () => {
    intentService.detectIntent = async () => ({
      intent: intentService.INTENTS.LIST_PRODUCTS,
      params: {},
    });
    productAgent.handle = async () => ({
      type: 'product_list',
      message: 'Here are products.',
      data: [{ _id: '1', name: 'Test' }],
      suggestions: ['Add to cart'],
    });

    const req = { body: { message: 'show products' }, user: { id: 'user1' } };
    const res = mockRes();
    await chat(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.type, 'product_list');
    assert.strictEqual(res.body.message, 'Here are products.');
    assert.strictEqual(Array.isArray(res.body.data), true);
    assert.strictEqual(res.body.data.length, 1);
    assert.strictEqual(res.body.data[0].name, 'Test');
  });

  it('returns 200 and unknown type when intent is UNKNOWN', async () => {
    intentService.detectIntent = async () => ({
      intent: intentService.INTENTS.UNKNOWN,
      params: {},
    });

    const req = { body: { message: 'random text' }, user: { id: 'user1' } };
    const res = mockRes();
    await chat(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.type, 'unknown');
    assert.ok(res.body.message);
  });

  it('returns 500 and error type when agent throws', async () => {
    intentService.detectIntent = async () => ({
      intent: intentService.INTENTS.LIST_PRODUCTS,
      params: {},
    });
    productAgent.handle = async () => {
      throw new Error('DB connection failed');
    };

    const req = { body: { message: 'show products' }, user: { id: 'user1' } };
    const res = mockRes();
    await chat(req, res);

    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(res.body.type, 'error');
    assert.strictEqual(res.body.message, 'DB connection failed');
  });
});
