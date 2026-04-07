const jwt = require('jsonwebtoken');
const config = require('../config');
const { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } = require('../config/cookies');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, bearerToken] = authHeader.split(' ');
    const cookieToken = req.cookies?.[ACCESS_TOKEN_NAME];
    const token =
      scheme === 'Bearer' && bearerToken ? bearerToken : cookieToken || null;

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
}
 function refreshTokenMiddleware(req, res, next) {
    try {
        // Body, then Bearer header, then HTTP-only cookie.
        const bodyRefreshToken = req.body?.refreshToken;
        const authHeader = req.headers.authorization || '';
        const [scheme, bearerToken] = authHeader.split(' ');
        const cookieRefresh = req.cookies?.[REFRESH_TOKEN_NAME];
        const refreshToken =
            bodyRefreshToken ||
            (scheme === 'Bearer' ? bearerToken : null) ||
            cookieRefresh ||
            null;

        if (!refreshToken) {
            return res.status(401).json({ status: 'error', message: 'Refresh token is required' });
        }

        const refreshSecret = config.jwt.refreshSecret;
        const decoded = jwt.verify(refreshToken, refreshSecret);
        req.refreshUser = { id: decoded.userId, role: decoded.role };
        req.refreshToken = refreshToken;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'error', message: 'Refresh token expired' });
        }
        return res.status(401).json({ status: 'error', message: 'Invalid refresh token' });
    }
}
module.exports = { authMiddleware, refreshTokenMiddleware };