const mongoose = require('mongoose');

const MAJOR_CATEGORIES = [
  'Computers & Laptops',
  'Mobile & Tablets',
  'Audio & Wearables',
  'Gaming & Entertainment',
];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, trim: true },
    description: { type: String, required: true },
    majorCategory: { type: String, required: true, enum: MAJOR_CATEGORIES },
    subcategory: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, min: 0, max: 100, default: 0 },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, required: true, unique: true, trim: true },
    // Admin-provided starting rating. Final rating is recalculated from this value and customer reviews.
    initialRating: { type: Number, min: 0, max: 5, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    // Free-form key/value technical specs — fields differ per category
    // (e.g. Processor/RAM/Storage for laptops, Driver Size for headphones).
    specifications: { type: Map, of: String, default: {} },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', brand: 'text', model: 'text', tags: 'text' });
productSchema.index({ majorCategory: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });

productSchema.statics.MAJOR_CATEGORIES = MAJOR_CATEGORIES;

module.exports = mongoose.model('Product', productSchema);
