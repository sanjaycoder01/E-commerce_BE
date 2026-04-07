const authService = require('../services/auth.service');
const { setAuthCookies, clearAuthCookies } = require('../utils/authCookies');

async function signup(req, res, next) {
    try {
        const { user, accessToken, refreshToken } = await authService.signup(req.body);
        setAuthCookies(res, { accessToken, refreshToken });
        res.status(201).json({ status: 'success', data: { user, accessToken, refreshToken } });
    } catch (err) {
        next(err);  // pass to error handler middleware
    }
}
async function login(req, res, next) {
    try {
        const { user, accessToken, refreshToken } = await authService.login(req.body);
        setAuthCookies(res, { accessToken, refreshToken });
        res.status(200).json({ status: 'success', data: { user, accessToken, refreshToken } });
    } catch (err) {
        next(err);  // pass to error handler middleware
    }
}
async function refresh(req, res, next) {
    try {
        const { accessToken, refreshToken } = await authService.refreshAccessToken(req.refreshUser);
        setAuthCookies(res, { accessToken, refreshToken });
        res.status(200).json({ status: 'success', data: { accessToken, refreshToken } });
    } catch (err) {
        next(err);  // pass to error handler middleware
    }
}

async function logout(req, res, next) {
    try {
        const { message } = await authService.logout(req.user.id);
        clearAuthCookies(res);
        res.status(200).json({ status: 'success', message });
    } catch (err) {
        next(err);
    }
}

module.exports = { signup, login, refresh, logout };