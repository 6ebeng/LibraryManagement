/*
 * server/__tests__/unit/bookController.test.js
 *
 * This file contains unit tests for the bookController.
 * It tests the CRUD operations for books by mocking the Book model.
 */
const mongoose = require('mongoose'); // Import mongoose for ObjectId
const bookController = require('../../controllers/bookController');
const Book = require('../../models/book');

jest.mock('../../models/book');

// A valid MongoDB ObjectId string for testing
const validObjectId = '60d5ec49a4d8f512c8b76384';
const anotherValidObjectId = '60d5ec49a4d8f512c8b76385';

describe('Book Controller - Unit Tests', () => {
	let req, res;

	beforeEach(() => {
		req = { body: {}, params: {}, query: {} };
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			send: jest.fn(),
		};
		// Clear all mocks before each test
		jest.clearAllMocks();
	});

	describe('addBook', () => {
		it('should create a book and return 201', async () => {
			const bookPayload = {
				name: 'New Book',
				isbn: '12345',
				authorId: validObjectId,
				genreId: anotherValidObjectId,
			};
			req.body = bookPayload;

			const createdBook = {
				_id: 'mongoGeneratedId123',
				...bookPayload,
			};
			Book.create.mockResolvedValue(createdBook);

			await bookController.addBook(req, res);

			expect(Book.create).toHaveBeenCalledWith(
				expect.objectContaining({
					name: bookPayload.name,
					isbn: bookPayload.isbn,
					authorId: mongoose.Types.ObjectId(bookPayload.authorId),
					genreId: mongoose.Types.ObjectId(bookPayload.genreId),
				})
			);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				newBook: createdBook,
				message: `Book "${createdBook.name}" has been successfully added to the library`,
			});
		});

		it('should return 500 if creation fails', async () => {
			req.body = { name: 'Test Book', authorId: validObjectId, genreId: anotherValidObjectId, isbn: '123' };
			Book.create.mockRejectedValue(new Error('DB error'));

			await bookController.addBook(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			// Assuming errorMessages.book.createFailed is 'Failed to add book' or similar
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: expect.any(String), // Or the exact error message string if known
			});
		});
	});

	describe('getAllBooks', () => {
		it('should return all books and status 200', async () => {
			const books = [{ name: 'Book 1' }, { name: 'Book 2' }];
			Book.aggregate.mockResolvedValue(books); // Changed from find to aggregate

			await bookController.getAllBooks(req, res);

			expect(Book.aggregate).toHaveBeenCalledWith(expect.any(Array)); // Check if aggregate is called with pipeline
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				booksList: books,
			});
		});
	});

	describe('getBook', () => {
		it('should return a single book if found and status 200', async () => {
			const book = { _id: validObjectId, name: 'Found Book' };
			req.params.id = validObjectId;
			Book.findById.mockResolvedValue(book); // Simplified mock

			await bookController.getBook(req, res);

			expect(Book.findById).toHaveBeenCalledWith(validObjectId);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				book,
			});
		});

		it('should return 404 if book not found', async () => {
			req.params.id = validObjectId;
			Book.findById.mockResolvedValue(null); // Simulate not found

			await bookController.getBook(req, res);

			expect(Book.findById).toHaveBeenCalledWith(validObjectId);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: expect.any(String), // Or specific 'Book not found' message
			});
		});

		it('should return 400 if book ID is invalid', async () => {
			req.params.id = 'invalid-id';

			await bookController.getBook(req, res);

			expect(Book.findById).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: expect.any(String), // Or specific 'Invalid data' message
			});
		});
	});

	describe('updateBook', () => {
		it('should update a book and return it with status 200', async () => {
			const updatedBookData = { name: 'Updated Book' };
			const returnedBook = { _id: validObjectId, ...updatedBookData };
			req.params.id = validObjectId;
			req.body = updatedBookData;
			Book.findByIdAndUpdate.mockResolvedValue(returnedBook);

			await bookController.updateBook(req, res);

			expect(Book.findByIdAndUpdate).toHaveBeenCalledWith(validObjectId, updatedBookData, { new: true });
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				updatedBook: returnedBook,
				message: 'Book information has been successfully updated',
			});
		});

		it('should return 404 if book to update is not found', async () => {
			req.params.id = validObjectId;
			req.body = { name: 'Updated Book' };
			Book.findByIdAndUpdate.mockResolvedValue(null);

			await bookController.updateBook(req, res);

			expect(Book.findByIdAndUpdate).toHaveBeenCalledWith(validObjectId, req.body, { new: true });
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: expect.any(String), // Or specific 'Book not found' message
			});
		});

		it('should return 400 if book ID for update is invalid', async () => {
			req.params.id = 'invalid-id';
			req.body = { name: 'Updated Book' };

			await bookController.updateBook(req, res);
			expect(Book.findByIdAndUpdate).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: expect.any(String), // Or specific 'Invalid data' message
			});
		});
	});

	describe('deleteBook', () => {
		it('should delete a book and return 200 with a message', async () => {
			req.params.id = validObjectId;
			const deletedBookMock = { _id: validObjectId, name: 'Deleted Book' };
			Book.findByIdAndDelete.mockResolvedValue(deletedBookMock);

			await bookController.deleteBook(req, res);

			expect(Book.findByIdAndDelete).toHaveBeenCalledWith(validObjectId);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				deletedBook: deletedBookMock,
				message: `Book "${deletedBookMock.name}" has been successfully removed from the library`,
			});
		});

		it('should return 404 if book to delete is not found', async () => {
			req.params.id = validObjectId;
			Book.findByIdAndDelete.mockResolvedValue(null);

			await bookController.deleteBook(req, res);

			expect(Book.findByIdAndDelete).toHaveBeenCalledWith(validObjectId);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: expect.any(String), // Or specific 'Book not found' message
			});
		});

		it('should return 400 if book ID for delete is invalid', async () => {
			req.params.id = 'invalid-id';

			await bookController.deleteBook(req, res);
			expect(Book.findByIdAndDelete).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: expect.any(String), // Or specific 'Invalid data' message
			});
		});
	});
});
