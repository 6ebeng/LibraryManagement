/*
 * server/__tests__/integration/workflows/concurrentBorrowal.api.test.js
 *
 * This test file implements the test case for concurrent borrowal attempts
 * from 'TC_Integration_Testing.pdf'.
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
let memberAgent1, memberAgent2;
let testBook;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	// Users
	const users = await User.create([
		{ username: 'member1_concurrent', password: 'password123', role: 'Member' },
		{ username: 'member2_concurrent', password: 'password123', role: 'Member' },
	]);
	const member1 = users.find((u) => u.username === 'member1_concurrent');
	const member2 = users.find((u) => u.username === 'member2_concurrent');

	// Book
	const author = await Author.create({ name: 'Concurrent Author' });
	const genre = await Genre.create({ name: 'Concurrent Genre' });
	testBook = await Book.create({ name: 'Last Book', isbn: '123-CONCURRENT', author: author._id, genre: genre._id, isAvailable: true });

	// Agents
	memberAgent1 = request.agent(app);
	await memberAgent1.post('/api/auth/login').send({ username: 'member1_concurrent', password: 'password123' });
	memberAgent2 = request.agent(app);
	await memberAgent2.post('/api/auth/login').send({ username: 'member2_concurrent', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Concurrent Borrowal Workflow', () => {
	test('TC_INT_003: should prevent two members from borrowing the last book simultaneously', async () => {
		const borrowPayload = { bookId: testBook._id };

		// Send two borrow requests concurrently
		const [res1, res2] = await Promise.all([memberAgent1.post('/api/borrowal/add').send(borrowPayload), memberAgent2.post('/api/borrowal/add').send(borrowPayload)]);

		const successResponses = [res1, res2].filter((res) => res.statusCode === 201);
		const errorResponses = [res1, res2].filter((res) => res.statusCode !== 201);

		// One request should succeed, and the other should fail.
		expect(successResponses).toHaveLength(1);
		expect(errorResponses).toHaveLength(1);

		// The failed request should indicate the book is not available.
		expect(errorResponses[0].statusCode).toBe(400);
		expect(errorResponses[0].body.message).toBe('Book is not available');

		// Verify the book is now unavailable.
		const book = await Book.findById(testBook._id);
		expect(book.isAvailable).toBe(false);
	});
});
