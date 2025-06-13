/*
 * server/__tests__/integration/userManagement.api.test.js
 *
 * This new test file covers additional test cases for User Management by a Librarian.
 * Corresponds to cases from 'TC_Entity_Management.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../../models/user');
const Borrowal = require('../../../models/borrowal');
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');

let mongoServer;
let librarianAgent;
let memberAgent;
let testMember;
let testBook;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	// Seed Users
	const users = await User.create([
		{ username: 'librarian_user_mgmt', password: 'password123', role: 'Librarian', fullName: 'Lib UserMgmt' },
		{ username: 'member_user_mgmt', password: 'password123', role: 'Member', fullName: 'Mem UserMgmt' },
	]);
	testMember = users.find((u) => u.username === 'member_user_mgmt');

	// Agents
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_user_mgmt', password: 'password123' });
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ username: 'member_user_mgmt', password: 'password123' });

	// Seed other data
	const author = await Author.create({ name: 'Test Author' });
	const genre = await Genre.create({ name: 'Test Genre' });
	testBook = await Book.create({ name: 'A Book for Borrowal', isbn: '111-B', author: author._id, genre: genre._id, isAvailable: false });
	await Borrowal.create({ member: testMember._id, book: testBook._id, status: 'Borrowed' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('User Management API - Additional Tests', () => {
	it('TC_USER_READ_001: (RBAC) should prevent a member from accessing user management list', async () => {
		const res = await memberAgent.get('/api/users/getAll');
		expect(res.statusCode).toEqual(403);
	});

	it('TC_USER_DELETE_001: (Referential Integrity) should prevent a librarian from deleting a member with active borrowals', async () => {
		const res = await librarianAgent.delete(`/api/users/delete/${testMember._id}`);
		expect(res.statusCode).toBe(400);
		expect(res.body.message).toMatch(/Cannot delete member with active borrowals/i);
	});
});
