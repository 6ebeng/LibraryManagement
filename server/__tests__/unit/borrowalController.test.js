/*
 * server/__tests__/unit/borrowalController.test.js
 */
const borrowalController = require('../../controllers/borrowalController');
const Borrowal = require('../../models/borrowal');
const Book = require('../../models/book');
const mongoose = require('mongoose'); // This will be the mocked mongoose

// --- Mocking Mongoose ---
const actualMongoose = jest.requireActual('mongoose'); // For creating real ObjectId instances in test data

jest.mock('mongoose', () => {
	const originalMongoose = jest.requireActual('mongoose');
	// Define the spy function here, so it's created when the mock factory runs.
	const internalObjectIdSpy = jest.fn((id) => {
		// Handle null/undefined IDs to prevent errors if the controller passes them
		if (id === null || typeof id === 'undefined') {
			// Option 1: Throw an error similar to what Mongoose might do
			// throw new originalMongoose.Error.CastError('ObjectId', id, 'path');
			// Option 2: Return null or a specific marker, depending on how you want to test this case
			return null;
		}
		return new originalMongoose.Types.ObjectId(id);
	});

	return {
		...originalMongoose,
		Schema: originalMongoose.Schema,
		model: originalMongoose.model,
		Types: {
			...originalMongoose.Types,
			ObjectId: internalObjectIdSpy, // What the code under test uses
			_ObjectIdSpy: internalObjectIdSpy, // What our tests use to assert/clear
		},
		// Ensure other static methods are present if used directly (e.g., mongoose.connect)
		connect: originalMongoose.connect,
		connection: originalMongoose.connection,
		// Add any other static properties/methods of mongoose that your code might use directly
	};
});

jest.mock('../../models/borrowal');
jest.mock('../../models/book');

jest.mock('../../utils/errorMessages', () => ({
	errorMessages: {},
	getErrorMessage: jest.fn((_category, _key, fallback) => fallback || `mockError`),
}));

