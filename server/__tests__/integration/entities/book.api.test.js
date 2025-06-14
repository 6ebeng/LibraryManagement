/*
 * server/__tests__/integration/book.api.test.js
 *
 * This new test file covers test cases for Book entity management.
 * It corresponds to test cases from 'TC_Entity_Management.pdf' and 'TC_Use_Case_Testing.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');
const User = require('../../../models/user');

// Removed: let mongoServer;

let librarianAgent;
let memberAgent;
let testAuthor;
let testGenre;
let testBook;
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	// Seed data
	const librarian = new User({
		name: 'librarian_book',
		email: 'librarian.book@example.com',
		password: 'password123',
		isAdmin: true,
		photoUrl: 'http://example.com/librarian_book.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	const member = new User({ name: 'member_book', email: 'member.book@example.com', password: 'password123', isAdmin: false, photoUrl: 'http://example.com/member_book.jpg' });
	member.setPassword('password123');
	await member.save();
	createdUserIds.push(member._id);

	testAuthor = await Author.create({ name: 'J.K. Rowling', description: 'Author of Harry Potter', photoUrl: 'http://example.com/jk_rowling.jpg' });
	createdAuthorIds.push(testAuthor._id);
	testGenre = await Genre.create({ name: 'Fantasy', description: 'Fantasy genre' });
	createdGenreIds.push(testGenre._id);
	testBook = await Book.create({ name: 'The Hobbit', isbn: '978-0-395-07122-1-B', authorId: testAuthor._id, genreId: testGenre._id });
	createdBookIds.push(testBook._id);

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.book@example.com', password: 'password123' });

	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: 'member.book@example.com', password: 'password123' });
});

afterAll(async () => {
	try {
		await Book.deleteMany({ _id: { $in: createdBookIds } });
		await Author.deleteMany({ _id: { $in: createdAuthorIds } });
		await Genre.deleteMany({ _id: { $in: createdGenreIds } });
		await User.deleteMany({ _id: { $in: createdUserIds } });
		await Book.deleteMany({ name: 'A New Hope' }); // Clean up book created in test
		await Book.deleteMany({ name: 'A Book With No ISBN' }); // Clean up book created in test
		await Book.deleteMany({ name: 'A Member Book' }); // Clean up book created in test
		await Book.deleteMany({ name: 'The Hobbit: Updated Edition' }); // Clean up book created in test
		await Book.deleteMany({ name: 'To Be Deleted' }); // Clean up book created in test
	} catch (error) {
		console.error('Error during afterAll cleanup in book.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after book tests.');
		}
	}
});

describe('Book Management API', () => {
	// Section: Create Books
	describe('POST /api/books', () => {
		it('TC_BOOK_CREATE_001: should allow a librarian to create a new book', async () => {
			const res = await librarianAgent.post('/api/books/add').send({
				// Corrected endpoint
				name: 'A New Hope',
				isbn: '978-3-16-148410-0-B',
				authorId: testAuthor._id.toString(), // Changed to authorId
				genreId: testGenre._id.toString(), // Changed to genreId
			});
			expect(res.statusCode).toEqual(201);
			expect(res.body).toHaveProperty('newBook.name', 'A New Hope');
		});

		it('TC_BOOK_CREATE_002: should return an error if required fields are missing', async () => {
			const res = await librarianAgent.post('/api/books/add').send({
				// Corrected endpoint
				name: 'A Book With No ISBN',
			});
			expect(res.statusCode).toEqual(400);
		});

		it('TC_BOOK_CREATE_003: should prevent a member from creating a book', async () => {
			const res = await memberAgent.post('/api/books/add').send({
				// Corrected endpoint
				name: 'A Member Book',
				isbn: '978-1-4028-9462-6-B',
				authorId: testAuthor._id,
				genreId: testGenre._id,
			});
			expect(res.statusCode).toEqual(403);
		});
	});

	// Section: Read Books
	describe('GET /api/books', () => {
		it('TC_BOOK_READ_001: should allow any user (even guests) to view the list of books', async () => {
			const res = await request(app).get('/api/books/getAll'); // Corrected endpoint
			expect(res.statusCode).toEqual(200);
			expect(res.body.booksList.length).toBeGreaterThan(0);
		});
	});

	// Section: Update Books
	describe('PUT /api/books/:id', () => {
		it('TC_BOOK_UPDATE_001: should allow a librarian to update a book', async () => {
			const res = await librarianAgent.put(`/api/books/update/${testBook._id}`).send({ name: 'The Hobbit: Updated Edition' }); // Corrected endpoint

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty('updatedBook.name', 'The Hobbit: Updated Edition');
		});

		it('should prevent a member from updating a book', async () => {
			const res = await memberAgent.put(`/api/books/update/${testBook._id}`).send({ name: 'The Hobbit: Member Edition' }); // Corrected endpoint

			expect(res.statusCode).toEqual(403);
		});
	});

	// Section: Delete Books
	describe('DELETE /api/books/:id', () => {
		it('TC_BOOK_DELETE_001: should allow a librarian to delete a book', async () => {
			const newBook = await Book.create({ name: 'To Be Deleted', isbn: '111-1-11-111111-1-B', authorId: testAuthor._id, genreId: testGenre._id }); // Changed to authorId, genreId
			createdBookIds.push(newBook._id);
			const res = await librarianAgent.delete(`/api/books/delete/${newBook._id}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty('deletedBook.name', 'To Be Deleted');
		});

		it('should prevent a member from deleting a book', async () => {
			const res = await memberAgent.delete(`/api/books/delete/${testBook._id}`);
			expect(res.statusCode).toEqual(403);
		});
	});
});
