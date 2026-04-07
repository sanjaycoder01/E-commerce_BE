/**
 * Seeds categories and up to 35 products matching Product schema.
 * Idempotent: skips products whose SKU already exists.
 *
 * Usage: node src/scripts/seedProducts.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const config = require('../config');
const connectDBFallback = require('../db');
const { Category, Product } = require('../models');

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion & Apparel', slug: 'fashion-apparel' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
  { name: 'Books & Media', slug: 'books-media' },
];

/** 35 items: names/prices informed by typical e‑commerce bestseller categories (electronics, fashion, home, sports, beauty, books). */
const PRODUCT_ROWS = [
  // Electronics (8) — wireless/ANC headphones, laptops, earbuds, TV, peripherals (market trends: ANC, smart TVs, USB-C hubs)
  {
    sku: 'SEED-ELE-001',
    name: 'Wireless ANC Over-Ear Headphones',
    slug: 'wireless-anc-over-ear-headphones',
    description:
      'Active noise cancellation, 30-hour battery, foldable design with travel case. Popular for commute and open-office use.',
    price: 149.99,
    discountPrice: 129.99,
    stock: 120,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    categorySlug: 'electronics',
    ratingsAverage: 4.5,
    ratingsCount: 842,
  },
  {
    sku: 'SEED-ELE-002',
    name: 'Ultrabook Laptop 16GB RAM 512GB SSD',
    slug: 'ultrabook-laptop-16gb-512gb',
    description:
      'Thin-and-light laptop with vivid display, all-day battery, and fast SSD—aligned with current demand for portable productivity machines.',
    price: 999,
    discountPrice: 949,
    stock: 35,
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'],
    categorySlug: 'electronics',
    ratingsAverage: 4.7,
    ratingsCount: 1203,
  },
  {
    sku: 'SEED-ELE-003',
    name: 'Bluetooth True Wireless Earbuds',
    slug: 'bluetooth-true-wireless-earbuds',
    description:
      'Compact charging case, IPX4 sweat resistance, touch controls—similar to high-volume wireless earbud listings.',
    price: 49.99,
    stock: 200,
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
    categorySlug: 'electronics',
    ratingsAverage: 4.3,
    ratingsCount: 2104,
  },
  {
    sku: 'SEED-ELE-004',
    name: '55-inch 4K Smart LED TV',
    slug: '55-inch-4k-smart-led-tv',
    description:
      '4K HDR, built-in streaming apps, voice remote—typical mid-size living room upgrade.',
    price: 599,
    discountPrice: 549,
    stock: 28,
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80'],
    categorySlug: 'electronics',
    ratingsAverage: 4.4,
    ratingsCount: 512,
  },
  {
    sku: 'SEED-ELE-005',
    name: 'Mechanical Gaming Keyboard RGB',
    slug: 'mechanical-gaming-keyboard-rgb',
    description:
      'Tactile switches, per-key RGB, detachable USB-C cable—common gaming peripheral category.',
    price: 89.99,
    stock: 75,
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'],
    categorySlug: 'electronics',
    ratingsAverage: 4.6,
    ratingsCount: 903,
  },
  {
    sku: 'SEED-ELE-006',
    name: 'Wireless Ergonomic Mouse',
    slug: 'wireless-ergonomic-mouse',
    description:
      'Comfortable contour grip, multi-device pairing, precision scroll wheel.',
    price: 39.99,
    stock: 150,
    images: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80'],
    categorySlug: 'electronics',
    ratingsAverage: 4.2,
    ratingsCount: 441,
  },
  {
    sku: 'SEED-ELE-007',
    name: 'USB-C 7-in-1 Hub',
    slug: 'usb-c-7-in-1-hub',
    description:
      'HDMI 4K, SD/microSD, USB 3.0 ports, pass-through charging—standard laptop accessory.',
    price: 45,
    stock: 90,
    images: ['https://images.unsplash.com/photo-1625948519841-f12b9f2b0a62?w=800&q=80'],
    categorySlug: 'electronics',
    ratingsAverage: 4.1,
    ratingsCount: 667,
  },
  {
    sku: 'SEED-ELE-008',
    name: 'Portable Waterproof Bluetooth Speaker',
    slug: 'portable-waterproof-bluetooth-speaker',
    description:
      '360° sound, IPX7 waterproof, 12-hour playtime—outdoor and travel favorite.',
    price: 79.99,
    discountPrice: 69.99,
    stock: 60,
    images: ['https://images.unsplash.com/photo-1608043152269-423db39ab961?w=800&q=80'],
    categorySlug: 'electronics',
    ratingsAverage: 4.5,
    ratingsCount: 1122,
  },
  // Fashion & Apparel (6)
  {
    sku: 'SEED-FAS-001',
    name: 'Classic Cotton Crew Neck T-Shirt',
    slug: 'classic-cotton-crew-neck-t-shirt',
    description:
      'Breathable 100% cotton, regular fit—everyday staple in online apparel.',
    price: 24.99,
    stock: 300,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],
    categorySlug: 'fashion-apparel',
    ratingsAverage: 4.0,
    ratingsCount: 320,
  },
  {
    sku: 'SEED-FAS-002',
    name: 'Slim Fit Denim Jeans',
    slug: 'slim-fit-denim-jeans',
    description:
      'Stretch denim, slim leg, five-pocket styling.',
    price: 59.99,
    stock: 180,
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21ef324?w=800&q=80'],
    categorySlug: 'fashion-apparel',
    ratingsAverage: 4.2,
    ratingsCount: 210,
  },
  {
    sku: 'SEED-FAS-003',
    name: 'Lightweight Running Sneakers',
    slug: 'lightweight-running-sneakers',
    description:
      'Cushioned midsole, breathable mesh upper—in line with athletic footwear demand.',
    price: 89.99,
    discountPrice: 79.99,
    stock: 95,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'],
    categorySlug: 'fashion-apparel',
    ratingsAverage: 4.6,
    ratingsCount: 1505,
  },
  {
    sku: 'SEED-FAS-004',
    name: 'Wool Blend Winter Coat',
    slug: 'wool-blend-winter-coat',
    description:
      'Tailored silhouette, insulated lining, wind-resistant shell.',
    price: 149.99,
    stock: 45,
    images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80'],
    categorySlug: 'fashion-apparel',
    ratingsAverage: 4.4,
    ratingsCount: 88,
  },
  {
    sku: 'SEED-FAS-005',
    name: 'Leather Crossbody Bag',
    slug: 'leather-crossbody-bag',
    description:
      'Adjustable strap, zip closure, compact everyday carry.',
    price: 79.99,
    stock: 70,
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'],
    categorySlug: 'fashion-apparel',
    ratingsAverage: 4.3,
    ratingsCount: 156,
  },
  {
    sku: 'SEED-FAS-006',
    name: 'UV Polarized Sunglasses',
    slug: 'uv-polarized-sunglasses',
    description:
      'Polarized lenses, lightweight frame, included microfiber pouch.',
    price: 34.99,
    stock: 220,
    images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80'],
    categorySlug: 'fashion-apparel',
    ratingsAverage: 4.1,
    ratingsCount: 402,
  },
  // Home & Kitchen (6)
  {
    sku: 'SEED-HOM-001',
    name: 'Stainless Steel Cookware Set 10-Piece',
    slug: 'stainless-steel-cookware-set-10-piece',
    description:
      'Even-heating bases, oven-safe handles, dishwasher safe—popular kitchen upgrade.',
    price: 129.99,
    stock: 40,
    images: ['https://images.unsplash.com/photo-1584990347447-8df6a85f2137?w=800&q=80'],
    categorySlug: 'home-kitchen',
    ratingsAverage: 4.5,
    ratingsCount: 620,
  },
  {
    sku: 'SEED-HOM-002',
    name: 'Programmable Electric Pressure Cooker 6 Qt',
    slug: 'programmable-electric-pressure-cooker-6qt',
    description:
      'Multi-function presets for rice, stew, yogurt; safety-lock lid.',
    price: 99.99,
    discountPrice: 89.99,
    stock: 55,
    images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80'],
    categorySlug: 'home-kitchen',
    ratingsAverage: 4.6,
    ratingsCount: 2401,
  },
  {
    sku: 'SEED-HOM-003',
    name: 'High-Speed Countertop Blender 1200W',
    slug: 'high-speed-countertop-blender-1200w',
    description:
      'Smoothies, soups, and crushed ice; BPA-free pitcher.',
    price: 89.99,
    stock: 48,
    images: ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80'],
    categorySlug: 'home-kitchen',
    ratingsAverage: 4.4,
    ratingsCount: 330,
  },
  {
    sku: 'SEED-HOM-004',
    name: 'Egyptian Cotton Sheet Set Queen',
    slug: 'egyptian-cotton-sheet-set-queen',
    description:
      '400 thread count, deep pockets, breathable weave.',
    price: 69.99,
    stock: 100,
    images: ['https://images.unsplash.com/photo-1631049307264-da0adb9491c8?w=800&q=80'],
    categorySlug: 'home-kitchen',
    ratingsAverage: 4.2,
    ratingsCount: 890,
  },
  {
    sku: 'SEED-HOM-005',
    name: 'Robot Vacuum with Room Mapping',
    slug: 'robot-vacuum-with-room-mapping',
    description:
      'LiDAR navigation, app scheduling, auto recharge—common smart-home category.',
    price: 299,
    discountPrice: 269,
    stock: 22,
    images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80'],
    categorySlug: 'home-kitchen',
    ratingsAverage: 4.3,
    ratingsCount: 1104,
  },
  {
    sku: 'SEED-HOM-006',
    name: 'Glass Food Storage Containers Set',
    slug: 'glass-food-storage-containers-set',
    description:
      'Leak-proof lids, oven and microwave safe, stackable.',
    price: 39.99,
    stock: 130,
    images: ['https://images.unsplash.com/photo-1584736286279-4e9a3a0d3c0b?w=800&q=80'],
    categorySlug: 'home-kitchen',
    ratingsAverage: 4.0,
    ratingsCount: 210,
  },
  // Sports & Outdoors (5)
  {
    sku: 'SEED-SPO-001',
    name: 'Adjustable Dumbbells Pair 5–25 lb',
    slug: 'adjustable-dumbbells-pair-5-25-lb',
    description:
      'Quick-select weight plates, compact for home gyms—strong e‑commerce category post-2020.',
    price: 199,
    stock: 30,
    images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'],
    categorySlug: 'sports-outdoors',
    ratingsAverage: 4.5,
    ratingsCount: 756,
  },
  {
    sku: 'SEED-SPO-002',
    name: 'Non-Slip Yoga Mat 6mm',
    slug: 'non-slip-yoga-mat-6mm',
    description:
      'Dense cushioning, carrying strap, latex-free material.',
    price: 29.99,
    stock: 160,
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80'],
    categorySlug: 'sports-outdoors',
    ratingsAverage: 4.4,
    ratingsCount: 1200,
  },
  {
    sku: 'SEED-SPO-003',
    name: 'Insulated Stainless Steel Water Bottle 32 oz',
    slug: 'insulated-stainless-steel-water-bottle-32oz',
    description:
      'Double-wall vacuum, keeps cold 24h, powder coat finish.',
    price: 24.99,
    stock: 250,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80'],
    categorySlug: 'sports-outdoors',
    ratingsAverage: 4.6,
    ratingsCount: 3400,
  },
  {
    sku: 'SEED-SPO-004',
    name: 'Resistance Bands Set 5-Pack',
    slug: 'resistance-bands-set-5-pack',
    description:
      'Color-coded strengths, door anchor included, for strength and mobility.',
    price: 19.99,
    stock: 400,
    images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80'],
    categorySlug: 'sports-outdoors',
    ratingsAverage: 4.2,
    ratingsCount: 890,
  },
  {
    sku: 'SEED-SPO-005',
    name: 'High-Density Foam Roller',
    slug: 'high-density-foam-roller',
    description:
      '18-inch length, firm EPP foam for recovery and mobility.',
    price: 22.99,
    stock: 140,
    images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80'],
    categorySlug: 'sports-outdoors',
    ratingsAverage: 4.3,
    ratingsCount: 445,
  },
  // Beauty & Personal Care (5)
  {
    sku: 'SEED-BEA-001',
    name: 'Hydrating Facial Moisturizer SPF 30',
    slug: 'hydrating-facial-moisturizer-spf-30',
    description:
      'Broad-spectrum SPF, non-comedogenic, daily use—core skincare SKU.',
    price: 32,
    stock: 200,
    images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80'],
    categorySlug: 'beauty-personal-care',
    ratingsAverage: 4.4,
    ratingsCount: 670,
  },
  {
    sku: 'SEED-BEA-002',
    name: 'Vitamin C Brightening Serum 30ml',
    slug: 'vitamin-c-brightening-serum-30ml',
    description:
      'Antioxidant formula, helps with dullness; patch test recommended.',
    price: 28,
    discountPrice: 24.99,
    stock: 150,
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80'],
    categorySlug: 'beauty-personal-care',
    ratingsAverage: 4.5,
    ratingsCount: 920,
  },
  {
    sku: 'SEED-BEA-003',
    name: 'Argan Oil Deep Conditioning Hair Mask',
    slug: 'argan-oil-deep-conditioning-hair-mask',
    description:
      'Weekly treatment for dry and damaged hair; sulfate-free.',
    price: 18.99,
    stock: 175,
    images: ['https://images.unsplash.com/photo-1526947428130-e0d7364e2e7c?w=800&q=80'],
    categorySlug: 'beauty-personal-care',
    ratingsAverage: 4.1,
    ratingsCount: 340,
  },
  {
    sku: 'SEED-BEA-004',
    name: 'Sonic Facial Cleansing Brush',
    slug: 'sonic-facial-cleansing-brush',
    description:
      'Soft bristles, waterproof, multiple speed settings.',
    price: 45,
    stock: 85,
    images: ['https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80'],
    categorySlug: 'beauty-personal-care',
    ratingsAverage: 4.0,
    ratingsCount: 210,
  },
  {
    sku: 'SEED-BEA-005',
    name: 'Matte Liquid Lipstick Set',
    slug: 'matte-liquid-lipstick-set',
    description:
      'Four transfer-resistant shades, long wear, gift-ready packaging.',
    price: 24,
    stock: 110,
    images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80'],
    categorySlug: 'beauty-personal-care',
    ratingsAverage: 4.3,
    ratingsCount: 560,
  },
  // Books & Media (5)
  {
    sku: 'SEED-BOO-001',
    name: 'The Art of Product Design (Hardcover)',
    slug: 'the-art-of-product-design-hardcover',
    description:
      'Illustrated guide to user-centered design and prototyping—representative design/business title.',
    price: 29.99,
    stock: 80,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80'],
    categorySlug: 'books-media',
    ratingsAverage: 4.6,
    ratingsCount: 120,
  },
  {
    sku: 'SEED-BOO-002',
    name: 'Modern JavaScript: The Complete Guide',
    slug: 'modern-javascript-the-complete-guide',
    description:
      'In-depth programming reference with exercises—typical tech book listing.',
    price: 44.99,
    discountPrice: 39.99,
    stock: 60,
    images: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80'],
    categorySlug: 'books-media',
    ratingsAverage: 4.7,
    ratingsCount: 890,
  },
  {
    sku: 'SEED-BOO-003',
    name: 'Illustrated World History Atlas',
    slug: 'illustrated-world-history-atlas',
    description:
      'Maps and timelines from ancient to modern eras; coffee-table format.',
    price: 34.99,
    stock: 45,
    images: ['https://images.unsplash.com/photo-1524995997946-a7c838e0f29b?w=800&q=80'],
    categorySlug: 'books-media',
    ratingsAverage: 4.4,
    ratingsCount: 203,
  },
  {
    sku: 'SEED-BOO-004',
    name: 'Bestselling Mystery Novel (Paperback)',
    slug: 'bestselling-mystery-novel-paperback',
    description:
      'Twist-filled crime story; mass-market fiction segment.',
    price: 16.99,
    stock: 200,
    images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80'],
    categorySlug: 'books-media',
    ratingsAverage: 4.2,
    ratingsCount: 4500,
  },
  {
    sku: 'SEED-BOO-005',
    name: "Children's Picture Book Collection",
    slug: 'childrens-picture-book-collection',
    description:
      'Three hardcover stories with full-color illustrations—family gifting category.',
    price: 19.99,
    stock: 95,
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80'],
    categorySlug: 'books-media',
    ratingsAverage: 4.8,
    ratingsCount: 112,
  },
];

