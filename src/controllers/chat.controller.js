/**
 * Chat orchestrator: builds a step plan and runs swarmExecutor (one or many agent steps).
 * Single messages → one step; compound messages ("X and Y") → multiple steps (parallel reads when safe).
 */

const swarmPlanner = require('../services/swarmPlanner.service');
const swarmExecutor = require('../services/swarmExecutor.service');
const { normalizeMongoId } = require('../utils/mongoId');

const { swarmLog } = require('../utils/swarmLog');

/**
 * POST /api/chat
 * Body: { message, productId?, quantity?, orderId?, shippingAddress? }
 */
async function chat(req, res, next) {
  try {
    const { message, productId, quantity, shippingAddress } = req.body || {};
    const orderIdNorm = normalizeMongoId(req.body && req.body.orderId);
    const orderId = orderIdNorm || undefined;
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        type: 'error',
        message: 'Unauthorized. Please log in.',
      });
    }

    const context = { productId, orderId };
    const { steps } = await swarmPlanner.buildPlan(message || '', context);

    swarmLog('chat: execute', { stepCount: steps.length });
    const result = await swarmExecutor.execute(steps, {
      userId,
      productId,
      quantity,
      orderId,
      shippingAddress,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      type: 'error',
      message: err.message || 'Something went wrong. Please try again.',
      data: null,
    });
  }
}

module.exports = { chat };
