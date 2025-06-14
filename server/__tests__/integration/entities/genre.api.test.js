/*
 * server/__tests__/integration/genre.api.test.js
 *
 * This new test file covers test cases for Genre entity management.
 * Corresponds to TC_GENRE_* cases from 'TC_Entity_Management.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const Genre = require('../../../models/genre');
const User = require('../../../models/user');

// Removed: let mongoServer;

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	// Create a librarian user with all required fields
	const librarian = new User({
		name: 'Librarian Genre Test',
		email: 'librarian.genre@example.com',
		isAdmin: true,
		photoUrl: 'http://example.com/librarian_genre.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();

	testGenre = await Genre.create({ name: 'Dystopian', description: 'Fiction about dystopian societies' });

	librarianAgent = request.agent(app);
	// Login with the created librarian user
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.genre@example.com', password: 'password123' });
});

afterAll(async () => {
	try {
		// Clean up test data
		await User.deleteMany({ email: 'librarian.genre@example.com' });
		await Genre.deleteMany({ name: { $in: ['Dystopian', 'Science Fiction', 'Dystopian Fiction', 'Temp Genre'] } });
	} catch (error) {
		console.error('Error during afterAll cleanup in genre.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after genre tests.');
		}
	}
});

describe('Genre Management API', () => {
	it('TC_GENRE_CREATE_001: should allow a librarian to create a new genre', async () => {
		const res = await librarianAgent.post('/api/genres/add').send({ name: 'Science Fiction', description: 'Genre about futuristic concepts' });
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('newGenre.name', 'Science Fiction');
	});

	it('TC_GENRE_READ_001: should allow any user to view genres', async () => {
		const res = await request(app).get('/api/genres/getAll');
		expect(res.statusCode).toEqual(200);
		expect(res.body.genresList.length).toBeGreaterThan(0);
	});

	it('TC_GENRE_UPDATE_001: should allow a librarian to update a genre', async () => {
		const res = await librarianAgent.put(`/api/genres/update/${testGenre._id}`).send({ name: 'Dystopian Fiction' });
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('updatedGenre.name', 'Dystopian Fiction');
	});

	it('TC_GENRE_DELETE_001: should allow a librarian to delete a genre', async () => {
		const genreToDelete = await Genre.create({ name: 'Temp Genre', description: 'Temporary Genre' });
		const res = await librarianAgent.delete(`/api/genres/delete/${genreToDelete._id}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('deletedGenre.name', 'Temp Genre');
	});
});
