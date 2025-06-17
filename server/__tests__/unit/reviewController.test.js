/*
 * server/__tests__/unit/reviewController.test.js
 *
 * This file contains unit tests for the reviewController.
 * It tests creating, viewing, and deleting reviews
 * by mocking the Review model.
 */
const reviewController = require('../../controllers/reviewController');
const Review = require('../../models/review');
const mongoose = require('mongoose'); // Required for mocking ObjectId.isValid

// Mock models and utilities
jest.mock('../../models/review');
jest.mock('../../utils/errorMessages', () => ({
	errorMessages: {
		// Provide minimal structure for direct access if any
		auth: { unauthorized: 'Unauthorized mock' },
		book: { invalidData: 'Invalid book data mock' },
		general: { databaseError: 'Database error mock' },
	},
	// Mock getErrorMessage to return a predictable string or the fallback
	getErrorMessage: jest.fn((category, key, fallback) => fallback || `mockError:${category}.${key}`),
}));

// Mock mongoose.Types.ObjectId.isValid
jest.mock('mongoose', () => {
	const originalMongoose = jest.requireActual('mongoose');
	return {
		...originalMongoose,
		Types: {
			...originalMongoose.Types,
			ObjectId: {
				...originalMongoose.Types.ObjectId,
				isValid: jest.fn(),
			},
		},
	};
});

describe('Review Controller - Unit Tests', () => {
	let req, res;

	beforeEach(() => {
		req = {
			body: {},
			params: {},
			// req.user is not directly used by addReview for memberId,
			// but good to have if other controller methods might use it.
			user: { _id: 'userMember123' },
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			send: jest.fn(), // Add if any controller uses res.send
		};
		// Reset mocks before each test
		Review.create.mockClear();
		Review.find.mockClear();
		mongoose.Types.ObjectId.isValid.mockClear();
		require('../../utils/errorMessages').getErrorMessage.mockClear();
	});

	describe('addReview', () => {
		it('should create a review successfully and return 201', async () => {
			req.body = {
				bookId: 'book123',
				rating: 5,
				comment: 'Great book!',
				memberId: 'member123', // memberId must be in body
			};
			const mockCreatedReview = { ...req.body, _id: 'review123', createdAt: new Date().toISOString() };
			Review.create.mockResolvedValue(mockCreatedReview);
			// Assume bookId is valid for this success path
			mongoose.Types.ObjectId.isValid.mockReturnValue(true);

			await reviewController.addReview(req, res);

			expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('book123');
			expect(Review.create).toHaveBeenCalledWith({
				bookId: 'book123',
				rating: 5,
				comment: 'Great book!',
				memberId: 'member123',
			});
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				review: mockCreatedReview,
				message: 'Your review has been successfully submitted.',
			});
		});

		it('should return 400 if rating is invalid', async () => {
			req.body = { bookId: 'book123', rating: 0, comment: 'Bad rating', memberId: 'member123' };
			mongoose.Types.ObjectId.isValid.mockReturnValue(true);
			const { getErrorMessage } = require('../../utils/errorMessages');

			await reviewController.addReview(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: getErrorMessage('review', 'invalidRating', 'Rating must be a number between 1 and 5.'),
			});
			expect(getErrorMessage).toHaveBeenCalledWith('review', 'invalidRating', 'Rating must be a number between 1 and 5.');
		});

		it('should return 400 if bookId is invalid', async () => {
			req.body = { bookId: 'invalidBookId', rating: 5, comment: 'Great book', memberId: 'member123' };
			mongoose.Types.ObjectId.isValid.mockReturnValue(false); // Simulate invalid ObjectId
			const { errorMessages } = require('../../utils/errorMessages');

			await reviewController.addReview(req, res);

			expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalidBookId');
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: errorMessages.book.invalidData,
			});
		});

		it('should return 401 if memberId is missing', async () => {
			req.body = { bookId: 'book123', rating: 5, comment: 'Great book' }; // No memberId
			mongoose.Types.ObjectId.isValid.mockReturnValue(true);
			const { errorMessages } = require('../../utils/errorMessages');

			await reviewController.addReview(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: errorMessages.auth.unauthorized,
			});
		});
	});

	describe('getAllReviews', () => {
		it('should get all reviews for a specific book and return 200', async () => {
			req.params = { bookId: 'book123' };
			const mockReviews = [
				{ _id: 'review1', bookId: 'book123', rating: 5, comment: 'Great book!', memberId: { _id: 'member1', name: 'Test User 1' } },
				{ _id: 'review2', bookId: 'book123', rating: 4, comment: 'Good read', memberId: { _id: 'member2', name: 'Test User 2' } },
			];

			// Mock the chainable populate method
			const mockPopulate = jest.fn().mockResolvedValue(mockReviews);
			Review.find.mockReturnValue({
				populate: mockPopulate,
			});
			mongoose.Types.ObjectId.isValid.mockReturnValue(true);

			await reviewController.getAllReviews(req, res);

			expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('book123');
			expect(Review.find).toHaveBeenCalledWith({ bookId: 'book123' });
			expect(mockPopulate).toHaveBeenCalledWith('memberId', 'name');
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				reviewsList: mockReviews, // Controller uses reviewsList
			});
		});

		it('should return 400 if bookId is invalid for getAllReviews', async () => {
			req.params = { bookId: 'invalidBookId' };
			mongoose.Types.ObjectId.isValid.mockReturnValue(false);
			const { errorMessages } = require('../../utils/errorMessages');

			await reviewController.getAllReviews(req, res);

			expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalidBookId');
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: errorMessages.book.invalidData,
			});
		});
	});
});
