const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const SHIPPING_ADDRESS_FIELDS = ['fullName', 'phone', 'address', 'city', 'state', 'pincode'];

function validateShippingAddress(body) {
    const shippingAddress = body.shippingAddress || body;
    if (!shippingAddress || typeof shippingAddress !== 'object') {
        throw new Error('Shipping address is required');
    }
    for (const field of SHIPPING_ADDRESS_FIELDS) {
        if (!shippingAddress[field] || !String(shippingAddress[field]).trim()) {
            throw new Error(`Shipping address ${field} is required`);
        }
    }
    return {
        fullName: String(shippingAddress.fullName).trim(),
        phone: String(shippingAddress.phone).trim(),
        address: String(shippingAddress.address).trim(),
        city: String(shippingAddress.city).trim(),
        state: String(shippingAddress.state).trim(),
        pincode: String(shippingAddress.pincode).trim()
    };
}

async function createOrder(userId, body) {
    const shippingAddress = validateShippingAddress(body);

    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty');
    }

    const productIds = [...new Set(cart.items.map((item) => item.product.toString()))];
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = [];
    for (const cartItem of cart.items) {
        const productId = cartItem.product.toString();
        const product = productMap.get(productId);
        if (!product) {
            throw new Error(`Product not found: ${productId}`);
        }
        if (product.stock < cartItem.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }
        orderItems.push({
            product: cartItem.product,
            name: product.name,
            price: cartItem.priceSnapshot,
            quantity: cartItem.quantity
        });
    }

    const totalAmount = cart.items.reduce(
        (sum, item) => sum + item.priceSnapshot * item.quantity,
        0
    );

    const order = await Order.create({
        user: userId,
        items: orderItems,
        shippingAddress,
        totalAmount,
        paymentStatus: 'PENDING',
        orderStatus: 'PLACED'
    });

    for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity }
        });
    }

    cart.items = [];
    await cart.save();

    const saved = await Order.findById(order._id).lean();
    return saved;
}

async function getOrders(userId) {
    const orders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .lean();
    return orders;
}

async function getOrderById(userId, orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error('Invalid order id');
    }
    const order = await Order.findOne({ _id: orderId, user: userId }).lean();
    if (!order) {
        throw new Error('Order not found');
    }
    return order;
}

module.exports = {
    createOrder,
    getOrders,
    getOrderById
};
