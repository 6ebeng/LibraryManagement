/*
 * server/__tests__/integration/borrowal.api.test.js
 *
 * This new test file covers test cases for Borrowal management.
 * Corresponds to cases from 'TC_Entity_Management.pdf', 'TC_State_Transition_Testing.pdf',
 * and 'TC_Use_Case_Testing.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');
const User = require('../../../models/user');
const Borrowal = require('../../../models/borrowal');
const { errorMessages } = require('../../../utils/errorMessages'); // Import error messages

// Removed: let mongoServer;

let librarianAgent, memberAgent, newMemberAgent;
let testBookAvailable, testBookUnavailable;
let testMember, newMember;
let activeBorrowal;
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];
let createdBorrowalIds = [];

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	// Users
	const librarian = new User({
		name: 'librarian_brw',
		email: 'librarian.brw@example.com',
		password: 'password123',
		isAdmin: true,
		photoUrl: 'http://example.com/librarian_brw.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	const member = new User({ name: 'member_brw', email: 'member.brw@example.com', password: 'password123', isAdmin: false, photoUrl: 'http://example.com/member_brw.jpg' });
	member.setPassword('password123');
	await member.save();
	testMember = member;
	createdUserIds.push(testMember._id);

	const newMem = new User({
		name: 'new_member_brw',
		email: 'new_member.brw@example.com',
		password: 'password123',
		isAdmin: false,
		photoUrl: 'http://example.com/new_member_brw.jpg',
	});
	newMem.setPassword('password123');
	await newMem.save();
	newMember = newMem;
	createdUserIds.push(newMember._id);

	// Books
	const author = await Author.create({ name: 'Test Author BRW', description: 'Test', photoUrl: 'http://example.com/testauthor_brw.jpg' });
	createdAuthorIds.push(author._id);
	const genre = await Genre.create({ name: 'Test Genre BRW', description: 'Test' });
	createdGenreIds.push(genre._id);

	testBookAvailable = await Book.create({ name: 'Available Book BRW', isbn: '123-A-BRW', authorId: author._id, genreId: genre._id, isAvailable: true });
	createdBookIds.push(testBookAvailable._id);
	testBookUnavailable = await Book.create({ name: 'Unavailable Book BRW', isbn: '456-U-BRW', authorId: author._id, genreId: genre._id, isAvailable: false });
	createdBookIds.push(testBookUnavailable._id);

	// Active Borrowal
	activeBorrowal = await Borrowal.create({ memberId: testMember._id, bookId: testBookUnavailable._id, status: 'Borrowed' });
	createdBorrowalIds.push(activeBorrowal._id);

	// Agents
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.brw@example.com', password: 'password123' });
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: 'member.brw@example.com', password: 'password123' });
	newMemberAgent = request.agent(app);
	await newMemberAgent.post('/api/auth/login').send({ email: 'new_member.brw@example.com', password: 'password123' });
});

afterAll(async () => {
	try {
		await Borrowal.deleteMany({ _id: { $in: createdBorrowalIds } });
		await Book.deleteMany({ _id: { $in: createdBookIds } });
		await Author.deleteMany({ _id: { $in: createdAuthorIds } });
		await Genre.deleteMany({ _id: { $in: createdGenreIds } });
		await User.deleteMany({ _id: { $in: createdUserIds } });
	} catch (error) {
		console.error('Error during afterAll cleanup in borrowal.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after borrowal tests.');
		}
	}
});

describe('Borrowal Management API', () => {
	it('TC_BORROW_CREATE_001 & TC_STATE_BORROW_001: should allow a member to borrow an available book', async () => {
		const res = await memberAgent.post('/api/borrowals/add').send({ bookId: testBookAvailable._id, memberId: testMember._id }); // Added memberId and corrected endpoint
		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('newBorrowal.status', 'Borrowed');
		createdBorrowalIds.push(res.body.newBorrowal._id);

		const book = await Book.findById(testBookAvailable._id);
		expect(book.isAvailable).toBe(false);
	});

	it('TC_STATE_BORROW_004: should prevent borrowing an unavailable book', async () => {
		const res = await memberAgent.post('/api/borrowals/add').send({ bookId: testBookUnavailable._id, memberId: testMember._id }); // Added memberId and corrected endpoint
		expect(res.statusCode).toEqual(400);
		expect(res.body).toHaveProperty('message', errorMessages.borrowal.bookNotAvailable);
	});

	it('TC_BORROW_UPDATE_001 & TC_STATE_BORROW_002: should allow a librarian to mark a borrowal as returned', async () => {
		const res = await librarianAgent.put(`/api/borrowals/update/${activeBorrowal._id}`).send({ status: 'Returned' }); // Corrected endpoint

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('updatedBorrowal.status', 'Returned');

		const book = await Book.findById(testBookUnavailable._id);
		expect(book.isAvailable).toBe(true);
	});

	it('TC_UC_HISTORY_001: should allow a member to view their own borrowal history', async () => {
		const res = await memberAgent.get('/api/borrowals/getAll'); // Corrected endpoint
		expect(res.statusCode).toEqual(200);
		expect(Array.isArray(res.body.borrowalsList)).toBe(true);
		expect(res.body.borrowalsList.length).toBeGreaterThan(0);
		// All returned borrowals should belong to the logged-in member
		res.body.borrowalsList.forEach((b) => {
			expect(b.member._id.toString()).toEqual(testMember._id.toString());
		});
	});

	it('TC_UC_HISTORY_002: should show an empty list for a member with no history', async () => {
		// First, ensure newMember has no borrowals by deleting any created previously for cleanup
		await Borrowal.deleteMany({ memberId: newMember._id });

		const res = await newMemberAgent.get('/api/borrowals/getAll'); // Corrected endpoint
		expect(res.statusCode).toEqual(200);
		expect(res.body.borrowalsList).toEqual([]);
	});

	it('TC_UC_HISTORY_003: should allow a librarian to view all borrowal history', async () => {
		const res = await librarianAgent.get('/api/borrowals/getAll'); // Corrected endpoint
		expect(res.statusCode).toEqual(200);
		expect(res.body.borrowalsList.length).toBeGreaterThanOrEqual(2); // At least the two we've made
	});
});
