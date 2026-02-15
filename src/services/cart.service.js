const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

async function getCart(userId) {
    const cart = await Cart.findOne({ user: userId })
        .populate('items.product', 'name slug price discountPrice images stock isActive')
        .lean();
    console.log("cart",cart);
    if (!cart) {
        return { items: [], totalPrice: 0 };
    }

    return {
        items: cart.items,
        totalPrice: cart.totalPrice
    };
}

async function addItem(userId, productId, quantity = 1) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error('Invalid product id');
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Quantity must be at least 1');
    }

    const product = await Product.findById(productId).lean();
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error(`Only ${product.stock} items in stock`);

    const unitPrice = product.discountPrice != null ? product.discountPrice : product.price;

    let cart = await Cart.findOne({ user: userId });
    console.log("cart",cart);
    if (!cart) {
        cart = new Cart({
            user: userId,
            items: [{ product: productId, quantity, priceSnapshot: unitPrice }]
        });
    } else {
        const existingIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId.toString()
        );
        if (existingIndex >= 0) {
            const newQty = cart.items[existingIndex].quantity + quantity;
            if (product.stock < newQty) throw new Error(`Only ${product.stock} items in stock`);
            cart.items[existingIndex].quantity = newQty;
        } else {
            cart.items.push({ product: productId, quantity, priceSnapshot: unitPrice });
        }
    }
    await cart.save();
    const saved = await Cart.findById(cart._id)
        .populate('items.product', 'name slug price discountPrice images stock isActive')
        .lean();
    return saved;
}

async function updateItem(userId, productId, quantity) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error('Invalid product id');
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Quantity must be at least 1');
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new Error('Cart not found');

    const index = cart.items.findIndex((item) => item.product.toString() === productId.toString());
    console.log("index",index);
    if (index < 0) throw new Error('Product not in cart');

    const product = await Product.findById(productId).lean();
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error(`Only ${product.stock} items in stock`);

    cart.items[index].quantity = quantity;
    if (cart.items[index].priceSnapshot !== (product.discountPrice ?? product.price)) {
        cart.items[index].priceSnapshot = product.discountPrice != null ? product.discountPrice : product.price;
    }
    await cart.save();
    const saved = await Cart.findById(cart._id)
        .populate('items.product', 'name slug price discountPrice images stock isActive')
        .lean();
    return saved;
}

async function removeItem(userId, productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error('Invalid product id');
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new Error('Cart not found');

    const index = cart.items.findIndex((item) => item.product.toString() === productId.toString());
    if (index < 0) throw new Error('Product not in cart');

    cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId.toString()
     );
     console.log("cart",cart);
    await cart.save();
    const saved = await Cart.findById(cart._id)
        .populate('items.product', 'name slug price discountPrice images stock isActive')
        .lean();
    return saved;
}

async function clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        return { items: [], totalPrice: 0 };
    }
    cart.items = [];
    await cart.save();
    return { items: [], totalPrice: 0 };
}

module.exports = {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearCart
};
