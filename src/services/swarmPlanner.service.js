/**
 * Swarm planner: builds one or more intent+params steps for swarmExecutor.
 * Single-utterance messages become one step; compound messages ("X and Y") become multiple steps.
 */

const intentService = require('./intent.service');
const { swarmLog, swarmDebug } = require('../utils/swarmLog');

const { INTENTS } = intentService;

/**
 * Split on coordinating conjunctions (English). Single segment → one part.
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
 * @returns {Promise<{ steps: Array<{ intent: string, params: object }> }>}
 */
async function buildPlan(message, context = {}) {
  const trimmed = (message && String(message).trim()) || '';
  if (!trimmed) {
    swarmDebug('plan: empty message');
    return { steps: [] };
  }

  const segments = splitCompound(message);

  if (segments.length < 2) {
    const { intent, params } = await intentService.detectIntent(trimmed, context);
    swarmLog('plan: steps', { segmentCount: 1, intents: [intent] });
    return { steps: [{ intent, params }] };
  }

  const steps = [];
  const skipped = [];
  for (const seg of segments) {
    const { intent, params } = await intentService.detectIntent(seg, context);
    if (intent && intent !== INTENTS.UNKNOWN && intent !== INTENTS.GREETING) {
      steps.push({ intent, params });
    } else if (intent) {
      skipped.push({ segment: truncate(seg, 60), intent });
    }
  }

  swarmLog('plan: steps', {
    segmentCount: segments.length,
    stepCount: steps.length,
    intents: steps.map((s) => s.intent),
    skipped: skipped.length ? skipped : undefined,
  });

  return { steps };
}

function truncate(s, max) {
  const t = (s && String(s).trim()) || '';
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

module.exports = {
  splitCompound,
  buildPlan,
  INTENTS,
};
