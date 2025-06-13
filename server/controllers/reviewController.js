const Review = require('../models/review');

const getReview = async (req, res) => {
	const reviewId = req.params.id;

	Review.findById(reviewId, (err, review) => {
		if (err) {
			return res.status(400).json({ success: false, err });
		}

		return res.status(200).json({
			success: true,
			review,
		});
	});
};

const getAllReviews = async (req, res) => {
	Review.find({}, (err, reviews) => {
		if (err) {
			return res.status(400).json({ success: false, err });
		}

		return res.status(200).json({
			success: true,
			reviewsList: reviews,
		});
	});
};

const addReview = async (req, res) => {
	try {
		const { bookId, rating, comment } = req.body;
		const memberId = req.user._id;

		const review = new Review({
			bookId,
			memberId,
			rating,
			comment,
		});

		await review.save();
		res.status(201).json(review);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

const updateReview = async (req, res) => {
	const reviewId = req.params.id;
	const { rating, comment } = req.body;

	Review.findByIdAndUpdate(reviewId, { rating, comment }, { new: true }, (err, review) => {
		if (err) {
			return res.status(400).json({ success: false, err });
		}

		return res.status(200).json({
			success: true,
			review,
		});
	});
};

const deleteReview = async (req, res) => {
	const reviewId = req.params.id;

	Review.findByIdAndDelete(reviewId, (err, review) => {
		if (err) {
			return res.status(400).json({ success: false, err });
		}

		return res.status(200).json({
			success: true,
			review,
		});
	});
};

module.exports = {
	getReview,
	getAllReviews,
	addReview,
	updateReview,
	deleteReview,
};
