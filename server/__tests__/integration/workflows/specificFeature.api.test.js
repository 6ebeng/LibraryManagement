/*
 * server/__tests__/integration/specificFeature.api.test.js
 *
 * This test file implements the test cases from 'TC_Specific_Feature_Testing.pdf'.
 */

const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const User = require('../../../models/user');
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');
const Borrowal = require('../../../models/borrowal');
const Review = require('../../../models/review');

// Removed: let mongoServer;

let librarianAgent;
let memberAgent;
let testBook;
let unavailableBook;
let testAuthor;
let testGenre;
let testMember;
let anotherMember;
let testBorrowal;
let testReview;
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];
let createdBorrowalIds = [];
let createdReviewIds = [];

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	const mongoUri = process.env.MONGO_URI;
	await mongoose.connect(mongoUri);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	// Create test users
	const librarian = new User({
		name: 'test_librarian_sf',
		email: 'test_librarian_sf@example.com',
		password: 'password123',
		role: 'Librarian',
		isAdmin: true,
		photoUrl: 'http://example.com/librarian_sf.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	const member = new User({
		name: 'test_member_sf',
		email: 'test_member_sf@example.com',
		password: 'password123',
		role: 'Member',
		isAdmin: false,
		photoUrl: 'http://example.com/member_sf.jpg',
	});
	member.setPassword('password123');
	await member.save();
	testMember = member;
	createdUserIds.push(testMember._id);

	const anotherMem = new User({
		name: 'another_member_sf',
		email: 'another_member_sf@example.com',
		password: 'password123',
		role: 'Member',
		isAdmin: false,
		photoUrl: 'http://example.com/another_member_sf.jpg',
	});
	anotherMem.setPassword('password123');
	await anotherMem.save();
	anotherMember = anotherMem;
	createdUserIds.push(anotherMember._id);

	// Create agents
	librarianAgent = request.agent(app);
	memberAgent = request.agent(app);

	// Login users
	await librarianAgent.post('/api/auth/login').send({ email: 'test_librarian_sf@example.com', password: 'password123' });
	await memberAgent.post('/api/auth/login').send({ email: 'test_member_sf@example.com', password: 'password123' });

	// Seed data
	testAuthor = await Author.create({ name: 'Test Author SF', description: 'Specific Feature Author', photoUrl: 'http://example.com/testauthor_sf.jpg' });
	createdAuthorIds.push(testAuthor._id);
	testGenre = await Genre.create({ name: 'Test Genre SF', description: 'Specific Feature Genre' });
	createdGenreIds.push(testGenre._id);
	testBook = await Book.create({
		name: 'Test Book SF',
		isbn: '1234567890-SF',
		authorId: testAuthor._id, // Changed to authorId
		genreId: testGenre._id, // Changed to genreId
		isAvailable: true,
	});
	createdBookIds.push(testBook._id);
	unavailableBook = await Book.create({
		name: 'Unavailable Book SF',
		isbn: '1111111111-SF',
		authorId: testAuthor._id, // Changed to authorId
		genreId: testGenre._id, // Changed to genreId
		isAvailable: false,
	});
	createdBookIds.push(unavailableBook._id);
	testBorrowal = await Borrowal.create({
		bookId: testBook._id, // Changed to bookId
		memberId: anotherMember._id, // Changed to memberId
		status: 'PENDING',
	});
	createdBorrowalIds.push(testBorrowal._id);
	testReview = await Review.create({
		bookId: testBook._id, // Changed to bookId
		memberId: anotherMember._id, // Changed to memberId
		rating: 5,
		comment: 'A great read!',
	});
	createdReviewIds.push(testReview._id);
});

afterAll(async () => {
	try {
		await Review.deleteMany({ _id: { $in: createdReviewIds } });
		await Borrowal.deleteMany({ _id: { $in: createdBorrowalIds } });
		await Book.deleteMany({ _id: { $in: createdBookIds } });
		await Author.deleteMany({ _id: { $in: createdAuthorIds } });
		await Genre.deleteMany({ _id: { $in: createdGenreIds } });
		await User.deleteMany({ _id: { $in: createdUserIds } });
		// Clean up users created within tests
		await User.deleteMany({ email: 'delete_me_sf@example.com' });
		await Book.deleteMany({ isbn: '9876543210-SF-ADD' });
		await Book.deleteMany({ isbn: 'DELETE-ME-SF' });
		await Book.deleteMany({ name: 'Illegal Book' });
	} catch (error) {
		console.error('Error during afterAll cleanup in specificFeature.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after specificFeature tests.');
		}
	}
});

