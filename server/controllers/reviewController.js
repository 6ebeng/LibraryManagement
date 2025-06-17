const Review = require('../models/review');
const mongoose = require('mongoose');
// Import both errorMessages (for direct access to existing categories like 'book', 'general')
// and getErrorMessage (for safe access with fallbacks, especially for 'review')
const { errorMessages, getErrorMessage } = require('../utils/errorMessages');

const getReview = async (req, res) => {
	const { id: reviewId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(reviewId)) {
		return res.status(400).json({
			success: false,
			// Use getErrorMessage for review-specific messages
			message: getErrorMessage('review', 'invalidData', 'Invalid review ID format.'),
		});
	}

	try {
		const review = await Review.findById(reviewId);

		if (!review) {
			return res.status(404).json({
				success: false,
				message: getErrorMessage('review', 'notFound', 'Review not found.'),
			});
		}

		return res.status(200).json({
			success: true,
			review,
		});
	} catch (err) {
		console.error('Database error fetching review:', err);
		return res.status(500).json({
			success: false,
			message: errorMessages.general.databaseError, // Existing general message
		});
	}
};

const getAllReviews = async (req, res) => {
	const { bookId } = req.params;

	// If bookId is provided, validate it.
	if (bookId && !mongoose.Types.ObjectId.isValid(bookId)) {
		return res.status(400).json({
			success: false,
			message: errorMessages.book.invalidData,
		});
	}

	try {
		const query = bookId ? { bookId } : {};
		const reviews = await Review.find(query).populate('memberId', 'name').populate('bookId', 'name');

		return res.status(200).json({
			success: true,
			reviewsList: reviews,
		});
	} catch (err) {
		console.error('Database error fetching reviews:', err);
		return res.status(500).json({
			success: false,
			message: errorMessages.general.databaseError,
		});
	}
};

const addReview = async (req, res) => {
	const { bookId, rating, comment, memberId } = req.body;

	if (!memberId) {
		return res.status(401).json({ success: false, message: errorMessages.auth.unauthorized }); // Existing auth message
	}
	if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
		return res.status(400).json({ success: false, message: errorMessages.book.invalidData }); // Existing book message
	}
	// Safely get the error message for invalid rating
	if (rating === undefined || rating < 1 || rating > 5) {
		return res.status(400).json({
			success: false,
			message: getErrorMessage('review', 'invalidRating', 'Rating must be a number between 1 and 5.'),
		});
	}

	try {
		const newReviewData = {
			bookId,
			memberId,
			rating,
			comment,
		};
		const review = await Review.create(newReviewData);
		return res.status(201).json({
			success: true,
			review,
			message: 'Your review has been successfully submitted.', // Success message, not from errorMessages
		});
	} catch (error) {
		console.error('Error creating review:', error);
		// Safely get the error message for creation failure
		res.status(500).json({
			success: false,
			message: getErrorMessage('review', 'createFailed', 'Failed to submit your review. Please try again.'),
		});
	}
};

const updateReview = async (req, res) => {
	const { id: reviewId } = req.params;
	const { rating, comment } = req.body;

	if (!mongoose.Types.ObjectId.isValid(reviewId)) {
		return res.status(400).json({
			success: false,
			message: getErrorMessage('review', 'invalidData', 'Invalid review ID format.'),
		});
	}

	if (rating !== undefined && (rating < 1 || rating > 5)) {
		return res.status(400).json({
			success: false,
			message: getErrorMessage('review', 'invalidRating', 'Rating must be a number between 1 and 5.'),
		});
	}

	try {
		const updatedReview = await Review.findByIdAndUpdate(reviewId, { rating, comment }, { new: true, runValidators: true });

		if (!updatedReview) {
			return res.status(404).json({
				success: false,
				message: getErrorMessage('review', 'notFound', 'Review not found.'),
			});
		}

		return res.status(200).json({
			success: true,
			review: updatedReview,
			message: 'Your review has been successfully updated.', // Success message
		});
	} catch (err) {
		console.error('Error updating review:', err);
		return res.status(500).json({
			success: false,
			message: getErrorMessage('review', 'updateFailed', 'Failed to update your review. Please try again.'),
		});
	}
};

const deleteReview = async (req, res) => {
	const { id: reviewId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(reviewId)) {
		return res.status(400).json({
			success: false,
			message: getErrorMessage('review', 'invalidData', 'Invalid review ID format.'),
		});
	}

	try {
		const deletedReview = await Review.findByIdAndDelete(reviewId);

		if (!deletedReview) {
			return res.status(404).json({
				success: false,
				message: getErrorMessage('review', 'notFound', 'Review not found.'),
			});
		}

		return res.status(200).json({
			success: true,
			review: deletedReview,
			message: 'Your review has been successfully deleted.', // Success message
		});
	} catch (err) {
		console.error('Error deleting review:', err);
		return res.status(500).json({
			success: false,
			message: getErrorMessage('review', 'deleteFailed', 'Failed to delete your review. Please try again.'),
		});
	}
};

module.exports = {
	getReview,
	getAllReviews,
	addReview,
	updateReview,
	deleteReview,
};
