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
		return res.status(500).json({ success: false, err: err.message });
	}
};

// Refactored to use async/await
const getAllBorrowals = async (req, res) => {
	try {
		const borrowals = await Borrowal.aggregate([
			{
				$lookup: {
					from: 'users',
					localField: 'memberId',
					foreignField: '_id',
					as: 'member',
				},
			},
			{ $unwind: '$member' },
			{
				$lookup: {
					from: 'books',
					localField: 'bookId',
					foreignField: '_id',
					as: 'book',
				},
			},
			{ $unwind: '$book' },
		]);
		return res.status(200).json({ success: true, borrowalsList: borrowals });
	} catch (err) {
		return res.status(500).json({ success: false, err: err.message });
	}
};

// Refactored to handle nested asynchronous operations cleanly
const addBorrowal = async (req, res) => {
	try {
		const newBorrowalData = {
			...req.body,
			memberId: mongoose.Types.ObjectId(req.body.memberId),
			bookId: mongoose.Types.ObjectId(req.body.bookId),
		};

		const borrowal = await Borrowal.create(newBorrowalData);
		await Book.findByIdAndUpdate(newBorrowalData.bookId, { isAvailable: false });

		return res.status(201).json({ success: true, newBorrowal: borrowal });
	} catch (err) {
		return res.status(400).json({ success: false, err: err.message });
	}
};

// Refactored to return the updated document
const updateBorrowal = async (req, res) => {
	try {
		const updatedBorrowal = await Borrowal.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true } // This option returns the document after it has been updated
		);

		if (!updatedBorrowal) {
			return res.status(404).json({ success: false, message: 'Borrowal not found to update' });
		}

		return res.status(200).json({ success: true, updatedBorrowal });
	} catch (err) {
		return res.status(400).json({ success: false, err: err.message });
	}
};

// Refactored to handle nested asynchronous operations and check for existence
const deleteBorrowal = async (req, res) => {
	try {
		const borrowal = await Borrowal.findByIdAndDelete(req.params.id);

		if (!borrowal) {
			return res.status(404).json({ success: false, message: 'Borrowal not found to delete' });
		}

		await Book.findByIdAndUpdate(borrowal.bookId, { isAvailable: true });

		return res.status(200).json({ success: true, deletedBorrowal: borrowal });
	} catch (err) {
		return res.status(500).json({ success: false, err: err.message });
	}
};

module.exports = {
	getBorrowal,
	getAllBorrowals,
	addBorrowal,
	updateBorrowal,
	deleteBorrowal,
};
