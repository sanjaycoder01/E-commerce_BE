/**
 * Swarm planner: splits compound user messages into multiple intent+params steps
 * so several specialist agents can run in one chat turn (parallel when safe).
 */

const intentService = require('./intent.service');

const { INTENTS } = intentService;

/**
 * Split on coordinating conjunctions (English). Single-segment → not a compound swarm turn.
 */
function splitCompound(message) {
  const trimmed = (message && String(message).trim()) || '';
  if (!trimmed) return [];
  const parts = trimmed.split(/\s+(?:and|also|plus)\s+/i).map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [trimmed];
}

/**
 * @param {string} message
 * @param {object} context - forwarded to intent detection (productId, orderId)
 * @returns {Promise<{ mode: 'single' } | { mode: 'swarm', steps: Array<{ intent: string, params: object }> }>}
 */
async function buildPlan(message, context = {}) {
  const segments = splitCompound(message);
  if (segments.length < 2) {
    return { mode: 'single' };
  }

  const steps = [];
  for (const seg of segments) {
    const { intent, params } = await intentService.detectIntent(seg, context);
    if (intent && intent !== INTENTS.UNKNOWN) {
      steps.push({ intent, params });
    }
  }

  if (steps.length < 2) {
    return { mode: 'single' };
  }

  return { mode: 'swarm', steps };
}

module.exports = {
  splitCompound,
  buildPlan,
  INTENTS,
};
