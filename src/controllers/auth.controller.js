const authService = require('../services/auth.service');

async function signup(req, res, next) {
    try {
        const { user, accessToken, refreshToken } = await authService.signup(req.body);
        res.status(201).json({ status: 'success', data: { user, accessToken, refreshToken } });
    } catch (err) {
        next(err);  // pass to error handler middleware
    }
}
async function login(req, res, next) {
    try {
        const { user, accessToken, refreshToken } = await authService.login(req.body);
        res.status(200).json({ status: 'success', data: { user, accessToken, refreshToken } });
    } catch (err) {
        next(err);  // pass to error handler middleware
    }
}
async function refresh(req, res, next) {
    try {
        const { accessToken, refreshToken } = await authService.refreshAccessToken(req.refreshUser);
        res.status(200).json({ status: 'success', data: { accessToken, refreshToken } });
    } catch (err) {
        next(err);  // pass to error handler middleware
    }
}
module.exports = { signup, login, refresh };