/*
 * server/__tests__/integration/book.api.test.js
 *
 * This new test file covers test cases for Book entity management.
 * It corresponds to test cases from 'TC_Entity_Management.pdf' and 'TC_Use_Case_Testing.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');
const User = require('../../../models/user');

let mongoServer;
let librarianAgent;
let memberAgent;
let testAuthor;
let testGenre;
let testBook;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	// Seed data
	await User.create([
		{ username: 'librarian_book', password: 'password123', role: 'Librarian' },
		{ username: 'member_book', password: 'password123', role: 'Member' },
	]);
	testAuthor = await Author.create({ name: 'J.K. Rowling' });
	testGenre = await Genre.create({ name: 'Fantasy' });
	testBook = await Book.create({ name: 'The Hobbit', isbn: '978-0-395-07122-1', author: testAuthor._id, genre: testGenre._id });

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_book', password: 'password123' });

	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ username: 'member_book', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Book Management API', () => {
	// Section: Create Books
	describe('POST /api/books', () => {
		it('TC_BOOK_CREATE_001: should allow a librarian to create a new book', async () => {
			const res = await librarianAgent.post('/api/books').send({
				name: 'A New Hope',
				isbn: '978-3-16-148410-0',
				author: testAuthor._id.toString(),
				genre: testGenre._id.toString(),
			});
			expect(res.statusCode).toEqual(201);
			expect(res.body).toHaveProperty('name', 'A New Hope');
		});

		it('TC_BOOK_CREATE_002: should return an error if required fields are missing', async () => {
			const res = await librarianAgent.post('/api/books').send({
				name: 'A Book With No ISBN',
			});
			expect(res.statusCode).toEqual(400);
		});

		it('TC_BOOK_CREATE_003: should prevent a member from creating a book', async () => {
			const res = await memberAgent.post('/api/books').send({
				name: 'A Member Book',
				isbn: '978-1-4028-9462-6',
				author: testAuthor._id,
				genre: testGenre._id,
			});
			expect(res.statusCode).toEqual(403);
		});
	});

	// Section: Read Books
	describe('GET /api/books', () => {
		it('TC_BOOK_READ_001: should allow any user (even guests) to view the list of books', async () => {
			const res = await request(app).get('/api/books');
			expect(res.statusCode).toEqual(200);
			expect(res.body.length).toBeGreaterThan(0);
		});
	});

	// Section: Update Books
	describe('PUT /api/books/:id', () => {
		it('TC_BOOK_UPDATE_001: should allow a librarian to update a book', async () => {
			const res = await librarianAgent.put(`/api/books/${testBook._id}`).send({ name: 'The Hobbit: Updated Edition' });

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty('name', 'The Hobbit: Updated Edition');
		});

		it('should prevent a member from updating a book', async () => {
			const res = await memberAgent.put(`/api/books/${testBook._id}`).send({ name: 'The Hobbit: Member Edition' });

			expect(res.statusCode).toEqual(403);
		});
	});

	// Section: Delete Books
	describe('DELETE /api/books/:id', () => {
		it('TC_BOOK_DELETE_001: should allow a librarian to delete a book', async () => {
			const newBook = await Book.create({ name: 'To Be Deleted', isbn: '111-1-11-111111-1', author: testAuthor._id, genre: testGenre._id });
			const res = await librarianAgent.delete(`/api/books/${newBook._id}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty('message', 'Book removed');
		});

		it('should prevent a member from deleting a book', async () => {
			const res = await memberAgent.delete(`/api/books/${testBook._id}`);
			expect(res.statusCode).toEqual(403);
		});
	});
});
