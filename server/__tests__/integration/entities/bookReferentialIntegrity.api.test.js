/*
 * server/__tests__/integration/bookReferentialIntegrity.api.test.js
 *
 * This new test file covers referential integrity for Book entity management.
 * Corresponds to test case TC_BOOK_DELETE_002 from 'TC_Entity_Management.pdf'.
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
let testBook;
let testMember;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	// Seed Users
	const users = await User.create([
		{ username: 'librarian_book_ref', password: 'password123', role: 'Librarian', fullName: 'Lib BookRef' },
		{ username: 'member_book_ref', password: 'password123', role: 'Member', fullName: 'Mem BookRef' },
	]);
	testMember = users.find((u) => u.username === 'member_book_ref');

	// Agents
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_book_ref', password: 'password123' });
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ username: 'member_book_ref', password: 'password123' });

	// Seed other data
	const author = await Author.create({ name: 'Another Test Author' });
	const genre = await Genre.create({ name: 'Another Test Genre' });
	testBook = await Book.create({ name: 'A Borrowed Book', isbn: '999-B', author: author._id, genre: genre._id, isAvailable: false });
	await Borrowal.create({ member: testMember._id, book: testBook._id, status: 'Borrowed' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Book Referential Integrity API', () => {
	it('TC_BOOK_DELETE_002: (Referential Integrity) should prevent a librarian from deleting a book that is currently borrowed', async () => {
		const res = await librarianAgent.delete(`/api/books/delete/${testBook._id}`);
		expect(res.statusCode).toEqual(400);
		expect(res.body.message).toMatch(/Cannot delete a book with active borrowals/i);
	});
});
