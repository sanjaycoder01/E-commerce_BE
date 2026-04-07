/**
 * Shared Redis client (optional). No REDIS_URL → getRedis() returns null.
 */
require('./config');

const Redis = require('ioredis');
const { url: redisUrl } = require('./config/redis');

let client = null;

function getRedis() {
  if (!redisUrl) {
    return null;
  }
  if (!client) {
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    client.on('error', (err) => {
      console.warn('Redis error:', err.message);
    });
  }
  return client;
}

module.exports = { getRedis };
