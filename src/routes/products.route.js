const express = require('express');
const productController = require('../controllers/product.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const router = express.Router();
router.get('/getproductbyid/:id', authMiddleware, productController.getProductId);
router.get('/getallproducts', authMiddleware, productController.getProducts);
router.get('/search', authMiddleware, productController.searchProducts);
module.exports = router;