const cookieConfig = require('../config/cookies');

function setAuthCookies(res, { accessToken, refreshToken }) {
  const base = cookieConfig.baseCookieOptions();
  res.cookie(cookieConfig.ACCESS_TOKEN_NAME, accessToken, {
    ...base,
    maxAge: cookieConfig.accessMaxAgeMs,
  });
  res.cookie(cookieConfig.REFRESH_TOKEN_NAME, refreshToken, {
    ...base,
    maxAge: cookieConfig.refreshMaxAgeMs,
  });
}

function clearAuthCookies(res) {
  const base = cookieConfig.baseCookieOptions();
  res.clearCookie(cookieConfig.ACCESS_TOKEN_NAME, base);
  res.clearCookie(cookieConfig.REFRESH_TOKEN_NAME, base);
}

module.exports = { setAuthCookies, clearAuthCookies };
