const Product = require('../models/Product');
const Category = require('../models/Category');

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

/**
 * Search products with optional filters: query (name), category (name/slug), maxPrice, minPrice.
 * Used by productAgent for conversational list (e.g. "laptops under 50000").
 */
async function searchWithFilters(filters = {}) {
    const { query, category, maxPrice, minPrice } = filters;
    const conditions = { isActive: true };

    if (query && String(query).trim()) {
        const searchTerm = String(query).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        conditions.name = new RegExp(searchTerm, 'i');
    }

    if (category && String(category).trim()) {
        const catStr = String(category).trim().toLowerCase();
        const cat = await Category.findOne({
            $or: [{ name: new RegExp(catStr, 'i') }, { slug: catStr }],
            isActive: true
        }).lean();
        if (cat) conditions.category = cat._id;
    }

    const exprParts = [];
    if (typeof maxPrice === 'number' && maxPrice >= 0) {
        exprParts.push({ $lte: [{ $ifNull: ['$discountPrice', '$price'] }, maxPrice] });
    }
    if (typeof minPrice === 'number' && minPrice >= 0) {
        exprParts.push({ $gte: [{ $ifNull: ['$discountPrice', '$price'] }, minPrice] });
    }
    if (exprParts.length === 1) conditions.$expr = exprParts[0];
    else if (exprParts.length === 2) conditions.$expr = { $and: exprParts };

    const products = await Product.find(conditions).populate('category', 'name slug').lean();
    products.forEach(addOutOfStock);
    return products;
}

module.exports = { getProductId, getProducts, searchByName, searchWithFilters };