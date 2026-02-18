const Product = require('../models/Product');

function addOutOfStock(product) {
    if (product && typeof product.stock === 'number') {
        product.outOfStock = product.stock === 0;
    }
    return product;
}

async function getProductId(productId){
    const product = await Product.findById(productId).lean();
    if(!product) throw new Error('Product not found');
    return addOutOfStock(product);
}

async function getProducts(){
    const products = await Product.find().lean();
    if(!products) throw new Error('Products not found');
    products.forEach(addOutOfStock);
    return products;
}

async function searchByName(query) {
    const searchTerm = (query && String(query).trim()) || '';
    if (!searchTerm) {
        return [];
    }
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const products = await Product.find({ name: regex }).lean();
    products.forEach(addOutOfStock);
    return products;
}

module.exports = { getProductId, getProducts, searchByName };