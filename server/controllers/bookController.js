const Book = require('../models/book');
const mongoose = require('mongoose');
const { errorMessages } = require('../utils/errorMessages');

const getBook = async (req, res) => {
	const { id: bookId } = req.params;

	// Validate book ID format
	if (!mongoose.Types.ObjectId.isValid(bookId)) {
		return res.status(400).json({
			success: false,
			message: errorMessages.book.invalidData,
		});
	}

	try {
		const book = await Book.findById(bookId);

		if (!book) {
			return res.status(404).json({
				success: false,
				message: errorMessages.book.notFound,
			});
		}

		return res.status(200).json({
			success: true,
			book,
		});
	} catch (err) {
		console.error('Database error fetching book:', err);
		return res.status(500).json({
			success: false,
			message: errorMessages.general.databaseError,
		});
	}
};

const getAllBooks = async (req, res) => {
	try {
		const books = await Book.aggregate([
			{
				$lookup: {
					from: 'authors',
					localField: 'authorId',
					foreignField: '_id',
					as: 'author',
				},
			},
			{
				$unwind: '$author',
			},
			{
				$lookup: {
					from: 'genres',
					localField: 'genreId',
					foreignField: '_id',
					as: 'genre',
				},
			},
			{
				$unwind: '$genre',
			},
		]);

		return res.status(200).json({
			success: true,
			booksList: books,
		});
	} catch (err) {
		console.error('Database error fetching books:', err);
		return res.status(500).json({
			success: false,
			message: errorMessages.general.databaseError,
		});
	}
};

const addBook = async (req, res) => {
	const { name, authorId, genreId, isbn } = req.body;

	// --- Basic Validation ---
	if (!name) return res.status(400).json({ success: false, message: errorMessages.book.titleRequired });
	if (!authorId) return res.status(400).json({ success: false, message: errorMessages.book.authorRequired });
	if (!genreId) return res.status(400).json({ success: false, message: errorMessages.book.genreRequired });
	if (!isbn) return res.status(400).json({ success: false, message: errorMessages.book.isbnRequired });

	// --- ObjectId Validation ---
	if (!mongoose.Types.ObjectId.isValid(authorId) || !mongoose.Types.ObjectId.isValid(genreId)) {
		return res.status(400).json({
			success: false,
			message: errorMessages.book.invalidData,
		});
	}

	try {
		// Check for duplicate ISBN
		const existingBook = await Book.findOne({ isbn });
		if (existingBook) {
			return res.status(400).json({
				success: false,
				message: errorMessages.book.duplicateISBN,
			});
		}

		// Create and save the new book
		const newBookData = {
			...req.body,
			authorId: mongoose.Types.ObjectId(authorId),
			genreId: mongoose.Types.ObjectId(genreId),
		};

		const book = await Book.create(newBookData);

		return res.status(201).json({
			// 201 Created is more appropriate
			success: true,
			newBook: book,
			message: `Book "${book.name}" has been successfully added to the library`, // Use book.name
		});
	} catch (err) {
		console.error('Error creating book:', err);
		return res.status(500).json({
			// Use 500 for server/database errors
			success: false,
			message: errorMessages.book.createFailed,
		});
	}
};

const updateBook = async (req, res) => {
	const { id: bookId } = req.params;
	const updatedBookData = req.body;

	// Validate book ID format
	if (!mongoose.Types.ObjectId.isValid(bookId)) {
		return res.status(400).json({ success: false, message: errorMessages.book.invalidData });
	}

	// If updating author or genre, validate their IDs
	if (updatedBookData.authorId && !mongoose.Types.ObjectId.isValid(updatedBookData.authorId)) {
		return res.status(400).json({ success: false, message: errorMessages.book.invalidData });
	}
	if (updatedBookData.genreId && !mongoose.Types.ObjectId.isValid(updatedBookData.genreId)) {
		return res.status(400).json({ success: false, message: errorMessages.book.invalidData });
	}

	try {
		const book = await Book.findByIdAndUpdate(bookId, updatedBookData, { new: true });

		if (!book) {
			return res.status(404).json({
				success: false,
				message: errorMessages.book.notFound,
			});
		}

		return res.status(200).json({
			success: true,
			updatedBook: book,
			message: 'Book information has been successfully updated',
		});
	} catch (err) {
		console.error('Error updating book:', err);
		return res.status(500).json({
			success: false,
			message: errorMessages.book.updateFailed,
		});
	}
};

const deleteBook = async (req, res) => {
	const { id: bookId } = req.params;

	// Validate book ID format
	if (!mongoose.Types.ObjectId.isValid(bookId)) {
		return res.status(400).json({ success: false, message: errorMessages.book.invalidData });
	}

	// TODO: Check if book has active borrowals before deleting

	try {
		const book = await Book.findByIdAndDelete(bookId);

		if (!book) {
			return res.status(404).json({
				success: false,
				message: errorMessages.book.notFound,
			});
		}

		return res.status(200).json({
			success: true,
			deletedBook: book,
			message: `Book "${book.name}" has been successfully removed from the library`, // Use book.name
		});
	} catch (err) {
		console.error('Error deleting book:', err);
		return res.status(500).json({
			success: false,
			message: errorMessages.book.deleteFailed,
		});
	}
};

module.exports = {
	getBook,
	getAllBooks,
	addBook,
	updateBook,
	deleteBook,
};
