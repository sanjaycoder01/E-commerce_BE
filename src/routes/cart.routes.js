const express = require('express');
const cartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/getcart', cartController.getCart);
router.post('/additem', cartController.addItem);
router.patch('/updateitem/:productId', cartController.updateItem);
router.delete('/removeitem/:productId', cartController.removeItem);
router.delete('/clearcart', cartController.clearCart);

module.exports = router;
