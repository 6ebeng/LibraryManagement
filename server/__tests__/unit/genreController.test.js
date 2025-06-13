/*
 * server/__tests__/unit/genreController.test.js
 *
 * This file contains unit tests for the genreController.
 * It tests the CRUD operations for genres by mocking the Genre model.
 */
const genreController = require('../../controllers/genreController');
const Genre = require('../../models/genre');

jest.mock('../../models/genre');

describe('Genre Controller - Unit Tests', () => {
	let req, res;

	beforeEach(() => {
		req = { body: {}, params: {} };
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	describe('createGenre', () => {
		it('should create a genre successfully', async () => {
			const newGenre = { name: 'New Genre' };
			req.body = newGenre;
			Genre.create.mockResolvedValue(newGenre);

			await genreController.createGenre(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(newGenre);
		});
	});

	describe('getAllGenres', () => {
		it('should return all genres', async () => {
			const genres = [{ name: 'Genre 1' }];
			Genre.find.mockResolvedValue(genres);

			await genreController.getAllGenres(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(genres);
		});
	});
});
