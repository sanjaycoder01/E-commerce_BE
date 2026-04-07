const express = require('express');
const categoryController = require('../controllers/category.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/getcategoryname/:categoryId', categoryController.getCategoryname);

module.exports = router;