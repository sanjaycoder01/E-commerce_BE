/**
 * Chat route: POST /api/chat — requires JWT auth. Body: { message, productId?, quantity?, orderId?, shippingAddress? }
 */
const express = require('express');
const chatController = require('../controllers/chat.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);
router.post('/', chatController.chat);

module.exports = router;
