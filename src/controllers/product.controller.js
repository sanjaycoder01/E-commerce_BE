const productService = require('../services/products.service');

async function getProductId(req, res, next){
    try{
        const product = await productService.getProductId(req.params.id);
        res.status(200).json({ status: 'success', data: { product } });
    } catch (err) {
        next(err);
    }
}

async function getProducts(req, res, next){ 
    try{
        const products = await productService.getProducts();
        res.status(200).json({ status: 'success', data: { products } });
    } catch (err) {
        next(err);
    }
}

async function searchProducts(req, res, next) {
    try {
        const products = await productService.searchByName(req.query.q || req.query.name);
        res.status(200).json({ status: 'success', data: { products } });
    } catch (err) {
        next(err);
    }
}

module.exports = { getProductId, getProducts, searchProducts };