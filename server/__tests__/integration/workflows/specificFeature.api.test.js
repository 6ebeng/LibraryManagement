/*
 * server/__tests__/integration/specificFeature.api.test.js
 *
 * This test file implements the test cases from 'TC_Specific_Feature_Testing.pdf'.
 */

const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../../models/user');
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');
const Borrowal = require('../../../models/borrowal');
const Review = require('../../../models/review');

let mongoServer;
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

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();
	await mongoose.connect(mongoUri);

	// Create test users
	await User.create({
		username: 'test_librarian_sf',
		password: 'password123',
		role: 'Librarian',
		fullName: 'Test Librarian SF',
	});
	testMember = await User.create({
		username: 'test_member_sf',
		password: 'password123',
		role: 'Member',
		fullName: 'Test Member SF',
	});
	anotherMember = await User.create({
		username: 'another_member_sf',
		password: 'password123',
		role: 'Member',
		fullName: 'Another Member SF',
	});

	// Create agents
	librarianAgent = request.agent(app);
	memberAgent = request.agent(app);

	// Login users
	await librarianAgent.post('/api/auth/login').send({ username: 'test_librarian_sf', password: 'password123' });
	await memberAgent.post('/api/auth/login').send({ username: 'test_member_sf', password: 'password123' });

	// Seed data
	testAuthor = await Author.create({ name: 'Test Author SF' });
	testGenre = await Genre.create({ name: 'Test Genre SF' });
	testBook = await Book.create({
		name: 'Test Book SF',
		isbn: '1234567890-SF',
		author: testAuthor._id,
		genre: testGenre._id,
		isAvailable: true,
	});
	unavailableBook = await Book.create({
		name: 'Unavailable Book SF',
		isbn: '1111111111-SF',
		author: testAuthor._id,
		genre: testGenre._id,
		isAvailable: false,
	});
	testBorrowal = await Borrowal.create({
		book: testBook._id,
		borrower: anotherMember._id,
		status: 'PENDING',
	});
	testReview = await Review.create({
		book: testBook._id,
		user: anotherMember._id,
		rating: 5,
		comment: 'A great read!',
	});
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Specific Feature Testing', () => {
	describe('Dashboard (Librarian)', () => {
		test('TC_DASH_001: Verify Librarian can access the Dashboard', async () => {
			const res = await librarianAgent.get('/api/users'); // A librarian-only route
			expect(res.statusCode).toBe(200);
		});

		test('TC_DASH_002: Verify Member cannot access the Dashboard', async () => {
			const res = await memberAgent.get('/api/users'); // A librarian-only route
			expect(res.statusCode).toBe(403);
		});
	});

	describe('Book Management (CRUD)', () => {
		test('TC_BOOK_ADD_001: Successful new book creation by Librarian', async () => {
			const res = await librarianAgent.post('/api/book/add').send({
				name: 'New Book By Librarian',
				isbn: '9876543210-SF-ADD',
				author: testAuthor._id.toString(),
				genre: testGenre._id.toString(),
			});
			expect(res.statusCode).toBe(201);
			expect(res.body).toHaveProperty('name', 'New Book By Librarian');
		});

		test('TC_BOOK_ADD_002: Attempt to create a book with missing required fields', async () => {
			const res = await librarianAgent.post('/api/book/add').send({
				// Missing name and isbn
				author: testAuthor._id.toString(),
				genre: testGenre._id.toString(),
			});
			expect(res.statusCode).toBe(400);
		});

		test('TC_BOOK_VIEW_001: Verify Member can view list of books and book details', async () => {
			const listRes = await memberAgent.get('/api/book/list');
			expect(listRes.statusCode).toBe(200);
			expect(listRes.body.length).toBeGreaterThan(0);

			const detailRes = await memberAgent.get(`/api/book/view/${testBook._id}`);
			expect(detailRes.statusCode).toBe(200);
			expect(detailRes.body).toHaveProperty('name', 'Test Book SF');
		});

		test("TC_BOOK_UPD_001: Successful update of a book's details by Librarian", async () => {
			const res = await librarianAgent.put(`/api/book/update/${testBook._id}`).send({ name: 'Updated Test Book SF' });
			expect(res.statusCode).toBe(200);
			expect(res.body).toHaveProperty('name', 'Updated Test Book SF');
		});

		test('TC_BOOK_DEL_001: Successful deletion of a book by Librarian', async () => {
			const bookToDelete = await Book.create({ name: 'To Be Deleted', isbn: 'DELETE-ME-SF', author: testAuthor._id, genre: testGenre._id });
			const res = await librarianAgent.delete(`/api/book/delete/${bookToDelete._id}`);
			expect(res.statusCode).toBe(200);

			const findRes = await librarianAgent.get(`/api/book/view/${bookToDelete._id}`);
			expect(findRes.statusCode).toBe(404);
		});

		test('TC_BOOK_ACCESS_001: Verify Member cannot access book CRUD operations', async () => {
			const addRes = await memberAgent.post('/api/book/add').send({ name: 'Illegal Book', isbn: 'ILLEGAL-SF', author: testAuthor._id, genre: testGenre._id });
			expect(addRes.statusCode).toBe(403);

			const updateRes = await memberAgent.put(`/api/book/update/${testBook._id}`).send({ name: 'Illegal Update' });
			expect(updateRes.statusCode).toBe(403);

			const deleteRes = await memberAgent.delete(`/api/book/delete/${testBook._id}`);
			expect(deleteRes.statusCode).toBe(403);
		});
	});

	describe('Borrowal Management', () => {
		test('TC_BORW_ADD_001: Successful borrowal request by Member for an available book', async () => {
			const res = await memberAgent.post('/api/borrowal/add').send({ bookId: testBook._id });
			expect(res.statusCode).toBe(201);
			expect(res.body).toHaveProperty('book', testBook._id.toString());
			expect(res.body).toHaveProperty('borrower', testMember._id.toString());
		});

		test('TC_BORW_ADD_002: Attempt to borrow a book that is not available', async () => {
			const res = await memberAgent.post('/api/borrowal/add').send({ bookId: unavailableBook._id });
			expect(res.statusCode).toBe(400);
		});

		test('TC_BORW_VIEW_001: Verify Member can only view their own borrowal history', async () => {
			// First, create a borrowal for the test member
			await memberAgent.post('/api/borrowal/add').send({ bookId: testBook._id });
			const res = await memberAgent.get('/api/borrowal/list/my');
			expect(res.statusCode).toBe(200);
			res.body.forEach((borrowal) => {
				expect(borrowal.borrower._id).toBe(testMember._id.toString());
			});
			// Ensure the borrowal from 'anotherMember' is not present
			const borrowalIds = res.body.map((b) => b._id.toString());
			expect(borrowalIds).not.toContain(testBorrowal._id.toString());
		});

		test('TC_BORW_VIEW_002: Verify Librarian can view all borrowal records', async () => {
			const res = await librarianAgent.get('/api/borrowal/list/all');
			expect(res.statusCode).toBe(200);
			expect(res.body.length).toBeGreaterThan(0); // Should contain at least the borrowals created in tests
		});

		test('TC_BORW_UPD_001: Successful update of borrowal status by Librarian', async () => {
			const res = await librarianAgent.put(`/api/borrowal/update/${testBorrowal._id}`).send({ status: 'APPROVED' });
			expect(res.statusCode).toBe(200);
			expect(res.body).toHaveProperty('status', 'APPROVED');
		});
	});

	describe('User Management (by Librarian)', () => {
		test('TC_USER_VIEW_001: Verify Librarian can view list of all users', async () => {
			const res = await librarianAgent.get('/api/user/list');
			expect(res.statusCode).toBe(200);
			expect(res.body.length).toBeGreaterThan(2); // Librarian, Test Member, Another Member
		});

		test("TC_USER_EDIT_001: Successful update of a user's non-critical details", async () => {
			const res = await librarianAgent.put(`/api/user/update/${testMember._id}`).send({ fullName: 'Updated Test Member SF' });
			expect(res.statusCode).toBe(200);
			expect(res.body).toHaveProperty('fullName', 'Updated Test Member SF');
		});

		test('TC_USER_DEL.001: Successful deletion of a user by Librarian', async () => {
			const userToDelete = await User.create({ username: 'delete_me_sf', password: 'password', role: 'Member', fullName: 'Delete Me' });
			const res = await librarianAgent.delete(`/api/user/delete/${userToDelete._id}`);
			expect(res.statusCode).toBe(200);

			const deletedUser = await User.findById(userToDelete._id);
			expect(deletedUser).toBeNull();
		});
	});

	describe('Review Management', () => {
		test('TC_REV_ADD_001: Successful addition of a review by member', async () => {
			const res = await memberAgent.post('/api/review/add').send({ bookId: testBook._id, rating: 4, comment: 'I loved it!' });
			expect(res.statusCode).toBe(201);
			expect(res.body).toHaveProperty('comment', 'I loved it!');
		});

		test('TC_REV_VIEW_001: Verify any user can view reviews for a book', async () => {
			const res = await memberAgent.get(`/api/review/list/${testBook._id}`);
			expect(res.statusCode).toBe(200);
			expect(res.body.length).toBeGreaterThan(0);
			expect(res.body[0]).toHaveProperty('comment');
		});

		test('TC_REV_DEL_001: Successful deletion of a review by Librarian', async () => {
			const res = await librarianAgent.delete(`/api/review/delete/${testReview._id}`);
			expect(res.statusCode).toBe(200);

			const deletedReview = await Review.findById(testReview._id);
			expect(deletedReview).toBeNull();
		});
	});
});
