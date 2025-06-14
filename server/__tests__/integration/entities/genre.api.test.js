const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
// const { MongoMemoryServer } = require('mongodb-memory-server'); // Removed
const User = require('../../../models/user');
const Author = require('../../../models/author');
const Book = require('../../../models/book'); // Assuming Book model for referential integrity

// let mongoServer; // Removed
let librarianAgent, testLibrarian;
let authorWithBooks; // For referential integrity test
let bookByAuthor;

beforeAll(async () => {
	// mongoServer = await MongoMemoryServer.create(); // Removed
	await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo-test:27017/library_management_test');

	// Clear collections
	await User.deleteMany({});
	await Author.deleteMany({});
	await Book.deleteMany({});

	// Create librarian user
	const users = await User.create({ username: 'librarian_author', password: 'password123', role: 'Librarian' });
	testLibrarian = users; // Assuming User.create returns the created user directly or first element if array

	// Create author with books for referential integrity test
	authorWithBooks = await Author.create({ name: 'Author With Books' });
	bookByAuthor = await Book.create({ name: 'Book by Author With Books', isbn: 'ABC-123', author: authorWithBooks._id, isAvailable: true });

	// Authenticate librarian agent
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_author', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	// if (mongoServer) { // Removed
	//     await mongoServer.stop(); // Removed
	// }
});

describe('Author Management API', () => {
	it('TC_AUTHOR_CREATE_001: should allow a librarian to create a new author', async () => {
		const newAuthorData = { name: 'New Test Author' };
		const res = await librarianAgent.post('/api/authors').send(newAuthorData);
		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('name', newAuthorData.name);
	});

	it('TC_AUTHOR_READ_001: should allow any user to view authors', async () => {
		// Create an author to ensure there's something to view
		await Author.create({ name: 'Viewable Author' });

		const res = await request(app).get('/api/authors'); // No authentication needed for view
		expect(res.statusCode).toEqual(200);
		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body.length).toBeGreaterThan(0);
		expect(res.body.some((a) => a.name === 'Viewable Author')).toBe(true);
	});

	it('TC_AUTHOR_UPDATE_001: should allow a librarian to update an author', async () => {
		const authorToUpdate = await Author.create({ name: 'Author Update Test' });
		const updatedName = 'Updated Author Name';
		const res = await librarianAgent.put(`/api/authors/${authorToUpdate._id}`).send({ name: updatedName });
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('name', updatedName);

		const fetchedAuthor = await Author.findById(authorToUpdate._id);
		expect(fetchedAuthor.name).toEqual(updatedName);
	});

	it('TC_AUTHOR_DELETE_001: should allow a librarian to delete an author', async () => {
		const authorToDelete = await Author.create({ name: 'Author Delete Test' });
		const res = await librarianAgent.delete(`/api/authors/${authorToDelete._id}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Author deleted successfully.');

		const fetchedAuthor = await Author.findById(authorToDelete._id);
		expect(fetchedAuthor).toBeNull();
	});

	// New test case: Referential Integrity for Author Deletion
	it('TC_AUTHOR_DELETE_002: should prevent deleting an author with associated books', async () => {
		const res = await librarianAgent.delete(`/api/authors/${authorWithBooks._id}`);
		expect(res.statusCode).toEqual(400); // Or 409 Conflict, depending on your API
		expect(res.body).toHaveProperty('message', 'Cannot delete author with associated books.');

		// Verify the author still exists
		const authorExists = await Author.findById(authorWithBooks._id);
		expect(authorExists).not.toBeNull();
	});
});
