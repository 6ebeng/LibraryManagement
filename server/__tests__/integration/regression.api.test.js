/*
 * server/__tests__/integration/regression.api.test.js
 *
 * This test file implements the test cases from 'TC_Regression_Testing.tex'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');
const User = require('../../../models/user');
const Borrowal = require('../../../models/borrowal');

let mongoServer;
let librarianAgent;
let memberAgent;
let testBookAvailable;
let testBookUnavailable;
let testMember;
let testLibrarian;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	// Seed Users
	const users = await User.create([
		{
			name: 'Test Librarian',
			email: 'librarian.reg@test.com',
			password: 'password123',
			isAdmin: true,
			photoUrl: 'http://example.com/librarian.jpg',
		},
		{
			name: 'Test Member',
			email: 'member.reg@test.com',
			password: 'password123',
			isAdmin: false,
			photoUrl: 'http://example.com/member.jpg',
		},
	]);

	testLibrarian = users.find((u) => u.email === 'librarian.reg@test.com');
	testMember = users.find((u) => u.email === 'member.reg@test.com');

	// Seed Books
	const author = await Author.create({ name: 'Test Author' });
	const genre = await Genre.create({ name: 'Test Genre' });
	testBookAvailable = await Book.create({ name: 'Available Book for Regression', isbn: '123-REG-A', author: author._id, genre: genre._id, isAvailable: true });
	testBookUnavailable = await Book.create({ name: 'Unavailable Book for Regression', isbn: '456-REG-U', author: author._id, genre: genre._id, isAvailable: false });

	// Create agents for authenticated requests
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.reg@test.com', password: 'password123' });

	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: 'member.reg@test.com', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Regression Test Suite', () => {
	describe('Authentication & Core Access (Smoke Tests)', () => {
		test('TC_REG_AUTH_001: Successful login with valid Librarian credentials', async () => {
			const res = await request.agent(app).post('/api/auth/login').send({ email: 'librarian.reg@test.com', password: 'password123' });
			expect(res.statusCode).toEqual(200);
			expect(res.body.success).toBe(true);
			expect(res.body.user.isAdmin).toBe(true);
		});

		test('TC_REG_AUTH_002: Successful login with valid Member credentials', async () => {
			const res = await request.agent(app).post('/api/auth/login').send({ email: 'member.reg@test.com', password: 'password123' });
			expect(res.statusCode).toEqual(200);
			expect(res.body.success).toBe(true);
			expect(res.body.user.isAdmin).toBe(false);
		});

		test('TC_REG_AUTH_003: Verify Member cannot access Librarian-specific URLs', async () => {
			const res = await memberAgent.get('/api/users'); // A librarian-only route
			expect(res.statusCode).toBe(403);
		});
	});

	describe('Borrowal Management Flow', () => {
		let newBorrowalId;

		test('TC_REG_FLOW_001: Member can borrow a book', async () => {
			const res = await memberAgent.post('/api/borrowals').send({ bookId: testBookAvailable._id });
			expect(res.statusCode).toEqual(201);
			expect(res.body.book._id).toEqual(testBookAvailable._id.toString());
			expect(res.body.member._id).toEqual(testMember._id.toString());
			expect(res.body.status).toEqual('Borrowed');
			newBorrowalId = res.body._id;

			// Verify book is no longer available
			const book = await Book.findById(testBookAvailable._id);
			expect(book.isAvailable).toBe(false);
		});

		test('TC_REG_FLOW_002: Member can view their own borrowal history', async () => {
			const res = await memberAgent.get('/api/borrowals');
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body)).toBe(true);
			const borrowal = res.body.find((b) => b._id.toString() === newBorrowalId);
			expect(borrowal).toBeDefined();
			expect(res.body.every((b) => b.member._id.toString() === testMember._id.toString())).toBe(true);
		});

		test('TC_REG_FLOW_003: Librarian can update a borrowal status (e.g., return a book)', async () => {
			const res = await librarianAgent.put(`/api/borrowals/${newBorrowalId}`).send({ status: 'Returned' });
			expect(res.statusCode).toEqual(200);
			expect(res.body.status).toEqual('Returned');

			// Verify book is available again
			const book = await Book.findById(testBookAvailable._id);
			expect(book.isAvailable).toBe(true);
		});
	});
});
