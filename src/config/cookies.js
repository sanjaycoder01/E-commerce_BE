/**
 * HTTP-only auth cookie settings (aligned with default JWT lifetimes in jwt.js).
 */
const isProduction = process.env.NODE_ENV === 'production';

/** SameSite: cross-site credentialed requests need 'none' + Secure. */
const sameSiteRaw = (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
const sameSite =
  sameSiteRaw === 'none' ? 'none' : sameSiteRaw === 'strict' ? 'strict' : 'lax';

const secure =
  process.env.COOKIE_SECURE === 'true' ||
  (process.env.COOKIE_SECURE !== 'false' && (isProduction || sameSite === 'none'));

const TWENTY_H_MS = 20 * 60 * 60 * 1000;
const SEVEN_D_MS = 7 * 24 * 60 * 60 * 1000;

module.exports = {
  ACCESS_TOKEN_NAME: 'access_token',
  REFRESH_TOKEN_NAME: 'refresh_token',
  accessMaxAgeMs: Number(process.env.JWT_ACCESS_COOKIE_MAX_AGE_MS) || TWENTY_H_MS,
  refreshMaxAgeMs: Number(process.env.JWT_REFRESH_COOKIE_MAX_AGE_MS) || SEVEN_D_MS,
  baseCookieOptions() {
    return {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
    };
  },
};
