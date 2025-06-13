/*
 * server/__tests__/integration/genre.api.test.js
 *
 * This new test file covers test cases for Genre entity management.
 * Corresponds to TC_GENRE_* cases from 'TC_Entity_Management.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Genre = require('../../../models/genre');
const User = require('../../../models/user');

let mongoServer;
let librarianAgent;
let testGenre;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	await User.create({ username: 'librarian_genre', password: 'password123', role: 'Librarian' });
	testGenre = await Genre.create({ name: 'Dystopian' });

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_genre', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Genre Management API', () => {
	it('TC_GENRE_CREATE_001: should allow a librarian to create a new genre', async () => {
		const res = await librarianAgent.post('/api/genres').send({ name: 'Science Fiction' });
		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('name', 'Science Fiction');
	});

	it('TC_GENRE_READ_001: should allow any user to view genres', async () => {
		const res = await request(app).get('/api/genres');
		expect(res.statusCode).toEqual(200);
		expect(res.body.length).toBeGreaterThan(0);
	});

	it('TC_GENRE_UPDATE_001: should allow a librarian to update a genre', async () => {
		const res = await librarianAgent.put(`/api/genres/${testGenre._id}`).send({ name: 'Dystopian Fiction' });
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('name', 'Dystopian Fiction');
	});

	it('TC_GENRE_DELETE_001: should allow a librarian to delete a genre', async () => {
		const genreToDelete = await Genre.create({ name: 'Temp Genre' });
		const res = await librarianAgent.delete(`/api/genres/${genreToDelete._id}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Genre removed');
	});
});
