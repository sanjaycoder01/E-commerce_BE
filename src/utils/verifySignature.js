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

module.exports = { verifyRazorpaySignature };
