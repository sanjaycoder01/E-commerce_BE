const User = require('../models/User');

/**
 * GET /api/auth/profile - no body (uses auth token).
 */

async function getProfile(userId) {
    const user = await User.findById(userId)
        .select('name email role phone addresses isVerified')
        .lean();

    if (!user) throw new Error('User not found');

    return user;
}

/**
 * PATCH /api/auth/updateprofile
 * Body (all fields optional):
 * {
 *   "name": "string",
 *   "phone": "string",
 *   "addresses": [
 *     {
 *       "fullName": "string",
 *       "phone": "string",
 *       "street": "string",
 *       "city": "string",
 *       "state": "string",
 *       "pincode": "string",
 *       "country": "India"
 *     }
 *   ]
 * }
 * Sending "addresses" replaces the entire addresses array.
 */
async function updateProfile(userId, body) {
    const allowedFields = ['name', 'phone', 'addresses'];

    const updateData = Object.keys(body)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
            obj[key] = body[key];
            return obj;
        }, {});

    const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    ).select('name email role phone addresses isVerified').lean();

    if (!user) throw new Error('User not found');

    return user;
}

module.exports = { getProfile, updateProfile };
