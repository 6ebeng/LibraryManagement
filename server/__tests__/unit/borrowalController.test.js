/*
 * server/__tests__/unit/borrowalController.test.js
 *
 * This file contains unit tests for the borrowalController.
 * It tests the logic for creating, updating, and viewing borrowals
 * by mocking the Borrowal and Book models.
 */
const borrowalController = require('../../controllers/borrowalController');
const Borrowal = require('../../models/borrowal');
const Book = require('../../models/book');

jest.mock('../../models/borrowal');
jest.mock('../../models/book');

describe('Borrowal Controller - Unit Tests', () => {
	let req, res;

	beforeEach(() => {
		req = {
			body: {},
			params: {},
			user: { _id: 'member123', role: 'Member' }, // Mock authenticated user
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	describe('createBorrowal', () => {
		it('should create a borrowal if book is available', async () => {
			req.body.bookId = 'book123';
			const book = { _id: 'book123', isAvailable: true, save: jest.fn().mockResolvedValue(true) };
			Book.findById.mockResolvedValue(book);
			const borrowal = { member: 'member123', book: 'book123' };
			Borrowal.create.mockResolvedValue(borrowal);

			await borrowalController.createBorrowal(req, res);

			expect(Book.findById).toHaveBeenCalledWith('book123');
			expect(book.isAvailable).toBe(false);
			expect(book.save).toHaveBeenCalled();
			expect(Borrowal.create).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(borrowal);
		});

		it('should return 400 if book is not available', async () => {
			req.body.bookId = 'book123';
			const book = { _id: 'book123', isAvailable: false };
			Book.findById.mockResolvedValue(book);

			await borrowalController.createBorrowal(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'Book is not available' });
		});
	});

	describe('updateBorrowal', () => {
		it('should update a borrowal status to Returned and make book available', async () => {
			req.params.id = 'borrowal123';
			req.body.status = 'Returned';
			const borrowal = { _id: 'borrowal123', book: 'book123', status: 'Borrowed', save: jest.fn().mockResolvedValue(true) };
			Borrowal.findById.mockResolvedValue(borrowal);
			Book.findByIdAndUpdate.mockResolvedValue(true);

			await borrowalController.updateBorrowal(req, res);

			expect(borrowal.status).toBe('Returned');
			expect(borrowal.save).toHaveBeenCalled();
			expect(Book.findByIdAndUpdate).toHaveBeenCalledWith('book123', { isAvailable: true });
			expect(res.json).toHaveBeenCalledWith(borrowal);
		});
	});

	describe('getBorrowals', () => {
		it('should get all borrowals for a librarian', async () => {
			req.user.role = 'Librarian';
			const borrowals = [{ _id: '1' }, { _id: '2' }];
			Borrowal.find.mockReturnValue({
				populate: jest.fn().mockReturnThis(),
				exec: jest.fn().mockResolvedValue(borrowals),
			});

			await borrowalController.getBorrowals(req, res);

			expect(Borrowal.find).toHaveBeenCalledWith({});
			expect(res.json).toHaveBeenCalledWith(borrowals);
		});

		it('should get only own borrowals for a member', async () => {
			req.user.role = 'Member';
			const borrowals = [{ _id: '1', member: 'member123' }];
			Borrowal.find.mockReturnValue({
				populate: jest.fn().mockReturnThis(),
				exec: jest.fn().mockResolvedValue(borrowals),
			});

			await borrowalController.getBorrowals(req, res);

			expect(Borrowal.find).toHaveBeenCalledWith({ member: 'member123' });
			expect(res.json).toHaveBeenCalledWith(borrowals);
		});
	});
});
