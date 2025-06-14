/*
 * server/__tests__/integration/useCase.api.test.js
 *
 * This new test file covers test cases from 'TC_Use_Case_Testing.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');
const User = require('../../../models/user');
const Borrowal = require('../../../models/borrowal');

// Removed: let mongoServer;

let librarianAgent;
let memberAgent;
let testAuthor;
let testGenre;
let testBook;
let testMember;
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];
let createdBorrowalIds = [];

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	// Seed data
	const librarian = new User({
		name: 'librarian_uc',
		email: 'librarian.uc@example.com',
		password: 'password123',
		role: 'Librarian',
		fullName: 'Lib UC',
		isAdmin: true,
		photoUrl: 'http://example.com/librarian_uc.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	const member = new User({
		name: 'member_uc',
		email: 'member.uc@example.com',
		password: 'password123',
		role: 'Member',
		fullName: 'Mem UC',
		isAdmin: false,
		photoUrl: 'http://example.com/member_uc.jpg',
	});
	member.setPassword('password123');
	await member.save();
	createdUserIds.push(member._id);
	testMember = member;

	testAuthor = await Author.create({ name: 'Test Author UC', description: 'Author for Use Case', photoUrl: 'http://example.com/author_uc.jpg' });
	createdAuthorIds.push(testAuthor._id);
	testGenre = await Genre.create({ name: 'Test Genre UC', description: 'Genre for Use Case' });
	createdGenreIds.push(testGenre._id);
	testBook = await Book.create({
		name: 'Test Book For Use Case',
		isbn: '111-1-11-111111-1-UC',
		authorId: testAuthor._id, // Changed to authorId
		genreId: testGenre._id, // Changed to genreId
		isAvailable: true,
	});
	createdBookIds.push(testBook._id);

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.uc@example.com', password: 'password123' });

	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: 'member.uc@example.com', password: 'password123' });
});

afterAll(async () => {
	try {
		await Borrowal.deleteMany({ _id: { $in: createdBorrowalIds } });
		await Book.deleteMany({ _id: { $in: createdBookIds } });
		await Author.deleteMany({ _id: { $in: createdAuthorIds } });
		await Genre.deleteMany({ _id: { $in: createdGenreIds } });
		await User.deleteMany({ _id: { $in: createdUserIds } });
		await Book.deleteMany({ isbn: '111-1-11-111111-1-UC' }); // Clean up book from duplicate ISBN test
	} catch (error) {
		console.error('Error during afterAll cleanup in useCase.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after useCase tests.');
		}
	}
});

describe('Use Case Based API Tests', () => {
	/**
	 * Test Case: TC_UC_BOOK_003
	 * Test: Attempt to add a book that fails backend validation (e.g., duplicate ISBN).
	 */
	it('TC_UC_BOOK_003: should prevent adding a book with a duplicate ISBN', async () => {
		const newBookPayload = {
			name: 'Another Book With Same ISBN',
			isbn: '111-1-11-111111-1-UC', // Duplicate ISBN
			authorId: testAuthor._id.toString(),
			genreId: testGenre._id.toString(),
		};
		const res = await librarianAgent.post('/api/books/add').send(newBookPayload); // Corrected endpoint

		// Assuming the backend returns a 400 or similar error for duplicates
		expect(res.statusCode).toBe(400);
	});

	/**
	 * Test Case: TC_UC_BORROW_003
	 * Test: Verify correct data population in borrowal form.
	 * Note: This tests the backend logic for creating a borrowal record with correct data.
	 */
	it('TC_UC_BORROW_003: should create a borrowal with correct member and date information', async () => {
		const res = await memberAgent.post('/api/borrowals/add').send({ bookId: testBook._id, memberId: testMember._id }); // Added memberId and corrected endpoint
		expect(res.statusCode).toEqual(201);
		createdBorrowalIds.push(res.body.newBorrowal._id);

		const borrowal = await Borrowal.findById(res.body.newBorrowal._id); // Changed to newBorrowal._id

		// 1. Check if member is correctly populated
		expect(borrowal.memberId.toString()).toEqual(testMember._id.toString()); // Changed to memberId

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
