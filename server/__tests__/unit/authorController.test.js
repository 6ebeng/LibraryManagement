/*
 * server/__tests__/unit/authorController.test.js
 *
 * This file contains unit tests for the authorController.
 * It tests the CRUD operations for authors by mocking the Author model.
 */
const authorController = require('../../controllers/authorController');
const Author = require('../../models/author');

jest.mock('../../models/author');

// Mock errorMessages and getErrorMessage - though not directly used by this controller's error responses
jest.mock('../../utils/errorMessages', () => ({
	errorMessages: {},
	getErrorMessage: jest.fn((_category, _key, fallback) => fallback || `mockError`),
}));

describe('Author Controller - Unit Tests', () => {
	let req, res;

	beforeEach(() => {
		req = { body: {}, params: {} };
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		// Clear all mocks
		Author.findById.mockClear();
		Author.find.mockClear();
		Author.create.mockClear();
		Author.findByIdAndUpdate.mockClear();
		Author.findByIdAndDelete.mockClear();
	});

	// Test for addAuthor (controller's exported name)
	describe('addAuthor', () => {
		it('should create an author successfully and return 200', async () => {
			const newAuthorData = { name: 'J.K. Rowling', description: 'Author of Harry Potter' };
			req.body = newAuthorData;
			const createdAuthor = { _id: 'author123', ...newAuthorData };

			Author.create.mockImplementation((data, callback) => {
				callback(null, createdAuthor); // (error, result)
			});

			await authorController.addAuthor(req, res);

			expect(Author.create).toHaveBeenCalledWith(newAuthorData, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200); // Controller returns 200 for addAuthor
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				newAuthor: createdAuthor,
			});
		});

		it('should return 400 if author creation fails', async () => {
			req.body = { name: 'Stephen King' };
			const mockError = { message: 'Creation failed due to duplicate name' };
			Author.create.mockImplementation((data, callback) => {
				callback(mockError, null);
			});

			await authorController.addAuthor(req, res);

			expect(Author.create).toHaveBeenCalledWith(req.body, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ success: false, err: mockError });
		});
	});

	describe('getAllAuthors', () => {
		it('should return all authors with status 200', async () => {
			const authorsData = [{ name: 'Author 1' }, { name: 'Author 2' }];
			Author.find.mockImplementation((query, callback) => {
				callback(null, authorsData);
			});

			await authorController.getAllAuthors(req, res);

			expect(Author.find).toHaveBeenCalledWith({}, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				authorsList: authorsData,
			});
		});

		it('should return 400 if fetching all authors fails', async () => {
			const mockError = { message: 'Database connection error' };
			Author.find.mockImplementation((query, callback) => {
				callback(mockError, null);
			});

			await authorController.getAllAuthors(req, res);

			expect(Author.find).toHaveBeenCalledWith({}, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ success: false, err: mockError });
		});
	});

	describe('getAuthor', () => {
		it('should return a single author by ID with status 200', async () => {
			req.params.id = 'author123';
			const authorData = { _id: 'author123', name: 'George Orwell' };
			Author.findById.mockImplementation((id, callback) => {
				callback(null, authorData);
			});

			await authorController.getAuthor(req, res);

			expect(Author.findById).toHaveBeenCalledWith('author123', expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				author: authorData,
			});
		});

		it('should return 400 if fetching a single author fails', async () => {
			req.params.id = 'author123';
			const mockError = { message: 'Author not found or invalid ID' };
			Author.findById.mockImplementation((id, callback) => {
				callback(mockError, null);
			});

			await authorController.getAuthor(req, res);

			expect(Author.findById).toHaveBeenCalledWith('author123', expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ success: false, err: mockError });
		});
	});

	describe('updateAuthor', () => {
		it('should update an author and return 200 with the old document', async () => {
			req.params.id = 'authorToUpdate123';
			req.body = { name: 'Updated Name', description: 'Updated Description' };
			// Controller returns the document *before* update as {new: true} is not used
			const oldAuthorData = { _id: 'authorToUpdate123', name: 'Old Name', description: 'Old Description' };
			Author.findByIdAndUpdate.mockImplementation((id, data, callbackOrOptions, callbackIfOptions) => {
				const cb = typeof callbackOrOptions === 'function' ? callbackOrOptions : callbackIfOptions;
				cb(null, oldAuthorData);
			});

			await authorController.updateAuthor(req, res);

			expect(Author.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				updatedAuthor: oldAuthorData, // Expecting the old document
			});
		});

		it('should return 400 if updating author fails', async () => {
			req.params.id = 'authorToUpdate123';
			req.body = { name: 'Another Updated Name' };
			const mockError = { message: 'Update conflict or validation error' };
			Author.findByIdAndUpdate.mockImplementation((id, data, callbackOrOptions, callbackIfOptions) => {
				const cb = typeof callbackOrOptions === 'function' ? callbackOrOptions : callbackIfOptions;
				cb(mockError, null);
			});

			await authorController.updateAuthor(req, res);

			expect(Author.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ success: false, err: mockError });
		});
	});

	describe('deleteAuthor', () => {
		it('should delete an author and return 200', async () => {
			req.params.id = 'authorToDelete123';
			const deletedAuthorData = { _id: 'authorToDelete123', name: 'Deleted Author' };
			Author.findByIdAndDelete.mockImplementation((id, callback) => {
				callback(null, deletedAuthorData);
			});

			await authorController.deleteAuthor(req, res);

			expect(Author.findByIdAndDelete).toHaveBeenCalledWith(req.params.id, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				deletedAuthor: deletedAuthorData,
			});
		});

		it('should return 400 if deleting author fails', async () => {
			req.params.id = 'authorToDelete123';
			const mockError = { message: 'Deletion failed, author might be associated with books' };
			Author.findByIdAndDelete.mockImplementation((id, callback) => {
				callback(mockError, null);
			});

			await authorController.deleteAuthor(req, res);

			expect(Author.findByIdAndDelete).toHaveBeenCalledWith(req.params.id, expect.any(Function));
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ success: false, err: mockError });
		});
	});
});
