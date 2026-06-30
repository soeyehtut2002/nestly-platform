const express = require('express');
const router = express.Router();
const { 
  createListing, 
  getListings, 
  getListingById, 
  updateListing, 
  deleteListing, 
  toggleFavorite, 
  getFavorites 
} = require('../controllers/listingController');
const { authenticateToken } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const { validateRequest, listingSchema, listingUpdateSchema } = require('../middleware/zodSchemas');

// Public listings feed requires tenant header context (X-Condo-ID)
router.get('/', tenantMiddleware, getListings);

// Favorites list endpoint - MUST be defined before GET /:id route
router.get('/favorites', authenticateToken, getFavorites);

// Public single listing detail
router.get('/:id', getListingById);

// Protected actions
router.post('/', authenticateToken, validateRequest(listingSchema), createListing);
router.put('/:id', authenticateToken, validateRequest(listingUpdateSchema), updateListing);
router.delete('/:id', authenticateToken, deleteListing);

// Favorite toggle
router.post('/:id/favorite', authenticateToken, toggleFavorite);

module.exports = router;