async function ensureCategories() {
  const map = {};
  for (const c of CATEGORIES) {
    let doc = await Category.findOne({ slug: c.slug });
    if (!doc) {
      doc = await Category.create({
        name: c.name,
        slug: c.slug,
        isActive: true,
      });
    }
    map[c.slug] = doc._id;
  }
  return map;
}

async function seed() {
  const uri = config.uri || config.MONGODB_URI;
  if (uri) {
    await mongoose.connect(uri, config.options || {});
  } else {
    await connectDBFallback();
  }
  console.log('Connected to MongoDB');

  const categoryIds = await ensureCategories();
  console.log(`Categories ready: ${CATEGORIES.length}`);

  let inserted = 0;
  let skipped = 0;

  for (const row of PRODUCT_ROWS) {
    const exists = await Product.findOne({ sku: row.sku });
    if (exists) {
      skipped += 1;
      continue;
    }

    const categoryId = categoryIds[row.categorySlug];
    if (!categoryId) {
      console.warn('Unknown category slug:', row.categorySlug);
      continue;
    }

    const { categorySlug, ...rest } = row;
    await Product.create({
      ...rest,
      category: categoryId,
      isActive: true,
    });
    inserted += 1;
  }

  const total = await Product.countDocuments();
  console.log(`Products inserted this run: ${inserted}, skipped (already seeded): ${skipped}`);
  console.log(`Total products in DB: ${total}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
