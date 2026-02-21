/**
 * Tests for productAgent with mocked products.service (no DB).
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const productsService = require('../../src/services/products.service');
const productAgent = require('../../src/agents/productAgent');

describe('productAgent', () => {
  let originalGetProducts;
  let originalSearchWithFilters;

  beforeEach(() => {
    originalGetProducts = productsService.getProducts;
    originalSearchWithFilters = productsService.searchWithFilters;
  });

  afterEach(() => {
    productsService.getProducts = originalGetProducts;
    productsService.searchWithFilters = originalSearchWithFilters;
  });

  it('returns product_list when user asks for product name "Wireless Bluetooth Headphones"', async () => {
    const wirelessHeadphones = [
      {
        _id: 'p_wireless',
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        price: 2999,
        discountPrice: 2499,
        images: ['https://example.com/hp.jpg'],
        stock: 10,
        outOfStock: false,
        category: { name: 'Electronics', slug: 'electronics' },
      },
    ];
    productsService.getProducts = async () => [];
    productsService.searchWithFilters = async (filters) => {
      assert.strictEqual(filters.query, 'Wireless Bluetooth Headphones');
      return wirelessHeadphones;
    };

    const result = await productAgent.handle({
      userId: 'user1',
      intent: 'LIST_PRODUCTS',
      params: { query: 'Wireless Bluetooth Headphones' },
    });

    assert.strictEqual(result.type, 'product_list');
    assert.ok(result.message.includes('1') && result.message.includes('product'));
    assert.strictEqual(Array.isArray(result.data), true);
    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(result.data[0].name, 'Wireless Bluetooth Headphones');
    assert.strictEqual(result.data[0]._id, 'p_wireless');
    assert.strictEqual(result.data[0].price, 2999);
    assert.strictEqual(result.data[0].discountPrice, 2499);
    assert.deepStrictEqual(result.suggestions, ['Add to cart', 'View details']);
  });

  it('returns product_list with data from getProducts when no filters', async () => {
    const fakeProducts = [
      { _id: 'p1', name: 'Laptop', slug: 'laptop', price: 50000, discountPrice: null, images: [], stock: 5, outOfStock: false, category: null },
    ];
    productsService.getProducts = async () => fakeProducts;
    productsService.searchWithFilters = async () => [];

    const result = await productAgent.handle({
      userId: 'user1',
      intent: 'LIST_PRODUCTS',
      params: {},
    });

    assert.strictEqual(result.type, 'product_list');
    assert.ok(result.message.includes('products'));
    assert.strictEqual(Array.isArray(result.data), true);
    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(result.data[0].name, 'Laptop');
    assert.strictEqual(result.data[0]._id, 'p1');
    assert.deepStrictEqual(result.suggestions, ['Add to cart', 'View details']);
  });

  it('returns product_list with searchWithFilters when params have maxPrice', async () => {
    const fakeProducts = [
      { _id: 'p2', name: 'Phone', slug: 'phone', price: 20000, discountPrice: 18000, images: [], stock: 10, outOfStock: false, category: null },
    ];
    productsService.getProducts = async () => [];
    productsService.searchWithFilters = async (filters) => {
      assert.strictEqual(filters.maxPrice, 25000);
      return fakeProducts;
    };

    const result = await productAgent.handle({
      userId: 'user1',
      intent: 'LIST_PRODUCTS',
      params: { maxPrice: 25000 },
    });

    assert.strictEqual(result.type, 'product_list');
    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(result.data[0].name, 'Phone');
  });

  it('returns empty message when no products found with filters', async () => {
    productsService.getProducts = async () => [];
    productsService.searchWithFilters = async () => [];

    const result = await productAgent.handle({
      userId: 'user1',
      intent: 'LIST_PRODUCTS',
      params: { category: 'laptop' },
    });

    assert.strictEqual(result.type, 'product_list');
    assert.strictEqual(result.data.length, 0);
    assert.ok(result.message.includes('No products found'));
  });
});
