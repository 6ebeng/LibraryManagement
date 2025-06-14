const Borrowal = require('../models/borrowal');
const mongoose = require('mongoose');
const Book = require('../models/book');

// Refactored to use async/await and try/catch for better error handling
const getBorrowal = async (req, res) => {
	try {
		const borrowal = await Borrowal.findById(req.params.id);
		if (!borrowal) {
			return res.status(404).json({ success: false, message: 'Borrowal not found' });
		}
		return res.status(200).json({ success: true, borrowal });
	} catch (err) {
		// Log the error for server-side debugging
		console.error(`Error in getBorrowal (ID: ${req.params.id}): ${err.message}`, err);
		return res.status(500).json({ success: false, message: 'An unexpected error occurred while retrieving the borrowal.', error: err.message });
	}
};

// Refactored to use async/await
const getAllBorrowals = async (req, res) => {
	try {
		const borrowals = await Borrowal.aggregate([
			{
				$lookup: {
					from: 'users', // Collection name for User model
					localField: 'memberId',
					foreignField: '_id',
					as: 'member',
				},
			},
			{ $unwind: '$member' }, // Could use { path: '$member', preserveNullAndEmptyArrays: true } if a borrowal might not have a member temporarily
			{
				$lookup: {
					from: 'books', // Collection name for Book model
					localField: 'bookId',
					foreignField: '_id',
					as: 'book',
				},
			},
			{ $unwind: '$book' }, // Could use { path: '$book', preserveNullAndEmptyArrays: true }
		]);
		return res.status(200).json({ success: true, borrowalsList: borrowals });
	} catch (err) {
		console.error(`Error in getAllBorrowals: ${err.message}`, err);
		return res.status(500).json({ success: false, message: 'An unexpected error occurred while retrieving borrowals.', error: err.message });
	}
};

// MODIFIED to handle concurrent borrowal attempts atomically
const addBorrowal = async (req, res) => {
	try {
		const bookId = mongoose.Types.ObjectId(req.body.bookId);
		const memberId = mongoose.Types.ObjectId(req.body.memberId);

		// Step 1: Atomically find an available book and mark it as unavailable.
		// 'new: false' (default) returns the document before the update.
		// If it was available, updatedBook will be the book object *before* isAvailable was set to false.
		// If it was not available, or not found, updatedBook will be null.
		const claimedBook = await Book.findOneAndUpdate(
			{ _id: bookId, isAvailable: true }, // Condition: Book exists and is available
			{ $set: { isAvailable: false } } // Action: Mark as unavailable
			// { new: true } // Use new:true if you need the *updated* book document from this step
		);

		// Step 2: Check if the book was successfully claimed.
		if (!claimedBook) {
			// If claimedBook is null, it means the book was not found with isAvailable: true.
			// This handles the case where the book doesn't exist or was already borrowed by another concurrent request.
			return res.status(400).json({
				success: false,
				message: 'This book is currently not available for borrowing', // Specific message for test
			});
		}

		// Step 3: If the book was successfully claimed, proceed to create the borrowal record.
		const newBorrowalData = {
			bookId: bookId,
			memberId: memberId,
			status: 'Borrowed', // Default status
			// dueDate, borrowedDate can be set here or by model defaults/hooks
		};

		const borrowal = await Borrowal.create(newBorrowalData);

		return res.status(201).json({ success: true, newBorrowal: borrowal });
	} catch (err) {
		console.error(`Error in addBorrowal (BookID: ${req.body.bookId}, MemberID: ${req.body.memberId}): ${err.message}`, err);
		// Handle potential errors during Borrowal.create or if ObjectId casting fails
		if (err.name === 'ValidationError') {
			return res.status(400).json({ success: false, message: 'Validation error creating borrowal.', error: err.message });
		}
		return res.status(500).json({ success: false, message: 'An unexpected error occurred while creating the borrowal.', error: err.message });
	}
};

// Refactored to return the updated document
const updateBorrowal = async (req, res) => {
	try {
		const updatedBorrowal = await Borrowal.findByIdAndUpdate(
			req.params.id,
			req.body, // Ensure req.body is sanitized and only allowed fields are updated
			{ new: true, runValidators: true } // Return updated doc and run schema validators
		);

		if (!updatedBorrowal) {
			return res.status(404).json({ success: false, message: 'Borrowal not found to update' });
		}

		// If borrowal status is 'Returned', make the book available again
		if (req.body.status && req.body.status === 'Returned') {
			await Book.findByIdAndUpdate(updatedBorrowal.bookId, { isAvailable: true });
		}

		return res.status(200).json({ success: true, updatedBorrowal });
	} catch (err) {
		console.error(`Error in updateBorrowal (ID: ${req.params.id}): ${err.message}`, err);
		if (err.name === 'ValidationError') {
			return res.status(400).json({ success: false, message: 'Validation error updating borrowal.', error: err.message });
		}
		return res.status(500).json({ success: false, message: 'An unexpected error occurred while updating the borrowal.', error: err.message });
	}
};

// Refactored to handle nested asynchronous operations and check for existence
const deleteBorrowal = async (req, res) => {
	try {
		const borrowal = await Borrowal.findByIdAndDelete(req.params.id);

		if (!borrowal) {
			return res.status(404).json({ success: false, message: 'Borrowal not found to delete' });
		}

		// Make the book available again since the borrowal record is deleted
		// This assumes deleting a borrowal means the book is effectively returned or was never truly borrowed.
		// If the borrowal status was 'Borrowed', it should ideally be 'Returned' first via updateBorrowal.
		// However, if a 'Borrowed' record is deleted directly, the book should become available.
		await Book.findByIdAndUpdate(borrowal.bookId, { isAvailable: true });

		return res.status(200).json({ success: true, deletedBorrowal: borrowal });
	} catch (err) {
		console.error(`Error in deleteBorrowal (ID: ${req.params.id}): ${err.message}`, err);
		return res.status(500).json({ success: false, message: 'An unexpected error occurred while deleting the borrowal.', error: err.message });
	}
};

module.exports = {
	getBorrowal,
	getAllBorrowals,
	addBorrowal,
	updateBorrowal,
	deleteBorrowal,
};
