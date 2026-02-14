const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
}
 function refreshTokenMiddleware(req, res, next) {
    try {
        // Accept refresh token from body first, then Bearer header fallback.
        const bodyRefreshToken = req.body?.refreshToken;
        const authHeader = req.headers.authorization || '';
        const [scheme, bearerToken] = authHeader.split(' ');
        const refreshToken = bodyRefreshToken || (scheme === 'Bearer' ? bearerToken : null);

        if (!refreshToken) {
            return res.status(401).json({ status: 'error', message: 'Refresh token is required' });
        }

        const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
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