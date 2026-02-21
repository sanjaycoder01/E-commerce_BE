const crypto = require('crypto');

/**
 * Verify Razorpay webhook/success signature.
 * @param {string} orderId - Razorpay order_id
 * @param {string} paymentId - Razorpay payment_id
 * @param {string} signature - Razorpay signature from client
 * @param {string} secret - RAZORPAY_KEY_SECRET
 * @returns {boolean}
 */
function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return expected === signature;
}

/**
 * Verify Razorpay webhook signature (X-Razorpay-Signature).
 * Uses HMAC-SHA256 with webhook secret and raw request body. Do not parse body before verifying.
 * @param {Buffer|string} rawBody - Raw webhook request body
 * @param {string} signature - X-Razorpay-Signature header value
 * @param {string} secret - RAZORPAY_WEBHOOK_SECRET
 * @returns {boolean}
 */
function verifyRazorpayWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) {
    return false;
  }
  const body = Buffer.isBuffer(rawBody) ? rawBody : String(rawBody);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

module.exports = { verifyRazorpaySignature, verifyRazorpayWebhookSignature };
