/*
 * server/__tests__/integration/workflows/concurrentBorrowal.api.test.js
 *
 * This test file implements the test case for concurrent borrowal attempts
 * from 'TC_Integration_Testing.pdf'.
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

let memberAgent1, memberAgent2;
let testBook;
let member1, member2;
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
	const user1 = new User({
		name: 'member1_concurrent',
		email: 'member1.concurrent@example.com',
		password: 'password123',
		isAdmin: false,
		photoUrl: 'http://example.com/member1_concurrent.jpg',
	});
	user1.setPassword('password123');
	await user1.save();
	member1 = user1;
	createdUserIds.push(member1._id);

	const user2 = new User({
		name: 'member2_concurrent',
		email: 'member2.concurrent@example.com',
		password: 'password123',
		isAdmin: false,
		photoUrl: 'http://example.com/member2_concurrent.jpg',
	});
	user2.setPassword('password123');
	await user2.save();
	member2 = user2;
	createdUserIds.push(member2._id);

	// Book
	const author = await Author.create({ name: 'Concurrent Author', description: 'Test', photoUrl: 'http://example.com/concurrent_author.jpg' });
	createdAuthorIds.push(author._id);
	const genre = await Genre.create({ name: 'Concurrent Genre', description: 'Test' });
	createdGenreIds.push(genre._id);
	testBook = await Book.create({ name: 'Last Book', isbn: '123-CONCURRENT', authorId: author._id, genreId: genre._id, isAvailable: true });
	createdBookIds.push(testBook._id);

	// Agents
	memberAgent1 = request.agent(app);
	await memberAgent1.post('/api/auth/login').send({ email: 'member1.concurrent@example.com', password: 'password123' });
	memberAgent2 = request.agent(app);
	await memberAgent2.post('/api/auth/login').send({ email: 'member2.concurrent@example.com', password: 'password123' });
});

afterAll(async () => {
	try {
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
	test('TC_INT_003: should prevent two members from borrowing the last book simultaneously', async () => {
		// Send two borrow requests concurrently
		const [res1, res2] = await Promise.all([
			memberAgent1.post('/api/borrowals/add').send({ bookId: testBook._id, memberId: member1._id }),
			memberAgent2.post('/api/borrowals/add').send({ bookId: testBook._id, memberId: member2._id }),
		]);

		// Capture created borrowal IDs for cleanup if successful
		if (res1.statusCode === 201) createdBorrowalIds.push(res1.body.newBorrowal._id);
		if (res2.statusCode === 201) createdBorrowalIds.push(res2.body.newBorrowal._id);

		const successResponses = [res1, res2].filter((res) => res.statusCode === 201);
		const errorResponses = [res1, res2].filter((res) => res.statusCode !== 201);

		// One request should succeed, and the other should fail.
		expect(successResponses).toHaveLength(1);
		expect(errorResponses).toHaveLength(1);

		// The failed request should indicate the book is not available.
		expect(errorResponses[0].statusCode).toBe(400);
		expect(errorResponses[0].body.message).toBe('This book is currently not available for borrowing'); // Updated message based on errorMessages.js

		// Verify the book is now unavailable.
		const book = await Book.findById(testBook._id);
		expect(book.isAvailable).toBe(false);
	});
});
