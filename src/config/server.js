/**
 * Server configuration
 */
module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  env: process.env.NODE_ENV || 'development',
};
