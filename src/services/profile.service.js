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

const ORDER_SHIPPING_FIELDS = ['fullName', 'phone', 'address', 'city', 'state', 'pincode'];

function hasCompleteShippingShape(obj) {
    if (!obj || typeof obj !== 'object') return false;
    return ORDER_SHIPPING_FIELDS.every((f) => obj[f] != null && String(obj[f]).trim());
}

/**
 * Build order shipping payload from saved profile addresses (first usable row).
 * Maps profile `street` → order `address`. Fills missing name/phone from user root fields.
 * @returns {Promise<object|null>}
 */
async function getShippingAddressForOrder(userId) {
    const user = await User.findById(userId).select('name phone addresses').lean();
    if (!user) return null;

    for (const a of user.addresses || []) {
        const street = (a.street && String(a.street).trim()) || '';
        const city = (a.city && String(a.city).trim()) || '';
        const state = (a.state && String(a.state).trim()) || '';
        const pincode = (a.pincode && String(a.pincode).trim()) || '';
        if (!street || !city || !state || !pincode) continue;

        const fullName = (a.fullName && String(a.fullName).trim()) || (user.name && String(user.name).trim()) || '';
        const phone = (a.phone && String(a.phone).trim()) || (user.phone && String(user.phone).trim()) || '';
        if (!fullName || !phone) continue;

        return {
            fullName,
            phone,
            address: street,
            city,
            state,
            pincode,
        };
    }
    return null;
}

module.exports = { getProfile, updateProfile, getShippingAddressForOrder, hasCompleteShippingShape };
