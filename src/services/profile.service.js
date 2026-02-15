const User = require('../models/User');
const orderService = require('./order.service');

/**
 * GET /api/auth/profile - no body (uses auth token).
 * Returns user profile and order details (list of orders).
 */

async function getProfile(userId) {
    const user = await User.findById(userId)
        .select('name email role phone addresses isVerified')
        .lean();

    if (!user) throw new Error('User not found');

    const orders = await orderService.getOrders(userId);

    return { ...user, orders };
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
