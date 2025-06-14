/*
 * server/__tests__/unit/genreController.test.js
 *
 * This file contains unit tests for the genreController.
 * It tests the CRUD operations for genres by mocking the Genre model.
 */
const genreController = require('../../controllers/genreController');
const Genre = require('../../models/genre');
const mongoose = require('mongoose'); // Not strictly needed for mocks unless using ObjectId specific features

jest.mock('../../models/genre');

// Mock errorMessages and getErrorMessage - though not directly used by this controller's error responses
jest.mock('../../utils/errorMessages', () => ({
	errorMessages: {},
	getErrorMessage: jest.fn((_category, _key, fallback) => fallback || `mockError`),
}));

describe('Genre Controller - Unit Tests', () => {
	let req, res;

	beforeEach(() => {
		req = { body: {}, params: {} };
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		// Clear all mocks
		Genre.findById.mockClear();
		Genre.find.mockClear();
		Genre.create.mockClear();
		Genre.findByIdAndUpdate.mockClear();
		Genre.findByIdAndDelete.mockClear();
	});

	// Test for addGenre (controller's exported name)
	describe('addGenre', () => {
		it('should create a genre successfully and return 200', async () => {
			const newGenreData = { name: 'New Sci-Fi' };
			req.body = newGenreData;
			const createdGenre = { _id: 'genre123', ...newGenreData };

			// Mock Genre.create to use the callback
			Genre.create.mockImplementation((data, callback) => {
				callback(null, createdGenre); // (error, result)
			});

			await genreController.addGenre(req, res);

			expect(Genre.create).toHaveBeenCalledWith(newGenreData, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200); // Controller returns 200 for addGenre
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				newGenre: createdGenre,
			});
		});

		it('should return 400 if genre creation fails', async () => {
			req.body = { name: 'New Fantasy' };
			const mockError = { message: 'Creation failed' };
			Genre.create.mockImplementation((data, callback) => {
				callback(mockError, null);
			});

			await genreController.addGenre(req, res);

			expect(Genre.create).toHaveBeenCalledWith(req.body, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ success: false, err: mockError });
		});
	});

	describe('getAllGenres', () => {
		it('should return all genres with status 200', async () => {
			const genresData = [{ name: 'Genre 1' }, { name: 'Genre 2' }];
			Genre.find.mockImplementation((query, callback) => {
				callback(null, genresData);
			});

			await genreController.getAllGenres(req, res);

			expect(Genre.find).toHaveBeenCalledWith({}, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				genresList: genresData,
			});
		});

		it('should return 400 if fetching all genres fails', async () => {
			const mockError = { message: 'Failed to fetch genres' };
			Genre.find.mockImplementation((query, callback) => {
				callback(mockError, null);
			});

			await genreController.getAllGenres(req, res);

			expect(Genre.find).toHaveBeenCalledWith({}, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ success: false, err: mockError });
		});
	});

	describe('getGenre', () => {
		it('should return a single genre by ID with status 200', async () => {
			req.params.id = 'genre123';
			const genreData = { _id: 'genre123', name: 'Adventure' };
			Genre.findById.mockImplementation((id, callback) => {
				callback(null, genreData);
			});

			await genreController.getGenre(req, res);

			expect(Genre.findById).toHaveBeenCalledWith('genre123', expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				genre: genreData,
			});
		});

		it('should return 400 if fetching a single genre fails', async () => {
			req.params.id = 'genre123';
			const mockError = { message: 'Failed to find genre' };
			Genre.findById.mockImplementation((id, callback) => {
				callback(mockError, null);
			});

			await genreController.getGenre(req, res);

			expect(Genre.findById).toHaveBeenCalledWith('genre123', expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ success: false, err: mockError });
		});
	});

	describe('updateGenre', () => {
		it('should update a genre and return 200 with the old document', async () => {
			req.params.id = 'genreToUpdate123';
			req.body = { name: 'Updated Mystery' };
			// Controller returns the document *before* update as {new: true} is not used
			const oldGenreData = { _id: 'genreToUpdate123', name: 'Old Mystery' };
			Genre.findByIdAndUpdate.mockImplementation((id, data, callbackOrOptions, callbackIfOptions) => {
				// The controller passes (id, data, callback)
				const cb = typeof callbackOrOptions === 'function' ? callbackOrOptions : callbackIfOptions;
				cb(null, oldGenreData);
			});

			await genreController.updateGenre(req, res);

			expect(Genre.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				updatedGenre: oldGenreData, // Expecting the old document as per controller
			});
		});

		it('should return 400 if updating genre fails', async () => {
			req.params.id = 'genreToUpdate123';
			req.body = { name: 'Updated Horror' };
			const mockError = { message: 'Update failed' };
			Genre.findByIdAndUpdate.mockImplementation((id, data, callbackOrOptions, callbackIfOptions) => {
				const cb = typeof callbackOrOptions === 'function' ? callbackOrOptions : callbackIfOptions;
				cb(mockError, null);
			});

			await genreController.updateGenre(req, res);

			expect(Genre.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ success: false, err: mockError });
		});
	});

	describe('deleteGenre', () => {
		it('should delete a genre and return 200', async () => {
			req.params.id = 'genreToDelete123';
			const deletedGenreData = { _id: 'genreToDelete123', name: 'Deleted Genre' };
			Genre.findByIdAndDelete.mockImplementation((id, callback) => {
				callback(null, deletedGenreData);
			});

			await genreController.deleteGenre(req, res);

			expect(Genre.findByIdAndDelete).toHaveBeenCalledWith(req.params.id, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				deletedGenre: deletedGenreData,
			});
		});

		it('should return 400 if deleting genre fails', async () => {
			req.params.id = 'genreToDelete123';
			const mockError = { message: 'Deletion failed' };
			Genre.findByIdAndDelete.mockImplementation((id, callback) => {
				callback(mockError, null);
			});

			await genreController.deleteGenre(req, res);

			expect(Genre.findByIdAndDelete).toHaveBeenCalledWith(req.params.id, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ success: false, err: mockError });
		});
	});
});
