/*
 * server/__tests__/integration/user.api.test.js
 *
 * This new test file covers test cases for User Management by a Librarian.
 * Corresponds to cases from 'TC_Specific_Feature_Testing.pdf'.
 */
const request = require('supertest');
const app = require('../../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/user');

let mongoServer;
let librarianAgent;
let memberAgent;
let userToManage;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	await User.create([
		{ username: 'librarian_user', password: 'password123', role: 'Librarian', fullName: 'Lib User' },
		{ username: 'member_user', password: 'password123', role: 'Member', fullName: 'Mem User' },
	]);
	userToManage = await User.findOne({ username: 'member_user' });

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_user', password: 'password123' });

	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ username: 'member_user', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('User Management API (Librarian)', () => {
	it('TC_USER_VIEW_001: should allow a librarian to view all users', async () => {
		const res = await librarianAgent.get('/api/users');
		expect(res.statusCode).toEqual(200);
		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body.length).toBeGreaterThan(1);
	});

	it('should prevent a member from viewing all users', async () => {
		const res = await memberAgent.get('/api/users');
		expect(res.statusCode).toEqual(403);
	});

	it("TC_USER_UPDATE_001: should allow a librarian to update a user's details", async () => {
		const res = await librarianAgent.put(`/api/users/${userToManage._id}`).send({ fullName: 'Updated Member Name' });

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('fullName', 'Updated Member Name');
	});

	it('TC_USER_DEL_001: should allow a librarian to delete a user', async () => {
		const userToDelete = await User.create({ username: 'todelete', password: 'pw', role: 'Member' });
		const res = await librarianAgent.delete(`/api/users/${userToDelete._id}`);

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'User removed');

		const deletedUser = await User.findById(userToDelete._id);
		expect(deletedUser).toBeNull();
	});
});
