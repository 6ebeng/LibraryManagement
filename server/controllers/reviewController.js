const Review = require('../models/review');
const mongoose = require('mongoose');
const { errorMessages } = require('../utils/errorMessages');

const getReview = async (req, res) => {
	const { id: reviewId } = req.params;

	// Validate review ID format
	if (!mongoose.Types.ObjectId.isValid(reviewId)) {
		return res.status(400).json({
			success: false,
			message: errorMessages.review.invalidData,
		});
	}

	try {
		const review = await Review.findById(reviewId);

		if (!review) {
			return res.status(404).json({
				success: false,
				message: errorMessages.review.notFound,
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
			message: errorMessages.general.databaseError,
		});
	}
};

const getAllReviews = async (req, res) => {
	const { bookId } = req.params;

	// Validate book ID format
	if (!mongoose.Types.ObjectId.isValid(bookId)) {
		return res.status(400).json({
			success: false,
			message: errorMessages.book.invalidData,
		});
	}

	try {
		// Find reviews specifically for the given bookId
		const reviews = await Review.find({ bookId }).populate('memberId', 'name'); // Populates the 'name' field from the User model

		return res.status(200).json({
			success: true,
			reviewList: reviews, // Changed from reviewsList to reviewList
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
	// The frontend is sending memberId in the body, so we get it from there.
	const { bookId, rating, comment, memberId } = req.body;

	// --- Validation ---
	if (!memberId) {
		return res.status(401).json({ success: false, message: errorMessages.auth.unauthorized });
	}
	if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
		return res.status(400).json({ success: false, message: errorMessages.book.invalidData });
	}
	if (rating === undefined || rating < 1 || rating > 5) {
		return res.status(400).json({ success: false, message: errorMessages.review.invalidRating });
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
			message: 'Your review has been successfully submitted.',
		});
	} catch (error) {
		console.error('Error creating review:', error);
		res.status(500).json({ success: false, message: errorMessages.review.createFailed });
	}
};

const updateReview = async (req, res) => {
	const { id: reviewId } = req.params;
	const { rating, comment } = req.body;

	// Validate review ID format
	if (!mongoose.Types.ObjectId.isValid(reviewId)) {
		return res.status(400).json({ success: false, message: errorMessages.review.invalidData });
	}

	// Validate rating if provided
	if (rating !== undefined && (rating < 1 || rating > 5)) {
		return res.status(400).json({ success: false, message: errorMessages.review.invalidRating });
	}

	try {
		const updatedReview = await Review.findByIdAndUpdate(reviewId, { rating, comment }, { new: true, runValidators: true });

		if (!updatedReview) {
			return res.status(404).json({
				success: false,
				message: errorMessages.review.notFound,
			});
		}

		return res.status(200).json({
			success: true,
			review: updatedReview,
			message: 'Your review has been successfully updated.',
		});
	} catch (err) {
		console.error('Error updating review:', err);
		return res.status(500).json({
			success: false,
			message: errorMessages.review.updateFailed,
		});
	}
};

const deleteReview = async (req, res) => {
	const { id: reviewId } = req.params;

	// Validate review ID format
	if (!mongoose.Types.ObjectId.isValid(reviewId)) {
		return res.status(400).json({ success: false, message: errorMessages.review.invalidData });
	}

	try {
		const deletedReview = await Review.findByIdAndDelete(reviewId);

		if (!deletedReview) {
			return res.status(404).json({
				success: false,
				message: errorMessages.review.notFound,
			});
		}

		return res.status(200).json({
			success: true,
			review: deletedReview,
			message: 'Your review has been successfully deleted.',
		});
	} catch (err) {
		console.error('Error deleting review:', err);
		return res.status(500).json({
			success: false,
			message: errorMessages.review.deleteFailed,
		});
	}
};

module.exports = {
	getReview,
	getAllReviews,
	addReview,
	updateReview, // Added missing export
	deleteReview,
};
