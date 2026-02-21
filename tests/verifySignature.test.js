/**
 * Unit tests for Razorpay signature verification (payment + webhook).
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const {
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} = require('../src/utils/verifySignature');

describe('verifyRazorpaySignature (payment success)', () => {
  const secret = 'test_key_secret';

  it('returns true for valid orderId|paymentId signature', () => {
    const orderId = 'order_abc';
    const paymentId = 'pay_xyz';
    const payload = `${orderId}|${paymentId}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    assert.strictEqual(verifyRazorpaySignature(orderId, paymentId, signature, secret), true);
  });

  it('returns false for wrong signature', () => {
    assert.strictEqual(
      verifyRazorpaySignature('order_abc', 'pay_xyz', 'wrong_signature_hex', secret),
      false
    );
  });

  it('returns false when any argument is missing', () => {
    const sig = crypto.createHmac('sha256', secret).update('order|pay').digest('hex');
    assert.strictEqual(verifyRazorpaySignature('', 'pay', sig, secret), false);
    assert.strictEqual(verifyRazorpaySignature('order', '', sig, secret), false);
    assert.strictEqual(verifyRazorpaySignature('order', 'pay', '', secret), false);
    assert.strictEqual(verifyRazorpaySignature('order', 'pay', sig, ''), false);
  });
});

describe('verifyRazorpayWebhookSignature', () => {
  const secret = 'webhook_secret';
  const rawBody = '{"event":"payment.captured","payload":{}}';

  it('returns true for valid raw body signature', () => {
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    assert.strictEqual(verifyRazorpayWebhookSignature(rawBody, signature, secret), true);
    assert.strictEqual(verifyRazorpayWebhookSignature(Buffer.from(rawBody), signature, secret), true);
  });

  it('returns false for invalid signature', () => {
    assert.strictEqual(verifyRazorpayWebhookSignature(rawBody, 'invalid', secret), false);
  });

  it('returns false when any argument is missing', () => {
    const sig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    assert.strictEqual(verifyRazorpayWebhookSignature('', sig, secret), false);
    assert.strictEqual(verifyRazorpayWebhookSignature(rawBody, '', secret), false);
    assert.strictEqual(verifyRazorpayWebhookSignature(rawBody, sig, ''), false);
  });
});
