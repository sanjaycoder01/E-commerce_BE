/**
 * Product agent: handles LIST_PRODUCTS intent only.
 * Delegates to products.service; returns formatted product_list for chat UI.
 */

const productsService = require('../services/products.service');

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.intent
 * @param {object} input.params - { query?, category?, maxPrice?, minPrice? }
 * @returns {Promise<{ type: string, message: string, data: array }>}
 */
async function handle({ userId, intent, params }) {
  const filters = {
    query: params.query && String(params.query).trim() ? String(params.query).trim() : undefined,
    category: params.category && String(params.category).trim() ? String(params.category).trim() : undefined,
    maxPrice: typeof params.maxPrice === 'number' && params.maxPrice >= 0 ? params.maxPrice : undefined,
    minPrice: typeof params.minPrice === 'number' && params.minPrice >= 0 ? params.minPrice : undefined,
  };

  const hasFilters = filters.query || filters.category || filters.maxPrice != null || filters.minPrice != null;
  const products = hasFilters
    ? await productsService.searchWithFilters(filters)
    : await productsService.getProducts();

  const message =
    products.length === 0
      ? 'No products found matching your criteria.'
      : hasFilters
        ? `Here are ${products.length} product(s) matching your search.`
        : `Here are our products (${products.length} total).`;

  return {
    type: 'product_list',
    message,
    data: products.map((p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      discountPrice: p.discountPrice,
      images: p.images,
      stock: p.stock,
      outOfStock: p.outOfStock,
      category: p.category,
    })),
    suggestions: ['Add to cart', 'View details'],
  };
}

module.exports = { handle };
