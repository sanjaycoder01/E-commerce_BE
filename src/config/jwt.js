/**
 * JWT configuration
 */
module.exports = {
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '20h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
