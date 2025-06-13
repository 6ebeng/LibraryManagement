/*
 * server/__tests__/unit/reviewController.test.js
 *
 * This file contains unit tests for the reviewController.
 * It tests creating, viewing, and deleting reviews
 * by mocking the Review model.
 */
const reviewController = require('../../controllers/reviewController');
const Review = require('../../models/review');

jest.mock('../../models/review');

describe('Review Controller - Unit Tests', () => {
	let req, res;

	beforeEach(() => {
		req = {
			body: {},
			params: {},
			user: { _id: 'member123' }, // Mock authenticated user
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	// Corrected to test 'addReview'
	describe('addReview', () => {
		it('should create a review successfully', async () => {
			req.body = { bookId: 'book123', rating: 5, comment: 'Great book!' };
			const newReview = new Review(req.body);
			// Mock the save method
			newReview.save = jest.fn().mockResolvedValue(newReview);
			Review.prototype.save = newReview.save;

			await reviewController.addReview(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					comment: 'Great book!',
				})
			);
		});
	});

	// Corrected to test 'getAllReviews'
	describe('getAllReviews', () => {
		it('should get all reviews', async () => {
			const reviews = [{ rating: 5, comment: 'Great book!' }];
			Review.find = jest.fn((query, callback) => {
				callback(null, reviews);
			});

			await reviewController.getAllReviews(req, res);

			expect(Review.find).toHaveBeenCalledWith({}, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				reviewsList: reviews,
			});
		});
	});
});
