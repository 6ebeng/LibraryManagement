/*
 * server/__tests__/unit/authorController.test.js
 *
 * This file contains unit tests for the authorController.
 * It tests the CRUD operations for authors by mocking the Author model.
 */
const authorController = require('../../controllers/authorController');
const Author = require('../../models/author');

jest.mock('../../models/author');

describe('Author Controller - Unit Tests', () => {
	let req, res;

	beforeEach(() => {
		req = { body: {}, params: {} };
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	describe('createAuthor', () => {
		it('should create an author successfully', async () => {
			const newAuthor = { name: 'New Author' };
			req.body = newAuthor;
			Author.create.mockResolvedValue(newAuthor);

			await authorController.createAuthor(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(newAuthor);
		});
	});

	describe('getAllAuthors', () => {
		it('should return all authors', async () => {
			const authors = [{ name: 'Author 1' }];
			Author.find.mockResolvedValue(authors);

			await authorController.getAllAuthors(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(authors);
		});
	});
});
