const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createReview, editReview, deleteReview } = require('../controllers/reviewController');
const { validateRequest, reviewSchema } = require('../middleware/zodSchemas');
const { z } = require('zod');

router.post('/', authenticateToken, validateRequest(reviewSchema), createReview);

const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(500).optional()
});
router.put('/:id', authenticateToken, validateRequest(reviewUpdateSchema), editReview);

router.delete('/:id', authenticateToken, deleteReview);

module.exports = router;