describe('Borrowal Controller - Unit Tests', () => {
	let req, res;

	beforeEach(() => {
		req = {
			body: {},
			params: {},
			user: { _id: 'memberUser123', role: 'Member', isAdmin: false },
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		// Clear mocks
		Book.findById.mockClear();
		Book.findOneAndUpdate.mockClear();
		Book.findByIdAndUpdate.mockClear();
		Borrowal.create.mockClear();
		Borrowal.findById.mockClear();
		Borrowal.findByIdAndUpdate.mockClear();
		Borrowal.findByIdAndDelete.mockClear();
		Borrowal.aggregate.mockClear();
		// Clear the spy via the mocked mongoose module
		if (mongoose.Types._ObjectIdSpy) {
			mongoose.Types._ObjectIdSpy.mockClear();
		}
		if (require('../../utils/errorMessages').getErrorMessage.mockClear) {
			require('../../utils/errorMessages').getErrorMessage.mockClear();
		}
	});

	describe('addBorrowal', () => {
		it('should create a borrowal if book is available, and return 201', async () => {
			req.body = { bookId: 'validBookId123', memberId: 'validMemberId123' };

			const mockClaimedBookResult = { _id: req.body.bookId, name: 'Test Book', isAvailable: true };
			const mockCreatedBorrowalResult = {
				_id: 'borrowalNew123',
				bookId: new actualMongoose.Types.ObjectId(req.body.bookId),
				memberId: new actualMongoose.Types.ObjectId(req.body.memberId),
				status: 'Borrowed',
			};

			Book.findOneAndUpdate.mockResolvedValue(mockClaimedBookResult);
			Borrowal.create.mockResolvedValue(mockCreatedBorrowalResult);

			await borrowalController.addBorrowal(req, res);

			expect(mongoose.Types._ObjectIdSpy).toHaveBeenCalledWith(req.body.bookId);
			expect(mongoose.Types._ObjectIdSpy).toHaveBeenCalledWith(req.body.memberId);

			const expectedBookObjectId = new actualMongoose.Types.ObjectId(req.body.bookId);
			const expectedMemberObjectId = new actualMongoose.Types.ObjectId(req.body.memberId);

			expect(Book.findOneAndUpdate).toHaveBeenCalledWith({ _id: expectedBookObjectId, isAvailable: true }, { $set: { isAvailable: false } });
			expect(Borrowal.create).toHaveBeenCalledWith({
				bookId: expectedBookObjectId,
				memberId: expectedMemberObjectId,
				status: 'Borrowed',
			});
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				newBorrowal: mockCreatedBorrowalResult,
			});
		});

		it('should return 400 if book is not available (Book.findOneAndUpdate returns null)', async () => {
			req.body = { bookId: 'unavailableBookId123', memberId: 'validMemberId123' };
			Book.findOneAndUpdate.mockResolvedValue(null);

			await borrowalController.addBorrowal(req, res);

			expect(mongoose.Types._ObjectIdSpy).toHaveBeenCalledWith(req.body.bookId);
			expect(mongoose.Types._ObjectIdSpy).toHaveBeenCalledWith(req.body.memberId);

			expect(Book.findOneAndUpdate).toHaveBeenCalledWith({ _id: new actualMongoose.Types.ObjectId(req.body.bookId), isAvailable: true }, { $set: { isAvailable: false } });
			expect(Borrowal.create).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'This book is currently not available for borrowing',
			});
		});

		it('should return 400 if Borrowal.create fails with ValidationError', async () => {
			req.body = { bookId: 'validBookId123', memberId: 'validMemberId123' };
			const mockClaimedBookResult = { _id: req.body.bookId, name: 'Test Book', isAvailable: true };
			Book.findOneAndUpdate.mockResolvedValue(mockClaimedBookResult);

			const validationError = new Error('Validation failed');
			validationError.name = 'ValidationError';
			Borrowal.create.mockRejectedValue(validationError);

			await borrowalController.addBorrowal(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'Validation error creating borrowal.',
				error: validationError.message,
			});
		});

		it('should return 500 if Book.findOneAndUpdate fails', async () => {
			req.body = { bookId: 'validBookId123', memberId: 'validMemberId123' };
			const errorMessage = 'DB error during findOneAndUpdate';
			Book.findOneAndUpdate.mockRejectedValue(new Error(errorMessage));

			await borrowalController.addBorrowal(req, res);

			expect(Borrowal.create).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'An unexpected error occurred while creating the borrowal.',
				error: errorMessage,
			});
		});

		it('should return 500 if Borrowal.create fails with a generic error', async () => {
			req.body = { bookId: 'validBookId123', memberId: 'validMemberId123' };
			const mockClaimedBookResult = { _id: req.body.bookId, name: 'Test Book', isAvailable: true };
			Book.findOneAndUpdate.mockResolvedValue(mockClaimedBookResult);

			const errorMessage = 'Generic create failed';
			Borrowal.create.mockRejectedValue(new Error(errorMessage));

			await borrowalController.addBorrowal(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'An unexpected error occurred while creating the borrowal.',
				error: errorMessage,
			});
		});
	});

	describe('updateBorrowal', () => {
		it('should update a borrowal and return 200', async () => {
			req.params.id = 'borrowal123';
			req.body = { status: 'Pending', notes: 'User extended' };
			const mockUpdatedBorrowal = { _id: req.params.id, ...req.body };

			Borrowal.findByIdAndUpdate.mockResolvedValue(mockUpdatedBorrowal);

			await borrowalController.updateBorrowal(req, res);

			expect(Borrowal.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, { new: true, runValidators: true });
			expect(Book.findByIdAndUpdate).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				updatedBorrowal: mockUpdatedBorrowal,
			});
		});

		it('should update a borrowal to "Returned", update book availability, and return 200', async () => {
			req.params.id = 'borrowal123';
			req.body = { status: 'Returned' };
			const mockUpdatedBorrowal = { _id: req.params.id, bookId: 'bookToReturn123', ...req.body };

			Borrowal.findByIdAndUpdate.mockResolvedValue(mockUpdatedBorrowal);
			Book.findByIdAndUpdate.mockResolvedValue({});

			await borrowalController.updateBorrowal(req, res);

			expect(Borrowal.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, { new: true, runValidators: true });
			expect(Book.findByIdAndUpdate).toHaveBeenCalledWith(mockUpdatedBorrowal.bookId, { isAvailable: true });
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				updatedBorrowal: mockUpdatedBorrowal,
			});
		});

		it('should return 404 if borrowal not found for update', async () => {
			req.params.id = 'nonExistentBorrowal123';
			req.body = { status: 'Returned' };
			Borrowal.findByIdAndUpdate.mockResolvedValue(null);

			await borrowalController.updateBorrowal(req, res);

			expect(Borrowal.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, { new: true, runValidators: true });
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'Borrowal not found to update',
			});
		});

		it('should return 400 if Borrowal.findByIdAndUpdate fails with ValidationError', async () => {
			req.params.id = 'borrowal123';
			req.body = { status: 'Returned' };
			const validationError = new Error('Validation failed');
			validationError.name = 'ValidationError';
			Borrowal.findByIdAndUpdate.mockRejectedValue(validationError);

			await borrowalController.updateBorrowal(req, res);

			expect(Borrowal.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, { new: true, runValidators: true });
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'Validation error updating borrowal.',
				error: validationError.message,
			});
		});

		it('should return 500 if Borrowal.findByIdAndUpdate fails with generic error', async () => {
			req.params.id = 'borrowal123';
			req.body = { status: 'Returned' };
			const errorMessage = 'Update failed due to DB error';
			Borrowal.findByIdAndUpdate.mockRejectedValue(new Error(errorMessage));

			await borrowalController.updateBorrowal(req, res);

			expect(Borrowal.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, { new: true, runValidators: true });
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'An unexpected error occurred while updating the borrowal.',
				error: errorMessage,
			});
		});
	});

	describe('getAllBorrowals', () => {
		it('should get all borrowals with aggregated data and return 200', async () => {
			const mockAggregatedBorrowals = [{ _id: 'borrowal1', member: { name: 'User A' }, book: { title: 'Book X' } }];
			Borrowal.aggregate.mockResolvedValue(mockAggregatedBorrowals);

			await borrowalController.getAllBorrowals(req, res);

			expect(Borrowal.aggregate).toHaveBeenCalledWith([
				{ $lookup: { from: 'users', localField: 'memberId', foreignField: '_id', as: 'member' } },
				{ $unwind: '$member' },
				{ $lookup: { from: 'books', localField: 'bookId', foreignField: '_id', as: 'book' } },
				{ $unwind: '$book' },
			]);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				borrowalsList: mockAggregatedBorrowals,
			});
		});

		it('should return 500 if Borrowal.aggregate fails', async () => {
			const errorMessage = 'Aggregation failed';
			Borrowal.aggregate.mockRejectedValue(new Error(errorMessage));

			await borrowalController.getAllBorrowals(req, res);

			expect(Borrowal.aggregate).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'An unexpected error occurred while retrieving borrowals.',
				error: errorMessage,
			});
		});
	});

	describe('getBorrowal', () => {
		it('should get a single borrowal by ID and return 200', async () => {
			req.params.id = 'borrowalDetail123';
			const mockBorrowal = { _id: req.params.id, memberId: 'member1', bookId: 'book1', status: 'Borrowed' };
			Borrowal.findById.mockResolvedValue(mockBorrowal);

			await borrowalController.getBorrowal(req, res);

			expect(Borrowal.findById).toHaveBeenCalledWith(req.params.id);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ success: true, borrowal: mockBorrowal });
		});

		it('should return 404 if borrowal not found by ID', async () => {
			req.params.id = 'nonExistentBorrowalDetail123';
			Borrowal.findById.mockResolvedValue(null);

			await borrowalController.getBorrowal(req, res);

			expect(Borrowal.findById).toHaveBeenCalledWith(req.params.id);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Borrowal not found' });
		});

		it('should return 500 if Borrowal.findById fails for getBorrowal', async () => {
			req.params.id = 'borrowalDetail123';
			const errorMessage = 'Find by ID failed';
			Borrowal.findById.mockRejectedValue(new Error(errorMessage));

			await borrowalController.getBorrowal(req, res);

			expect(Borrowal.findById).toHaveBeenCalledWith(req.params.id);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'An unexpected error occurred while retrieving the borrowal.',
				error: errorMessage,
			});
		});
	});

	describe('deleteBorrowal', () => {
		it('should delete a borrowal, update book availability, and return 200', async () => {
			req.params.id = 'borrowalToDelete123';
			const mockDeletedBorrowal = { _id: req.params.id, bookId: 'bookToMakeAvailable123', status: 'Returned' };
			Borrowal.findByIdAndDelete.mockResolvedValue(mockDeletedBorrowal);
			Book.findByIdAndUpdate.mockResolvedValue({ _id: mockDeletedBorrowal.bookId, isAvailable: true });

			await borrowalController.deleteBorrowal(req, res);

			expect(Borrowal.findByIdAndDelete).toHaveBeenCalledWith(req.params.id);
			expect(Book.findByIdAndUpdate).toHaveBeenCalledWith(mockDeletedBorrowal.bookId, { isAvailable: true });
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ success: true, deletedBorrowal: mockDeletedBorrowal });
		});

		it('should return 404 if borrowal not found to delete', async () => {
			req.params.id = 'nonExistentBorrowalToDelete123';
			Borrowal.findByIdAndDelete.mockResolvedValue(null);

			await borrowalController.deleteBorrowal(req, res);

			expect(Borrowal.findByIdAndDelete).toHaveBeenCalledWith(req.params.id);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Borrowal not found to delete' });
		});

		it('should return 500 if Borrowal.findByIdAndDelete fails', async () => {
			req.params.id = 'borrowalToDelete123';
			const errorMessage = 'Delete failed';
			Borrowal.findByIdAndDelete.mockRejectedValue(new Error(errorMessage));

			await borrowalController.deleteBorrowal(req, res);

			expect(Borrowal.findByIdAndDelete).toHaveBeenCalledWith(req.params.id);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'An unexpected error occurred while deleting the borrowal.',
				error: errorMessage,
			});
		});

		it('should return 500 if Book.findByIdAndUpdate fails after borrowal deletion', async () => {
			req.params.id = 'borrowalToDelete123';
			const mockDeletedBorrowal = { _id: req.params.id, bookId: 'bookToFailUpdate123' };
			Borrowal.findByIdAndDelete.mockResolvedValue(mockDeletedBorrowal);

			const errorMessage = 'Book update failed post-delete';
			Book.findByIdAndUpdate.mockRejectedValue(new Error(errorMessage));

			await borrowalController.deleteBorrowal(req, res);

			expect(Borrowal.findByIdAndDelete).toHaveBeenCalledWith(req.params.id);
			expect(Book.findByIdAndUpdate).toHaveBeenCalledWith(mockDeletedBorrowal.bookId, { isAvailable: true });
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'An unexpected error occurred while deleting the borrowal.',
				error: errorMessage,
			});
		});
	});
});