describe('Specific Feature Testing', () => {
	describe('Dashboard (Librarian)', () => {
		test('TC_DASH_001: Verify Librarian can access the Dashboard', async () => {
			const res = await librarianAgent.get('/api/users/getAll'); // A librarian-only route
			expect(res.statusCode).toBe(200);
		});

		test('TC_DASH_002: Verify Member cannot access the Dashboard', async () => {
			const res = await memberAgent.get('/api/users/getAll'); // A librarian-only route
			expect(res.statusCode).toBe(403);
		});
	});

	describe('Book Management (CRUD)', () => {
		test('TC_BOOK_ADD_001: Successful new book creation by Librarian', async () => {
			const res = await librarianAgent.post('/api/books/add').send({
				name: 'New Book By Librarian',
				isbn: '9876543210-SF-ADD',
				authorId: testAuthor._id.toString(), // Changed to authorId
				genreId: testGenre._id.toString(), // Changed to genreId
			});
			expect(res.statusCode).toBe(201);
			expect(res.body).toHaveProperty('newBook.name', 'New Book By Librarian');
		});

		test('TC_BOOK_ADD_002: Attempt to create a book with missing required fields', async () => {
			const res = await librarianAgent.post('/api/books/add').send({
				// Missing name and isbn
				authorId: testAuthor._id.toString(), // Changed to authorId
				genreId: testGenre._id.toString(), // Changed to genreId
			});
			expect(res.statusCode).toBe(400);
		});

		test('TC_BOOK_VIEW_001: Verify Member can view list of books and book details', async () => {
			const listRes = await memberAgent.get('/api/books/getAll'); // Corrected endpoint
			expect(listRes.statusCode).toBe(200);
			expect(listRes.body.booksList.length).toBeGreaterThan(0);

			const detailRes = await memberAgent.get(`/api/books/get/${testBook._id}`); // Corrected endpoint
			expect(detailRes.statusCode).toBe(200);
			expect(detailRes.body).toHaveProperty('book.name', 'Test Book SF');
		});

		test("TC_BOOK_UPD_001: Successful update of a book's details by Librarian", async () => {
			const res = await librarianAgent.put(`/api/books/update/${testBook._id}`).send({ name: 'Updated Test Book SF' }); // Corrected endpoint
			expect(res.statusCode).toBe(200);
			expect(res.body).toHaveProperty('updatedBook.name', 'Updated Test Book SF');
		});

		test('TC_BOOK_DEL_001: Successful deletion of a book by Librarian', async () => {
			const bookToDelete = await Book.create({ name: 'To Be Deleted', isbn: 'DELETE-ME-SF', authorId: testAuthor._id, genreId: testGenre._id });
			createdBookIds.push(bookToDelete._id);
			const res = await librarianAgent.delete(`/api/books/delete/${bookToDelete._id}`);
			expect(res.statusCode).toBe(200);

			const findRes = await librarianAgent.get(`/api/books/get/${bookToDelete._id}`); // Corrected endpoint
			expect(findRes.statusCode).toBe(404);
		});

		test('TC_BOOK_ACCESS_001: Verify Member cannot access book CRUD operations', async () => {
			const addRes = await memberAgent.post('/api/books/add').send({ name: 'Illegal Book', isbn: 'ILLEGAL-SF', authorId: testAuthor._id, genreId: testGenre._id }); // Corrected endpoint
			expect(addRes.statusCode).toBe(403);

			const updateRes = await memberAgent.put(`/api/books/update/${testBook._id}`).send({ name: 'Illegal Update' }); // Corrected endpoint
			expect(updateRes.statusCode).toBe(403);

			const deleteRes = await memberAgent.delete(`/api/books/delete/${testBook._id}`); // Corrected endpoint
			expect(deleteRes.statusCode).toBe(403);
		});
	});

	describe('Borrowal Management', () => {
		test('TC_BORW_ADD_001: Successful borrowal request by Member for an available book', async () => {
			const res = await memberAgent.post('/api/borrowals/add').send({ bookId: testBook._id, memberId: testMember._id }); // Added memberId and corrected endpoint
			expect(res.statusCode).toBe(201);
			expect(res.body).toHaveProperty('newBorrowal.bookId', testBook._id.toString());
			expect(res.body).toHaveProperty('newBorrowal.memberId', testMember._id.toString());
			createdBorrowalIds.push(res.body.newBorrowal._id);
		});

		test('TC_BORW_ADD_002: Attempt to borrow a book that is not available', async () => {
			const res = await memberAgent.post('/api/borrowals/add').send({ bookId: unavailableBook._id, memberId: testMember._id }); // Added memberId and corrected endpoint
			expect(res.statusCode).toBe(400);
		});

		test('TC_BORW_VIEW_001: Verify Member can only view their own borrowal history', async () => {
			// First, create a borrowal for the test member
			const tempBorrowalRes = await memberAgent.post('/api/borrowals/add').send({ bookId: testBook._id, memberId: testMember._id });
			if (tempBorrowalRes.statusCode === 201) createdBorrowalIds.push(tempBorrowalRes.body.newBorrowal._id);

			const res = await memberAgent.get('/api/borrowals/getAll'); // Corrected endpoint
			expect(res.statusCode).toBe(200);
			res.body.borrowalsList.forEach((borrowal) => {
				expect(borrowal.member._id).toBe(testMember._id.toString());
			});
			// Ensure the borrowal from 'anotherMember' is not present
			const borrowalIds = res.body.borrowalsList.map((b) => b._id.toString());
			expect(borrowalIds).not.toContain(testBorrowal._id.toString());
		});

		test('TC_BORW_VIEW_002: Verify Librarian can view all borrowal records', async () => {
			const res = await librarianAgent.get('/api/borrowals/getAll'); // Corrected endpoint
			expect(res.statusCode).toBe(200);
			expect(res.body.borrowalsList.length).toBeGreaterThan(0); // Should contain at least the borrowals created in tests
		});

		test('TC_BORW_UPD_001: Successful update of borrowal status by Librarian', async () => {
			const res = await librarianAgent.put(`/api/borrowals/update/${testBorrowal._id}`).send({ status: 'APPROVED' }); // Corrected endpoint
			expect(res.statusCode).toBe(200);
			expect(res.body).toHaveProperty('updatedBorrowal.status', 'APPROVED');
		});
	});

	describe('User Management (by Librarian)', () => {
		test('TC_USER_VIEW_001: Verify Librarian can view list of all users', async () => {
			const res = await librarianAgent.get('/api/users/getAll'); // Corrected endpoint
			expect(res.statusCode).toBe(200);
			expect(res.body.usersList.length).toBeGreaterThan(2); // Librarian, Test Member, Another Member
		});

		test("TC_USER_EDIT_001: Successful update of a user's non-critical details", async () => {
			const res = await librarianAgent
				.put(`/api/users/update/${testMember._id}`)
				.send({ name: 'Updated Test Member SF', email: testMember.email, isAdmin: testMember.isAdmin, photoUrl: testMember.photoUrl }); // Added required fields for update
			expect(res.statusCode).toBe(200);
			expect(res.body).toHaveProperty('updatedUser.name', 'Updated Test Member SF');
		});

		test('TC_USER_DEL.001: Successful deletion of a user by Librarian', async () => {
			const userToDelete = new User({
				username: 'delete_me_sf',
				password: 'password',
				role: 'Member',
				fullName: 'Delete Me',
				email: 'delete_me_sf@example.com',
				isAdmin: false,
				photoUrl: 'http://example.com/delete_me_sf.jpg',
			});
			userToDelete.setPassword('password');
			await userToDelete.save();
			createdUserIds.push(userToDelete._id);

			const res = await librarianAgent.delete(`/api/users/delete/${userToDelete._id}`); // Corrected endpoint
			expect(res.statusCode).toBe(200);

			const deletedUser = await User.findById(userToDelete._id);
			expect(deletedUser).toBeNull();
		});
	});

	describe('Review Management', () => {
		test('TC_REV_ADD_001: Successful addition of a review by member', async () => {
			const res = await memberAgent.post('/api/reviews/add').send({ bookId: testBook._id, rating: 4, comment: 'I loved it!', memberId: testMember._id }); // Added memberId and corrected endpoint
			expect(res.statusCode).toBe(201);
			expect(res.body).toHaveProperty('review.comment', 'I loved it!');
			createdReviewIds.push(res.body.review._id);
		});

		test('TC_REV_VIEW_001: Verify any user can view reviews for a book', async () => {
			const res = await memberAgent.get(`/api/reviews/getAll/${testBook._id}`); // Corrected endpoint
			expect(res.statusCode).toBe(200);
			expect(res.body.reviewList.length).toBeGreaterThan(0);
			expect(res.body.reviewList[0]).toHaveProperty('comment');
		});

		test('TC_REV_DEL_001: Successful deletion of a review by Librarian', async () => {
			const res = await librarianAgent.delete(`/api/reviews/delete/${testReview._id}`); // Corrected endpoint
			expect(res.statusCode).toBe(200);

			const deletedReview = await Review.findById(testReview._id);
			expect(deletedReview).toBeNull();
		});
	});
});
