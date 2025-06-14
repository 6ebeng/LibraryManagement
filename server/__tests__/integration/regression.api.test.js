/*
 * server/__tests__/integration/regression.api.test.js
 *
 * This test file implements the test cases from 'TC_Regression_Testing.tex'.
 */
const request = require('supertest');
const app = require('../../index'); // Corrected path
const mongoose = require('mongoose');
const Book = require('../../models/book');
const Author = require('../../models/author');
const Genre = require('../../models/genre');
const User = require('../../models/user');
const Borrowal = require('../../models/borrowal');

let librarianAgent;
let memberAgent;
let testBookAvailable;
let testBookUnavailable;
let testMember;
let testLibrarian;
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];
let createdBorrowalIds = [];

// Default credentials if environment variables are not set
const LIBRARIAN_EMAIL = process.env.LIBRARIAN_EMAIL || 'librarian.reg@example.com';
const LIBRARIAN_PASSWORD = process.env.LIBRARIAN_PASSWORD || 'password123';
const MEMBER_EMAIL = process.env.MEMBER_EMAIL || 'member.reg@example.com';
const MEMBER_PASSWORD = process.env.MEMBER_PASSWORD || 'password123';

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	// Seed Users
	const librarian = new User({
		name: 'Test Librarian',
		email: LIBRARIAN_EMAIL,
		isAdmin: true,
		photoUrl: 'http://example.com/librarian.jpg',
	});
	librarian.setPassword(LIBRARIAN_PASSWORD);
	await librarian.save();
	testLibrarian = librarian;
	createdUserIds.push(testLibrarian._id);

	const member = new User({
		name: 'Test Member',
		email: MEMBER_EMAIL,
		isAdmin: false,
		photoUrl: 'http://example.com/member.jpg',
	});
	member.setPassword(MEMBER_PASSWORD);
	await member.save();
	testMember = member;
	createdUserIds.push(testMember._id);

	// Seed Books
	const author = await Author.create({ name: 'Test Author REG', description: 'Test', photoUrl: 'http://example.com/testauthor_reg.jpg' });
	createdAuthorIds.push(author._id);
	const genre = await Genre.create({ name: 'Test Genre REG', description: 'Test' });
	createdGenreIds.push(genre._id);
	testBookAvailable = await Book.create({ name: 'Available Book for Regression', isbn: '123-REG-A', authorId: author._id, genreId: genre._id, isAvailable: true });
	createdBookIds.push(testBookAvailable._id);
	testBookUnavailable = await Book.create({ name: 'Unavailable Book for Regression', isbn: '456-REG-U', authorId: author._id, genreId: genre._id, isAvailable: false });
	createdBookIds.push(testBookUnavailable._id);

	// Create agents for authenticated requests
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: LIBRARIAN_EMAIL, password: LIBRARIAN_PASSWORD });

	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: MEMBER_EMAIL, password: MEMBER_PASSWORD });
});

afterAll(async () => {
	try {
		await Borrowal.deleteMany({ _id: { $in: createdBorrowalIds } });
		await Book.deleteMany({ _id: { $in: createdBookIds } });
		await Author.deleteMany({ _id: { $in: createdAuthorIds } });
		await Genre.deleteMany({ _id: { $in: createdGenreIds } });
		await User.deleteMany({ _id: { $in: createdUserIds } });
	} catch (error) {
		console.error('Error during afterAll cleanup in regression.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after regression tests.');
		}
	}
});

describe('Regression Test Suite', () => {
	describe('Authentication & Core Access (Smoke Tests)', () => {
		test('TC_REG_AUTH_001: Successful login with valid Librarian credentials', async () => {
			const res = await request.agent(app).post('/api/auth/login').send({ email: LIBRARIAN_EMAIL, password: LIBRARIAN_PASSWORD });
			expect(res.statusCode).toEqual(200);
			expect(res.body.success).toBe(true);
			expect(res.body.user.isAdmin).toBe(true);
		});

		test('TC_REG_AUTH_002: Successful login with valid Member credentials', async () => {
			const res = await request.agent(app).post('/api/auth/login').send({ email: MEMBER_EMAIL, password: MEMBER_PASSWORD });
			expect(res.statusCode).toEqual(200);
			expect(res.body.success).toBe(true);
			expect(res.body.user.isAdmin).toBe(false);
		});

		test('TC_REG_AUTH_003: Verify Member cannot access Librarian-specific URLs', async () => {
			const res = await memberAgent.get('/api/users/getAll'); // A librarian-only route
			expect(res.statusCode).toBe(403);
		});
	});

	describe('Borrowal Management Flow', () => {
		let newBorrowalId;

		test('TC_REG_FLOW_001: Member can borrow a book', async () => {
			const res = await memberAgent.post('/api/borrowals/add').send({ bookId: testBookAvailable._id, memberId: testMember._id });
			expect(res.statusCode).toEqual(201);
			expect(res.body.newBorrowal.bookId.toString()).toEqual(testBookAvailable._id.toString());
			expect(res.body.newBorrowal.memberId.toString()).toEqual(testMember._id.toString());
			expect(res.body.newBorrowal.status).toEqual('Borrowed');
			newBorrowalId = res.body.newBorrowal._id;
			createdBorrowalIds.push(newBorrowalId);

			// Verify book is no longer available
			const book = await Book.findById(testBookAvailable._id);
			expect(book.isAvailable).toBe(false);
		});

		test('TC_REG_FLOW_002: Member can view their own borrowal history', async () => {
			const res = await memberAgent.get('/api/borrowals/getAll');
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.borrowalsList)).toBe(true);
			const borrowal = res.body.borrowalsList.find((b) => b._id.toString() === newBorrowalId);
			expect(borrowal).toBeDefined();
			// Corrected assertion:
			// If the API returns memberId directly (because BorrowalSchema.memberId lacks 'ref: User'),
			// then we assert against b.memberId.
			// If the API *does* populate memberId into a 'member' object, the original 'b.member._id' would be correct,
			// but that would require 'ref: User' in BorrowalSchema for memberId.
			expect(
				res.body.borrowalsList.every((b) => {
					// Check if 'member' field is populated, otherwise use 'memberId'
					if (b.member && b.member._id) {
						return b.member._id.toString() === testMember._id.toString();
					}
					return b.memberId.toString() === testMember._id.toString();
				})
			).toBe(true);
		});

		test('TC_REG_FLOW_003: Librarian can update a borrowal status (e.g., return a book)', async () => {
			const res = await librarianAgent.put(`/api/borrowals/update/${newBorrowalId}`).send({ status: 'Returned' });
			expect(res.statusCode).toEqual(200);
			expect(res.body.updatedBorrowal.status).toEqual('Returned');

			// Verify book is available again
			const book = await Book.findById(testBookAvailable._id);
			expect(book.isAvailable).toBe(true);
		});
	});
});
