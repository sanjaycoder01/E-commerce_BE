const Category = require('../models/Category');
const User = require('../models/User');

async function getCategoryname(categoryId) {
    const category=await Category.findById(categoryId).select('slug').lean();
    if(!category) throw new Error('Category not found');
    return category.slug;
}

module.exports = {
    getCategoryname
};