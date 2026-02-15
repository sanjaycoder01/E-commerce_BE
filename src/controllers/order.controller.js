const orderService = require('../services/order.service');

async function createOrder(req, res, next) {
    try {
        const order = await orderService.createOrder(req.user.id, req.body);
        res.status(201).json({ status: 'success', data: { order } });
    } catch (err) {
        next(err);
    }
}

async function getOrders(req, res, next) {
    try {
        const orders = await orderService.getOrders(req.user.id);
        res.status(200).json({ status: 'success', data: { orders } });
    } catch (err) {
        next(err);
    }
}

async function getOrderById(req, res, next) {
    try {
        const order = await orderService.getOrderById(req.user.id, req.params.id);
        res.status(200).json({ status: 'success', data: { order } });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createOrder,
    getOrders,
    getOrderById
};
