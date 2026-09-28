const catalog = require('./catalog/electronicsCatalog12');
const expected = ['Computers & Laptops','Mobile & Tablets','Audio & Wearables','Gaming & Entertainment'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(catalog.length === 12, 'Catalogue must contain exactly 12 products.');
const byCategory = Object.fromEntries(expected.map((c) => [c, catalog.filter((p) => p.majorCategory === c)]));
for (const category of expected) assert(byCategory[category].length === 3, `${category} must contain exactly 3 products.`);
const skus = new Set(catalog.map((p) => p.sku));
assert(skus.size === 12, 'SKUs must be unique.');
for (const p of catalog) {
  assert(p.name && p.brand && p.model && p.description, `${p.sku}: required identity fields missing.`);
  assert(p.majorCategory && p.subcategory, `${p.sku}: category fields missing.`);
  assert(Number.isFinite(p.price) && p.price > 0, `${p.sku}: invalid price.`);
  assert(Number.isInteger(p.stock) && p.stock >= 0, `${p.sku}: invalid stock.`);
  assert(Array.isArray(p.images) && p.images.length > 0, `${p.sku}: image missing.`);
  assert(p.images.every((u) => /^https?:\/\//.test(u)), `${p.sku}: invalid image URL.`);
  assert(p.rating >= 0 && p.rating <= 5, `${p.sku}: invalid rating.`);
  assert(p.reviewCount >= 0, `${p.sku}: invalid review count.`);
  assert(p.originalPrice >= p.price, `${p.sku}: originalPrice must be >= price.`);
  assert(p.discount >= 0 && p.discount <= 100, `${p.sku}: invalid discount.`);
  assert(p.specifications && Object.keys(p.specifications).length >= 3, `${p.sku}: insufficient specifications.`);
}
console.log('CATALOG_QA_PASS');
console.log(JSON.stringify(Object.fromEntries(expected.map((c) => [c, byCategory[c].map((p) => p.name)])), null, 2));
