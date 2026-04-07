const Product = require('../models/Product');
const Category = require('../models/Category');
const { getRedis } = require('../redisClient');
const { productsCacheTtlSeconds } = require('../config/redis');

const PRODUCTS_LIST_CACHE_KEY = 'products:all';

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

async function invalidateProductsListCache() {
    const redis = getRedis();
    if (!redis) return;
    try {
        await redis.del(PRODUCTS_LIST_CACHE_KEY);
    } catch (err) {
        console.warn('Redis del (products list) failed:', err.message);
    }
}

async function getProducts(){
    const redis = getRedis();
    if (redis) {
        try {
            const cached = await redis.get(PRODUCTS_LIST_CACHE_KEY);
            if (cached) {
                const products = JSON.parse(cached);
                products.forEach(addOutOfStock);
                return products;
            }
        } catch (err) {
            console.warn('Redis get (products list) failed:', err.message);
        }
    }

    const products = await Product.find().lean();
    if(!products) throw new Error('Products not found');
    products.forEach(addOutOfStock);

    if (redis) {
        try {
            await redis.set(
                PRODUCTS_LIST_CACHE_KEY,
                JSON.stringify(products),
                'EX',
                productsCacheTtlSeconds
            );
        } catch (err) {
            console.warn('Redis set (products list) failed:', err.message);
        }
    }

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

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugifyInput(str) {
    return String(str)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

const SORT_BY_CATEGORY = ['name', 'price_asc', 'price_desc', 'newest', 'rating'];

/**
 * Products for a category matched by display name or slug (case-insensitive).
 * @param {string} categoryName - e.g. "Electronics" or "fashion-apparel"
 * @param {string} [sort='name'] - name | price_asc | price_desc | newest | rating
 */

async function getProductsByCategoryName(categoryName){
    console.log(categoryName);
    const category=await Category.findOne({name:categoryName}).lean();
    console.log(category);
    if(category){
        const products=await Product.find({category:category._id}).lean();
        products.forEach(addOutOfStock);
        console.log(products);
        return products;
    }else{
        throw new Error('Category not found');
    }

}


module.exports = {
    getProductId,
    getProducts,
    searchByName,
    searchWithFilters,
    invalidateProductsListCache,
    getProductsByCategoryName
};