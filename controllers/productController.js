const Product = require('../models/Product');
const { getCache, setCache, invalidateByPrefix } = require('../services/redisService');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');

const SORT_OPTIONS = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  rating: { rating: -1 },
  popular: { reviewCount: -1 },
};

// GET /api/products
// Supports: search, majorCategory, subcategory, brand, minPrice, maxPrice,
// rating, availability, sort, page, limit.
// Flow: Redis cache check -> MongoDB on miss -> cache the result with a TTL.
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      majorCategory,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      rating,
      availability,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, fromCache: true, ...cached });
    }

    const filter = {};
    if (search) {
      filter.$text = { $search: search };
    }
    if (majorCategory) filter.majorCategory = majorCategory;
    if (subcategory) filter.subcategory = subcategory;
    if (brand) filter.brand = new RegExp(`^${escapeRegex(brand.trim())}$`, 'i');
    const parsedMinPrice = minPrice === undefined || minPrice === '' ? null : Number(minPrice);
    const parsedMaxPrice = maxPrice === undefined || maxPrice === '' ? null : Number(maxPrice);
    if (parsedMinPrice !== null && !Number.isFinite(parsedMinPrice)) {
      return res.status(400).json({ success: false, message: 'Minimum price must be a valid number' });
    }
    if (parsedMaxPrice !== null && !Number.isFinite(parsedMaxPrice)) {
      return res.status(400).json({ success: false, message: 'Maximum price must be a valid number' });
    }
    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return res.status(400).json({ success: false, message: 'Minimum price cannot exceed maximum price' });
    }
    if (parsedMinPrice !== null || parsedMaxPrice !== null) {
      filter.price = {};
      if (parsedMinPrice !== null) filter.price.$gte = Math.max(0, parsedMinPrice);
      if (parsedMaxPrice !== null) filter.price.$lte = Math.max(0, parsedMaxPrice);
    }
    if (rating) filter.rating = { $gte: Number(rating) };
    if (availability === 'inStock') filter.stock = { $gt: 0 };
    if (availability === 'outOfStock') filter.stock = { $lte: 0 };

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const pageNum = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const limitNum = Number.isFinite(parsedLimit) ? Math.min(50, Math.max(1, parsedLimit)) : 12; // cap page size
    const skip = (pageNum - 1) * limitNum;

    const rangeFilter = { ...filter };
    delete rangeFilter.price;
    const [products, total, rangeAgg] = await Promise.all([
      Product.find(filter)
        .sort(SORT_OPTIONS[sort] || SORT_OPTIONS.newest)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
      Product.aggregate([
        { $match: rangeFilter },
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
      ]),
    ]);
    const priceRange = {
      min: rangeAgg[0]?.min ?? 0,
      max: rangeAgg[0]?.max ?? 0,
    };

    const payload = {
      products,
      priceRange,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    };

    await setCache(cacheKey, payload);
    res.status(200).json({ success: true, fromCache: false, ...payload });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const cacheKey = `product:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, fromCache: true, product: cached });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await setCache(cacheKey, product);
    res.status(200).json({ success: true, fromCache: false, product });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id/related — simple same-category suggestion list.
const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const related = await Product.find({
      _id: { $ne: product._id },
      majorCategory: product.majorCategory,
      $or: [
        { subcategory: product.subcategory },
        { brand: product.brand },
        { featured: true },
      ],
    })
      .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
      .limit(8);
    res.status(200).json({ success: true, products: related });
  } catch (err) {
    next(err);
  }
};

// Invalidates every cached product list/detail — called by admin
// create/update/delete so stale data is never served.
const invalidateProductCache = () => invalidateByPrefix('product');

module.exports = { getProducts, getProductById, getRelatedProducts, invalidateProductCache };
