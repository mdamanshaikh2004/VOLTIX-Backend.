const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    verifiedPurchase: { type: Boolean, default: false },
    // Seeded storefront examples are explicitly marked so demo content is never presented as a real customer purchase.
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// One review per user per product — enforced at the DB level.
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1 });

module.exports = mongoose.model('Review', reviewSchema);
