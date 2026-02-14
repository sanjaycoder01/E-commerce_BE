const Product = require('../models/Product');

async function getProductId(productId){
    const product = await Product.findById(productId).lean();
    if(!product) throw new Error('Product not found');
    return product;
}

async function getProducts(){
    const products = await Product.find().lean();
    if(!products) throw new Error('Products not found');
    return products;
}

module.exports = { getProductId, getProducts };