const profileService = require('../services/profile.service');
async function getProfile(req, res, next) {
    try {
        const user = await profileService.getProfile(req.user.id);
        res.status(200).json({ status: 'success', data: { user } });
    } catch (err) {
        next(err);  // pass to error handler middleware
    }
}

async function updateProfile(req, res, next)
{
    try{
        const user = await profileService.updateProfile(req.user.id, req.body);
        res.status(200).json({ status: 'success', data: { user } });
    } catch (err) {
        next(err);  // pass to error handler middleware
    }
}

module.exports = { getProfile, updateProfile };