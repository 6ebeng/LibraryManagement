/*
 * server/__tests__/integration/workflows/concurrentBorrowal.api.test.js
 *
 * This test file implements the test case for concurrent borrowal attempts
 * from 'TC_Integration_Testing.pdf'.
 * It verifies that if two users attempt to borrow the same last available book
 * simultaneously, only one request should succeed.
 */

const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');
const User = require('../../../models/user');
const Borrowal = require('../../../models/borrowal');

let memberAgent1, memberAgent2;
let testBookForConcurrency; // Renamed for clarity
let member1_concurrent, member2_concurrent; // Renamed for clarity
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];
let createdBorrowalIds = [];

beforeAll(async () => {
	if (!process.env.MONGO_URI) {
		throw new Error('MONGO_URI environment variable is not set. Tests cannot connect to the database.');
	}
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for concurrentBorrowal tests: ${process.env.MONGO_URI}`);

	// Seed Users
	const user1Data = {
		name: 'Member1 ConcurrentTest',
		email: `member1.concurrent.${Date.now()}@example.com`, // Ensure unique email
		isAdmin: false,
		photoUrl: 'http://example.com/member1_concurrent.jpg',
	};
	const user1 = new User(user1Data);
	user1.setPassword('password123');
	await user1.save();
	member1_concurrent = user1;
	createdUserIds.push(member1_concurrent._id);

	const user2Data = {
		name: 'Member2 ConcurrentTest',
		email: `member2.concurrent.${Date.now()}@example.com`, // Ensure unique email
		isAdmin: false,
		photoUrl: 'http://example.com/member2_concurrent.jpg',
	};
	const user2 = new User(user2Data);
	user2.setPassword('password123');
	await user2.save();
	member2_concurrent = user2;
	createdUserIds.push(member2_concurrent._id);

	// Seed Book
	const author = await Author.create({ name: `Concurrent Author ${Date.now()}`, description: 'Test', photoUrl: 'http://example.com/concurrent_author.jpg' });
	createdAuthorIds.push(author._id);
	const genre = await Genre.create({ name: `Concurrent Genre ${Date.now()}`, description: 'Test' });
	createdGenreIds.push(genre._id);

	testBookForConcurrency = await Book.create({
		name: 'Last Book for Concurrent Test',
		isbn: `123-CONCURRENT-${Date.now()}`, // Unique ISBN for each test run
		authorId: author._id,
		genreId: genre._id,
		isAvailable: true, // Book must be initially available
	});
	createdBookIds.push(testBookForConcurrency._id);

	// Create Logged-in Agents
	memberAgent1 = request.agent(app);
	await memberAgent1.post('/api/auth/login').send({ email: user1Data.email, password: 'password123' });
	memberAgent2 = request.agent(app);
	await memberAgent2.post('/api/auth/login').send({ email: user2Data.email, password: 'password123' });
});

afterAll(async () => {
	try {
		// Clean up in reverse order of creation or by dependency
		await Borrowal.deleteMany({ _id: { $in: createdBorrowalIds } });
		await Book.deleteMany({ _id: { $in: createdBookIds } });
		await Author.deleteMany({ _id: { $in: createdAuthorIds } });
		await Genre.deleteMany({ _id: { $in: createdGenreIds } });
		await User.deleteMany({ _id: { $in: createdUserIds } });
	} catch (error) {
		console.error('Error during afterAll cleanup in concurrentBorrowal.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after concurrentBorrowal tests.');
		}
	}
});

describe('Concurrent Borrowal Workflow', () => {
	// Test Case: TC_INT_003
	// Objective: Verify that if two members attempt to borrow the last available book simultaneously,
	// only one request succeeds, and the other fails with an appropriate message.
	test('TC_INT_003: should prevent two members from borrowing the last available book simultaneously', async () => {
		// Send two borrow requests concurrently for the same book
		const [res1, res2] = await Promise.all([
			memberAgent1.post('/api/borrowals/add').send({ bookId: testBookForConcurrency._id, memberId: member1_concurrent._id }),
			memberAgent2.post('/api/borrowals/add').send({ bookId: testBookForConcurrency._id, memberId: member2_concurrent._id }),
		]);

		// Capture created borrowal IDs for cleanup, checking if newBorrowal exists
		if (res1.statusCode === 201 && res1.body.newBorrowal && res1.body.newBorrowal._id) {
			createdBorrowalIds.push(res1.body.newBorrowal._id);
		}
		if (res2.statusCode === 201 && res2.body.newBorrowal && res2.body.newBorrowal._id) {
			createdBorrowalIds.push(res2.body.newBorrowal._id);
		}

		const successResponses = [res1, res2].filter((res) => res.statusCode === 201);
		const errorResponses = [res1, res2].filter((res) => res.statusCode !== 201);

		// Assertion: Exactly one request should succeed (status 201).
		expect(successResponses).toHaveLength(1);
		// Assertion: Exactly one request should fail.
		expect(errorResponses).toHaveLength(1);

		// Assertion: The failed request should have a 400 status code.
		// This assumes the controller, if robust, returns 400 for "book not available".
		expect(errorResponses[0].statusCode).toBe(400);
		// Assertion: The failed request's body should contain the specific "not available" message.
		// This message must match what a concurrency-aware controller would return.
		// The provided `borrowalController.js` does not currently generate this specific message for this scenario.
		// This test asserts the *desired* behavior.
		expect(errorResponses[0].body.success).toBe(false); // Assuming error response structure
		expect(errorResponses[0].body.message).toBe('This book is currently not available for borrowing');

		// Assertion: Verify the book's status in the database is now unavailable.
		const bookAfterBorrowal = await Book.findById(testBookForConcurrency._id);
		expect(bookAfterBorrowal).toBeDefined();
		expect(bookAfterBorrowal.isAvailable).toBe(false);

		// Assertion: Verify that only one borrowal record was created for this book.
		const borrowalsForBook = await Borrowal.find({ bookId: testBookForConcurrency._id });
		expect(borrowalsForBook).toHaveLength(1);
		// Ensure the successful borrowal matches one of the members.
		const successfulMemberId = successResponses[0].body.newBorrowal.memberId.toString();
		expect([member1_concurrent._id.toString(), member2_concurrent._id.toString()]).toContain(successfulMemberId);
		expect(borrowalsForBook[0].memberId.toString()).toBe(successfulMemberId);
	}, 15000); // Increased timeout for integration test involving concurrent requests
});
