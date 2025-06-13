/*
 * server/__tests__/integration/borrowal.api.test.js
 *
 * This new test file covers test cases for Borrowal management.
 * Corresponds to cases from 'TC_Entity_Management.pdf', 'TC_State_Transition_Testing.pdf',
 * and 'TC_Use_Case_Testing.pdf'.
 */
const request = require('supertest');
const app = require('../../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Book = require('../../models/book');
const Author = require('../../models/author');
const Genre = require('../../models/genre');
const User = require('../../models/user');
const Borrowal = require('../../models/borrowal');

let mongoServer;
let librarianAgent, memberAgent, newMemberAgent;
let testBookAvailable, testBookUnavailable;
let testMember, newMember;
let activeBorrowal;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	// Users
	const users = await User.create([
		{ username: 'librarian_brw', password: 'password123', role: 'Librarian' },
		{ username: 'member_brw', password: 'password123', role: 'Member' },
		{ username: 'new_member_brw', password: 'password123', role: 'Member' },
	]);
	testMember = users.find((u) => u.username === 'member_brw');
	newMember = users.find((u) => u.username === 'new_member_brw');

	// Books
	const author = await Author.create({ name: 'Test Author' });
	const genre = await Genre.create({ name: 'Test Genre' });
	testBookAvailable = await Book.create({ name: 'Available Book', isbn: '123-A', author: author._id, genre: genre._id, isAvailable: true });
	testBookUnavailable = await Book.create({ name: 'Unavailable Book', isbn: '456-U', author: author._id, genre: genre._id, isAvailable: false });

	// Active Borrowal
	activeBorrowal = await Borrowal.create({ member: testMember._id, book: testBookUnavailable._id, status: 'Borrowed' });

	// Agents
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_brw', password: 'password123' });
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ username: 'member_brw', password: 'password123' });
	newMemberAgent = request.agent(app);
	await newMemberAgent.post('/api/auth/login').send({ username: 'new_member_brw', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Borrowal Management API', () => {
	it('TC_BORROW_CREATE_001 & TC_STATE_BORROW_001: should allow a member to borrow an available book', async () => {
		const res = await memberAgent.post('/api/borrowals').send({ bookId: testBookAvailable._id });
		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('status', 'Borrowed');

		const book = await Book.findById(testBookAvailable._id);
		expect(book.isAvailable).toBe(false);
	});

	it('TC_STATE_BORROW_004: should prevent borrowing an unavailable book', async () => {
		const res = await memberAgent.post('/api/borrowals').send({ bookId: testBookUnavailable._id });
		expect(res.statusCode).toEqual(400);
		expect(res.body).toHaveProperty('message', 'Book is not available');
	});

	it('TC_BORROW_UPDATE_001 & TC_STATE_BORROW_002: should allow a librarian to mark a borrowal as returned', async () => {
		const res = await librarianAgent.put(`/api/borrowals/${activeBorrowal._id}`).send({ status: 'Returned' });

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('status', 'Returned');

		const book = await Book.findById(testBookUnavailable._id);
		expect(book.isAvailable).toBe(true);
	});

	it('TC_UC_HISTORY_001: should allow a member to view their own borrowal history', async () => {
		const res = await memberAgent.get('/api/borrowals');
		expect(res.statusCode).toEqual(200);
		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body.length).toBeGreaterThan(0);
		// All returned borrowals should belong to the logged-in member
		res.body.forEach((b) => {
			expect(b.member._id.toString()).toEqual(testMember._id.toString());
		});
	});

	it('TC_UC_HISTORY_002: should show an empty list for a member with no history', async () => {
		const res = await newMemberAgent.get('/api/borrowals');
		expect(res.statusCode).toEqual(200);
		expect(res.body).toEqual([]);
	});

	it('TC_UC_HISTORY_003: should allow a librarian to view all borrowal history', async () => {
		const res = await librarianAgent.get('/api/borrowals');
		expect(res.statusCode).toEqual(200);
		expect(res.body.length).toBeGreaterThanOrEqual(2); // At least the two we've made
	});
});
