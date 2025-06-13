/*
 * server/__tests__/integration/useCase.api.test.js
 *
 * This new test file covers test cases from 'TC_Use_Case_Testing.pdf'.
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
let librarianAgent;
let memberAgent;
let testAuthor;
let testGenre;
let testBook;
let testMember;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	// Seed data
	const users = await User.create([
		{ username: 'librarian_uc', password: 'password123', role: 'Librarian', fullName: 'Lib UC' },
		{ username: 'member_uc', password: 'password123', role: 'Member', fullName: 'Mem UC' },
	]);
	testMember = users.find((u) => u.username === 'member_uc');
	testAuthor = await Author.create({ name: 'Test Author UC' });
	testGenre = await Genre.create({ name: 'Test Genre UC' });
	testBook = await Book.create({
		name: 'Test Book For Use Case',
		isbn: '111-1-11-111111-1',
		author: testAuthor._id,
		genre: testGenre._id,
		isAvailable: true,
	});

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_uc', password: 'password123' });

	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ username: 'member_uc', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Use Case Based API Tests', () => {
	/**
	 * Test Case: TC_UC_BOOK_003
	 * Test: Attempt to add a book that fails backend validation (e.g., duplicate ISBN).
	 */
	it('TC_UC_BOOK_003: should prevent adding a book with a duplicate ISBN', async () => {
		const newBookPayload = {
			name: 'Another Book With Same ISBN',
			isbn: '111-1-11-111111-1', // Duplicate ISBN
			author: testAuthor._id.toString(),
			genre: testGenre._id.toString(),
		};
		const res = await librarianAgent.post('/api/books').send(newBookPayload);

		// Assuming the backend returns a 400 or similar error for duplicates
		expect(res.statusCode).toBe(400);
	});

	/**
	 * Test Case: TC_UC_BORROW_003
	 * Test: Verify correct data population in borrowal form.
	 * Note: This tests the backend logic for creating a borrowal record with correct data.
	 */
	it('TC_UC_BORROW_003: should create a borrowal with correct member and date information', async () => {
		const res = await memberAgent.post('/api/borrowals').send({ bookId: testBook._id });
		expect(res.statusCode).toEqual(201);

		const borrowal = await Borrowal.findById(res.body._id);

		// 1. Check if member is correctly populated
		expect(borrowal.member.toString()).toEqual(testMember._id.toString());

		// 2. Check if borrowedDate is close to the current date
		const borrowedDate = new Date(borrowal.borrowedDate);
		const currentDate = new Date();
		expect(borrowedDate.getTime()).toBeCloseTo(currentDate.getTime(), -3); //

		// 3. Check if dueDate is 14 days after the borrowedDate
		const expectedDueDate = new Date(borrowedDate);
		expectedDueDate.setDate(expectedDueDate.getDate() + 14);
		const dueDate = new Date(borrowal.dueDate);
		expect(dueDate.getFullYear()).toEqual(expectedDueDate.getFullYear());
		expect(dueDate.getMonth()).toEqual(expectedDueDate.getMonth());
		expect(dueDate.getDate()).toEqual(expectedDueDate.getDate());
	});
});
