const prisma = require('../config/db');

const createReview = async (req, res) => {
  try {
    const { sellerId, rating, reviewText } = req.body;
    const reviewerId = req.user.id;

    // Verify seller exists
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found.' });
    }

    // A seller cannot review their own shop
    if (seller.userId === reviewerId) {
      return res.status(400).json({ error: 'Sellers cannot review their own profile.' });
    }

    const review = await prisma.review.create({
      data: {
        reviewerId,
        sellerId,
        rating,
        reviewText
      }
    });

    return res.status(201).json({
      message: 'Review created successfully.',
      review
    });
  } catch (error) {
    console.error('Create Review Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const editReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;
    const reviewerId = req.user.id;

    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    if (review.reviewerId !== reviewerId) {
      return res.status(403).json({ error: 'You are not authorized to edit this review.' });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating,
        reviewText
      }
    });

    return res.json({
      message: 'Review updated successfully.',
      review: updatedReview
    });
  } catch (error) {
    console.error('Edit Review Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    // Authorized: Reviewer themselves OR Admins
    const isOwner = review.reviewerId === userId;
    const isAdmin = userRole === 'SYSTEM_ADMIN' || userRole === 'CONDO_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this review.' });
    }

    await prisma.review.delete({
      where: { id }
    });

    return res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Delete Review Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  createReview,
  editReview,
  deleteReview
};
