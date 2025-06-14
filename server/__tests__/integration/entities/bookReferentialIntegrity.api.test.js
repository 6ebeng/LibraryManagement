/*
 * server/__tests__/integration/entities/bookReferentialIntegrity.api.test.js
 *
 * This test file covers referential integrity for Book entity management.
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
let testBook;
let testMember;
let testGenre;
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];
let createdBorrowalIds = [];

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	// Seed Users
	const librarian = new User({
		name: 'Lib BookRef',
		email: 'librarian.bookref@example.com',
		isAdmin: true,
		photoUrl: 'http://example.com/lib_bookref.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	const member = new User({
		name: 'Mem BookRef',
		email: 'member.bookref@example.com',
		isAdmin: false,
		photoUrl: 'http://example.com/mem_bookref.jpg',
	});
	member.setPassword('password123');
	await member.save();
	createdUserIds.push(member._id);
	testMember = member;

	// Agents
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.bookref@example.com', password: 'password123' });
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: 'member.bookref@example.com', password: 'password123' });

	// Seed other data
	const author = await Author.create({ name: 'Another Test Author', description: 'Test', photoUrl: 'http://example.com/another_test_author.jpg' });
	createdAuthorIds.push(author._id);
	testGenre = await Genre.create({ name: 'Another Test Genre', description: 'Test' }); // Initialize testGenre
	createdGenreIds.push(testGenre._id);
	testBook = await Book.create({ name: 'A Borrowed Book', isbn: '999-B-BRI', authorId: author._id, genreId: testGenre._id, isAvailable: false });
	createdBookIds.push(testBook._id);
	const borrowal = await Borrowal.create({ memberId: testMember._id, bookId: testBook._id, status: 'Borrowed' });
	createdBorrowalIds.push(borrowal._id);
});

afterAll(async () => {
	try {
		await Borrowal.deleteMany({ _id: { $in: createdBorrowalIds } });
		await Book.deleteMany({ _id: { $in: createdBookIds } });
		await Author.deleteMany({ _id: { $in: createdAuthorIds } });
		await Genre.deleteMany({ _id: { $in: createdGenreIds } });
		await User.deleteMany({ _id: { $in: createdUserIds } });
		// Clean up any authors created within the specific test
		await Author.deleteMany({ name: { $regex: /^Deletable Author/ } });
		await Book.deleteMany({ name: 'Book with Deletable Author' });
	} catch (error) {
		console.error('Error during afterAll cleanup in bookReferentialIntegrity.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after bookReferentialIntegrity tests.');
		}
	}
});

describe('Book Referential Integrity API', () => {
	it('TC_BOOK_DELETE_002: (Referential Integrity) should prevent a librarian from deleting a book that is currently borrowed', async () => {
		const res = await librarianAgent.delete(`/api/books/delete/${testBook._id}`);
		expect(res.statusCode).toEqual(400);
		expect(res.body.message).toMatch(/Cannot delete this book as it has active borrowals/i);
	});

	test('TC_INT_002: Verify data integrity when a linked Author is deleted', async () => {
		// 1. Create a unique Author and a Book linked to them
		const authorToDelete = await Author.create({ name: `Deletable Author ${Date.now()}`, description: 'For integrity test', photoUrl: 'http://example.com/deletable_author.jpg' });
		createdAuthorIds.push(authorToDelete._id);
		const bookWithAuthor = await Book.create({
			name: 'Book with Deletable Author',
			isbn: `123-integ-test-${Date.now()}`,
			authorId: authorToDelete._id, // Use 'authorId' to match the model
			genreId: testGenre._id,
		});
		createdBookIds.push(bookWithAuthor._id);

		// 2. Verify the book is linked to the author
		let res = await librarianAgent.get(`/api/books/get/${bookWithAuthor._id}`);
		expect(res.statusCode).toBe(200);
		// Ensure the correct property is checked
		expect(res.body.book.author.name).toBe(authorToDelete.name);

		// 3. Delete the Author
		await librarianAgent.delete(`/api/authors/delete/${authorToDelete._id}`);

		// 4. Verify the Book still exists but the author link is now null
		res = await librarianAgent.get(`/api/books/get/${bookWithAuthor._id}`);
		expect(res.statusCode).toBe(200);
		// The author field should be null if it's not populated, or the default value
		// based on the schema definition if a book can exist without an author.
		// It should be null because the deleteAuthor controller does not explicitly nullify `authorId` in books,
		// but if the populate fails because the author no longer exists, `author` in `res.body.book.author` would be null.
		expect(res.body.book.author).toBeNull();
	});
});
