const categoryService = require('../services/category.service');

async function getCategoryname(req, res, next) {
    try {
        const categoryname = await categoryService.getCategoryname(req.params.categoryId);
        res.status(200).json({ status: 'success', data: categoryname });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getCategoryname
};
