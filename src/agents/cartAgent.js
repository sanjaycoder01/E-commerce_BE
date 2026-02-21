/**
 * Cart agent: handles ADD_TO_CART and GET_CART intents.
 * Delegates to cart.service; productId can come from params or request body (UI).
 */

const cartService = require('../services/cart.service');

/**
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.intent - ADD_TO_CART | GET_CART
 * @param {object} input.params
 * @param {string} [input.productId] - From request body (UI selection)
 * @param {number} [input.quantity]
 * @returns {Promise<{ type: string, message: string, data: object }>}
 */
async function handle({ userId, intent, params, productId, quantity }) {
  if (intent === 'GET_CART') {
    const cart = await cartService.getCart(userId);
    const itemCount = (cart.items && cart.items.length) || 0;
    return {
      type: 'cart',
      message: itemCount === 0 ? 'Your cart is empty.' : `You have ${itemCount} item(s) in your cart.`,
      data: cart,
      suggestions: itemCount > 0 ? ['Place order', 'Continue shopping'] : ['Browse products'],
    };
  }

  // ADD_TO_CART
  const pid = productId || (params && params.productId);
  const qty = typeof quantity === 'number' && quantity >= 1 ? quantity : (params && params.quantity) || 1;

  if (!pid || !String(pid).trim()) {
    throw new Error('Please select a product to add to cart (productId is required).');
  }

  const cart = await cartService.addItem(userId, pid, qty);
  const addedItem = cart.items && cart.items.find((i) => String(i.product._id) === String(pid));
  const name = addedItem && addedItem.product ? addedItem.product.name : 'Item';

  return {
    type: 'cart',
    message: `Added ${name} (qty: ${qty}) to your cart.`,
    data: { items: cart.items, totalPrice: cart.totalPrice },
    suggestions: ['View cart', 'Place order', 'Continue shopping'],
  };
}

module.exports = { handle };
