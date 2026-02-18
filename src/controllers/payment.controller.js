const paymentService = require('../services/payment.service');
async function createOrder(req, res, next) {
  try {
    const { orderId } = req.body;
    const data = await paymentService.createRazorpayOrder(orderId, req.user.id);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}
async function verifyPayment(req, res, next) {
  try {
    const result = await paymentService.verifyPayment(req.user.id, req.body);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  verifyPayment,
};
