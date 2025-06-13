const mongoose = require('mongoose');

// The review schema is updated to include a reference to the User model.
// This creates a link between a review and the member who wrote it.
const reviewSchema = new mongoose.Schema(
	{
		bookId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Book', // Reference to the Book model
			required: true,
		},
		memberId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		comment: {
			type: String,
			required: false,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
