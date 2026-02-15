const cartService = require('../services/cart.service');

async function getCart(req, res, next) {
    try {
        const cart = await cartService.getCart(req.user.id);
        res.status(200).json({ status: 'success', data: cart });
    } catch (err) {
        next(err);
    }
}

async function addItem(req, res, next) {
    try {
        const { productId, quantity } = req.body;
        const cart = await cartService.addItem(req.user.id, productId, quantity);
        res.status(200).json({ status: 'success', data: { cart } });
    } catch (err) {
        next(err);
    }
}

async function updateItem(req, res, next) {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const cart = await cartService.updateItem(req.user.id, productId, quantity);
        res.status(200).json({ status: 'success', data: { cart } });
    } catch (err) {
        next(err);
    }
}

async function removeItem(req, res, next) {
    try {
        const { productId } = req.params;
        const cart = await cartService.removeItem(req.user.id, productId);
        res.status(200).json({ status: 'success', data: { cart } });
    } catch (err) {
        next(err);
    }
}

async function clearCart(req, res, next) {
    try {
        const cart = await cartService.clearCart(req.user.id);
        res.status(200).json({ status: 'success', data: cart });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearCart
};
