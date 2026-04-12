/**
 * Swarm pipeline logging. Set SWARM_DEBUG=1 or true for planner/single-path details.
 * Swarm execution always emits a short summary when steps run (easy to grep [swarm]).
 */

function isVerbose() {
  const v = process.env.SWARM_DEBUG;
  return v === '1' || v === 'true';
}

function swarmLog(message, extra) {
  if (extra !== undefined) {
    console.log(`[swarm] ${message}`, extra);
  } else {
    console.log(`[swarm] ${message}`);
  }
}

function swarmDebug(message, extra) {
  if (!isVerbose()) return;
  swarmLog(`(debug) ${message}`, extra);
}

module.exports = {
  swarmLog,
  swarmDebug,
  isSwarmVerbose: isVerbose,
};
