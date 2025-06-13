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

	describe('createReview', () => {
		it('should create a review successfully', async () => {
			req.body = { bookId: 'book123', rating: 5, comment: 'Great book!' };
			const review = { ...req.body, member: 'member123' };
			Review.create.mockResolvedValue(review);

			await reviewController.createReview(req, res);

			expect(Review.create).toHaveBeenCalledWith({
				book: 'book123',
				member: 'member123',
				rating: 5,
				comment: 'Great book!',
			});
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(review);
		});
	});

	describe('getReviewsForBook', () => {
		it('should get all reviews for a specific book', async () => {
			req.params.bookId = 'book123';
			const reviews = [{ rating: 5, comment: 'Great book!' }];
			Review.find.mockReturnValue({
				populate: jest.fn().mockResolvedValue(reviews),
			});

			await reviewController.getReviewsForBook(req, res);

			expect(Review.find).toHaveBeenCalledWith({ book: 'book123' });
			expect(res.json).toHaveBeenCalledWith(reviews);
		});
	});
});
