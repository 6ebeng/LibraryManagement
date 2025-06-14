/*
 * server/__tests__/integration/author.api.test.js
 *
 * This new test file covers test cases for Author entity management.
 * Corresponds to TC_AUTHOR_* cases from 'TC_Entity_Management.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const Author = require('../../../models/author');
const User = require('../../../models/user');

// Removed: let mongoServer;

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	// Create a librarian user with all required fields
	const librarian = new User({
		name: 'Librarian Author Test',
		email: 'librarian.author@example.com',
		isAdmin: true,
		photoUrl: 'http://example.com/librarian_author.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();

	testAuthor = await Author.create({ name: 'George Orwell', description: 'British novelist', photoUrl: 'http://example.com/george_orwell.jpg' });

	librarianAgent = request.agent(app);
	// Login with the created librarian user
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.author@example.com', password: 'password123' });
});

afterAll(async () => {
	try {
		// Clean up test data (optional, but good practice if not done by seeder)
		await User.deleteMany({ email: 'librarian.author@example.com' });
		await Author.deleteMany({ name: { $in: ['George Orwell', 'Aldous Huxley', 'Temp Author', 'G. Orwell'] } }); // Include names potentially created/modified by tests
	} catch (error) {
		console.error('Error during afterAll cleanup in author.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after author tests.');
		}
	}
});

describe('Author Management API', () => {
	it('TC_AUTHOR_CREATE_001: should allow a librarian to create a new author', async () => {
		const res = await librarianAgent
			.post('/api/authors/add')
			.send({ name: 'Aldous Huxley', description: 'Author of Brave New World', photoUrl: 'http://example.com/aldous_huxley.jpg' });
		expect(res.statusCode).toEqual(200); // Changed to 200 based on controller
		expect(res.body).toHaveProperty('newAuthor.name', 'Aldous Huxley');
	});

	it('TC_AUTHOR_READ_001: should allow any user to view authors', async () => {
		const res = await request(app).get('/api/authors/getAll');
		expect(res.statusCode).toEqual(200);
		expect(res.body.authorsList.length).toBeGreaterThan(0);
	});

	it('TC_AUTHOR_UPDATE_001: should allow a librarian to update an author', async () => {
		const res = await librarianAgent.put(`/api/authors/update/${testAuthor._id}`).send({ name: 'G. Orwell' });
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('updatedAuthor.name', 'G. Orwell');
	});

	it('TC_AUTHOR_DELETE_001: should allow a librarian to delete an author', async () => {
		const authorToDelete = await Author.create({ name: 'Temp Author', description: 'Temporary Author', photoUrl: 'http://example.com/temp_author.jpg' });
		const res = await librarianAgent.delete(`/api/authors/delete/${authorToDelete._id}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('deletedAuthor.name', 'Temp Author');
	});
});
