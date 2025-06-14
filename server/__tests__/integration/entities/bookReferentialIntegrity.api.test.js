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

let librarianAgent;
let memberAgent; // Not used in these specific tests, but good to have if expanding
let testBookWithActiveBorrowal; // Renamed for clarity
let testMember;
let testGenreForBookIntegrity; // Renamed for clarity
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];
let createdBorrowalIds = [];

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	// Ensure MONGO_URI is set in your environment or .env file for this to work
	if (!process.env.MONGO_URI) {
		throw new Error('MONGO_URI environment variable is not set. Tests cannot connect to the database.');
	}
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for bookReferentialIntegrity tests: ${process.env.MONGO_URI}`);

	// Seed Users
	const librarian = new User({
		name: 'Lib BookRefInteg', // Unique name
		email: 'librarian.bookrefinteg@example.com', // Unique email
		isAdmin: true,
		photoUrl: 'http://example.com/lib_bookrefinteg.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	const member = new User({
		name: 'Mem BookRefInteg', // Unique name
		email: 'member.bookrefinteg@example.com', // Unique email
		isAdmin: false,
		photoUrl: 'http://example.com/mem_bookrefinteg.jpg',
	});
	member.setPassword('password123');
	await member.save();
	createdUserIds.push(member._id);
	testMember = member;

	// Agents
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.bookrefinteg@example.com', password: 'password123' });
	// Member agent login, in case it's needed for future tests in this file
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: 'member.bookrefinteg@example.com', password: 'password123' });

	// Seed data for referential integrity tests
	const authorForBookIntegrity = await Author.create({ name: 'Author For Book Integrity', description: 'Test', photoUrl: 'http://example.com/author_book_integ.jpg' });
	createdAuthorIds.push(authorForBookIntegrity._id);

	testGenreForBookIntegrity = await Genre.create({ name: 'Genre For Book Integrity', description: 'Test' });
	createdGenreIds.push(testGenreForBookIntegrity._id);

	// This book is specifically for testing deletion prevention due to active borrowals
	testBookWithActiveBorrowal = await Book.create({
		name: 'A Borrowed Book For Integrity Test',
		isbn: `999-B-BRI-${Date.now()}`, // Unique ISBN
		authorId: authorForBookIntegrity._id,
		genreId: testGenreForBookIntegrity._id,
		isAvailable: false, // Important: book is not available because it's borrowed
	});
	createdBookIds.push(testBookWithActiveBorrowal._id);

	const borrowal = await Borrowal.create({
		memberId: testMember._id,
		bookId: testBookWithActiveBorrowal._id,
		status: 'Borrowed',
	});
	createdBorrowalIds.push(borrowal._id);
});

afterAll(async () => {
	try {
		// Delete in reverse order of dependency
		await Borrowal.deleteMany({ _id: { $in: createdBorrowalIds } });
		await Book.deleteMany({ _id: { $in: createdBookIds } });
		await Author.deleteMany({ _id: { $in: createdAuthorIds } });
		await Genre.deleteMany({ _id: { $in: createdGenreIds } });
		await User.deleteMany({ _id: { $in: createdUserIds } });

		// Specific cleanup for items created ad-hoc within tests if not added to tracking arrays
		// (The current TC_INT_002 adds to createdAuthorIds and createdBookIds, so this is a fallback)
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
	// Test Case: TC_BOOK_DELETE_002
	// Objective: Verify that a book with active borrowals cannot be deleted.
	it('TC_BOOK_DELETE_002: (Referential Integrity) should prevent a librarian from deleting a book that is currently borrowed', async () => {
		// Attempt to delete the book that has an active borrowal (testBookWithActiveBorrowal)
		const res = await librarianAgent.delete(`/api/books/delete/${testBookWithActiveBorrowal._id}`);

		// Expect a 400 Bad Request (or similar error status like 409 Conflict)
		// The exact message depends on your bookController's implementation.
		expect(res.statusCode).toEqual(400);
		expect(res.body.message).toMatch(/Cannot delete this book as it has active borrowals/i);

		// Optionally, verify the book still exists
		const bookCheck = await Book.findById(testBookWithActiveBorrowal._id);
		expect(bookCheck).not.toBeNull();
	});

	// Test Case: TC_INT_002
	// Objective: Verify data integrity when a linked Author is deleted.
	// Assumes that deleting an Author does not cascade delete Books or nullify authorId in Books.
	// Instead, it tests that the Book's reference to the Author becomes "stale" (populated as null).
	test('TC_INT_002: Verify data integrity when a linked Author is deleted', async () => {
		// 1. Create a unique Author and a Book linked to them
		const uniqueAuthorName = `Deletable Author ${Date.now()}`;
		const authorToDelete = await Author.create({
			name: uniqueAuthorName,
			description: 'For integrity test TC_INT_002',
			photoUrl: 'http://example.com/deletable_author.jpg',
		});
		// Add to cleanup array if not already handled
		if (!createdAuthorIds.find((id) => id.equals(authorToDelete._id))) {
			createdAuthorIds.push(authorToDelete._id);
		}

		const bookWithAuthor = await Book.create({
			name: 'Book with Deletable Author', // This name is also in afterAll fallback cleanup
			isbn: `123-integ-test-${Date.now()}`,
			authorId: authorToDelete._id,
			genreId: testGenreForBookIntegrity._id, // Use the genre created in beforeAll
		});
		if (!createdBookIds.find((id) => id.equals(bookWithAuthor._id))) {
			createdBookIds.push(bookWithAuthor._id);
		}

		// 2. Verify the book is linked to the author (assumes GET /api/books/get/:id populates author)
		let resGetBook = await librarianAgent.get(`/api/books/get/${bookWithAuthor._id}`);
		expect(resGetBook.statusCode).toBe(200);
		expect(resGetBook.body.success).toBe(true);
		expect(resGetBook.body.book).toHaveProperty('author'); // Check if author field exists
		// If author is populated, it should be an object. If not populated, it might be just the ID.
		// This test relies on the `author` field being the populated object.
		expect(resGetBook.body.book.author.name).toBe(authorToDelete.name);
		expect(resGetBook.body.book.author._id.toString()).toBe(authorToDelete._id.toString());

		// 3. Delete the Author (via API)
		const deleteAuthorRes = await librarianAgent.delete(`/api/authors/delete/${authorToDelete._id}`);
		expect(deleteAuthorRes.statusCode).toBe(200); // Assuming successful deletion
		expect(deleteAuthorRes.body.success).toBe(true);

		// Verify author is actually gone from DB
		const authorCheck = await Author.findById(authorToDelete._id);
		expect(authorCheck).toBeNull();

		// 4. Verify the Book still exists but the author link is now effectively null when populated
		//    (Mongoose populate will result in `null` for a non-existent referenced document)
		resGetBook = await librarianAgent.get(`/api/books/get/${bookWithAuthor._id}`);
		expect(resGetBook.statusCode).toBe(200);
		expect(resGetBook.body.success).toBe(true);
		expect(resGetBook.body.book).toBeDefined(); // Book should still exist
		// If your GET /api/books/get/:id populates 'authorId' into an 'author' field:
		expect(resGetBook.body.book.author).toBeNull();
		// The original authorId field should still hold the (now dangling) ID, unless your schema has specific behavior
		expect(resGetBook.body.book.authorId.toString()).toBe(authorToDelete._id.toString());
	});
});
