/**
 * Redis — optional; leave REDIS_URL unset to disable caching.
 */
module.exports = {
  url: process.env.REDIS_URL || '',
  productsCacheTtlSeconds: Math.max(
    1,
    Number(process.env.PRODUCTS_CACHE_TTL_SECONDS) || 300
  ),
};
