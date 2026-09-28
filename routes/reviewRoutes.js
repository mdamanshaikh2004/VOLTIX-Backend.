const express = require('express');
const router = express.Router();
const { updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Mounted at /api/reviews — creation/listing lives under /api/products/:id/reviews
// (see productRoutes.js), since a review is always created in that context.
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
