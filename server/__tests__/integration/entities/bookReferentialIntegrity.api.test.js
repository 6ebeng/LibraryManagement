/*
 * server/__tests__/integration/entities/bookReferentialIntegrity.api.test.js
 *
 * This test file covers referential integrity for Book entity management.
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
let testGenre; // Added for the new test case

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
	testGenre = await Genre.create({ name: 'Another Test Genre' }); // Initialize testGenre
	testBook = await Book.create({ name: 'A Borrowed Book', isbn: '999-B', author: author._id, genre: testGenre._id, isAvailable: false });
	await Borrowal.create({ member: testMember._id, book: testBook._id, status: 'Borrowed' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Book Referential Integrity API', () => {
	it('TC_BOOK_DELETE_002: (Referential Integrity) should prevent a librarian from deleting a book that is currently borrowed', async () => {
		const res = await librarianAgent.delete(`/api/book/delete/${testBook._id}`); // Corrected endpoint
		expect(res.statusCode).toEqual(400);
		expect(res.body.message).toMatch(/Cannot delete a book with active borrowals/i);
	});

	// <<< UPDATE CODE TO BE ADDED HERE >>>
	test('TC_INT_002: Verify data integrity when a linked Author is deleted', async () => {
		// 1. Create a unique Author and a Book linked to them
		const authorToDelete = await Author.create({ name: `Deletable Author ${Date.now()}` });
		const bookWithAuthor = await Book.create({
			name: 'Book with Deletable Author',
			isbn: `123-integ-test-${Date.now()}`,
			author: authorToDelete._id, // Use 'author' to match the model
			genre: testGenre._id,
		});

		// 2. Verify the book is linked to the author
		let res = await librarianAgent.get(`/api/book/view/${bookWithAuthor._id}`);
		expect(res.statusCode).toBe(200);
		// Ensure the correct property is checked
		expect(res.body.book.author._id.toString()).toBe(authorToDelete._id.toString());

		// 3. Delete the Author
		await librarianAgent.delete(`/api/author/delete/${authorToDelete._id}`);

		// 4. Verify the Book still exists but the author link is now null
		res = await librarianAgent.get(`/api/book/view/${bookWithAuthor._id}`);
		expect(res.statusCode).toBe(200);
		expect(res.body.book.author).toBeNull();
	});
});
