/*
 * server/__tests__/unit/bookController.test.js
 *
 * This file contains unit tests for the bookController.
 * It tests the CRUD operations for books by mocking the Book model.
 */
const bookController = require('../../controllers/bookController');
const Book = require('../../models/book');

jest.mock('../../models/book');

describe('Book Controller - Unit Tests', () => {
	let req, res;

	beforeEach(() => {
		req = { body: {}, params: {}, query: {} };
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			send: jest.fn(),
		};
	});

	describe('createBook', () => {
		it('should create a book and return 201', async () => {
			const newBook = { name: 'New Book', isbn: '12345', author: '1', genre: '1' };
			req.body = newBook;
			Book.create.mockResolvedValue(newBook);

			await bookController.createBook(req, res);

			expect(Book.create).toHaveBeenCalledWith(newBook);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(newBook);
		});

		it('should return 500 if creation fails', async () => {
			Book.create.mockRejectedValue(new Error('DB error'));

			await bookController.createBook(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
		});
	});

	describe('getAllBooks', () => {
		it('should return all books and status 200', async () => {
			const books = [{ name: 'Book 1' }, { name: 'Book 2' }];
			Book.find.mockReturnValue({
				populate: jest.fn().mockResolvedValue(books),
			});

			await bookController.getAllBooks(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(books);
		});
	});

	describe('getBookById', () => {
		it('should return a single book if found', async () => {
			const book = { name: 'Found Book' };
			req.params.id = '1';
			Book.findById.mockReturnValue({
				populate: jest.fn().mockResolvedValue(book),
			});

			await bookController.getBookById(req, res);

			expect(res.json).toHaveBeenCalledWith(book);
		});

		it('should return 404 if book not found', async () => {
			req.params.id = '1';
			Book.findById.mockReturnValue({
				populate: jest.fn().mockResolvedValue(null),
			});

			await bookController.getBookById(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ message: 'Book not found' });
		});
	});

	describe('updateBook', () => {
		it('should update a book and return it', async () => {
			const updatedBook = { name: 'Updated Book' };
			req.params.id = '1';
			req.body = updatedBook;
			Book.findByIdAndUpdate.mockResolvedValue(updatedBook);

			await bookController.updateBook(req, res);

			expect(res.json).toHaveBeenCalledWith(updatedBook);
		});
	});

	describe('deleteBook', () => {
		it('should delete a book and return 200', async () => {
			req.params.id = '1';
			Book.findByIdAndDelete.mockResolvedValue({}); // Simulate successful deletion

			await bookController.deleteBook(req, res);

			expect(res.json).toHaveBeenCalledWith({ message: 'Book removed' });
		});
	});
});
