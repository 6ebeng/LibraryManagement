/*
 * server/__tests__/integration/author.api.test.js
 *
 * This new test file covers test cases for Author entity management.
 * Corresponds to TC_AUTHOR_* cases from 'TC_Entity_Management.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Author = require('../../../models/author');
const User = require('../../../models/user');

let mongoServer;
let librarianAgent;
let testAuthor;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	await User.create({ username: 'librarian_author', password: 'password123', role: 'Librarian' });
	testAuthor = await Author.create({ name: 'George Orwell' });

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_author', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Author Management API', () => {
	it('TC_AUTHOR_CREATE_001: should allow a librarian to create a new author', async () => {
		const res = await librarianAgent.post('/api/authors').send({ name: 'Aldous Huxley' });
		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('name', 'Aldous Huxley');
	});

	it('TC_AUTHOR_READ_001: should allow any user to view authors', async () => {
		const res = await request(app).get('/api/authors');
		expect(res.statusCode).toEqual(200);
		expect(res.body.length).toBeGreaterThan(0);
	});

	it('TC_AUTHOR_UPDATE_001: should allow a librarian to update an author', async () => {
		const res = await librarianAgent.put(`/api/authors/${testAuthor._id}`).send({ name: 'G. Orwell' });
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('name', 'G. Orwell');
	});

	it('TC_AUTHOR_DELETE_001: should allow a librarian to delete an author', async () => {
		const authorToDelete = await Author.create({ name: 'Temp Author' });
		const res = await librarianAgent.delete(`/api/authors/${authorToDelete._id}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Author removed');
	});
});
