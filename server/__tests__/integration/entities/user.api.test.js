/*
 * server/__tests__/integration/user.api.test.js
 *
 * This new test file covers test cases for User Management by a Librarian.
 * Corresponds to cases from 'TC_Specific_Feature_Testing.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const User = require('../../../models/user');

// Removed: let mongoServer;

let librarianAgent;
let memberAgent;
let userToManage;
let createdUserIds = [];

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	// Create a librarian user
	const librarian = new User({
		name: 'Lib User',
		email: 'librarian.user@example.com',
		isAdmin: true,
		photoUrl: 'http://example.com/lib_user.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	// Create a member user to manage
	const member = new User({
		name: 'Mem User',
		email: 'member.user@example.com',
		isAdmin: false,
		photoUrl: 'http://example.com/mem_user.jpg',
	});
	member.setPassword('password123');
	await member.save();
	createdUserIds.push(member._id);

	userToManage = member; // The member user created

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.user@example.com', password: 'password123' });

	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: 'member.user@example.com', password: 'password123' });
});

afterAll(async () => {
	try {
		await User.deleteMany({ _id: { $in: createdUserIds } });
		// Clean up any users created within individual tests as well
		await User.deleteMany({ email: 'todelete@example.com' });
	} catch (error) {
		console.error('Error during afterAll cleanup in user.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after user tests.');
		}
	}
});

describe('User Management API (Librarian)', () => {
	it('TC_USER_VIEW_001: should allow a librarian to view all users', async () => {
		const res = await librarianAgent.get('/api/users/getAll');
		expect(res.statusCode).toEqual(200);
		expect(Array.isArray(res.body.usersList)).toBe(true);
		expect(res.body.usersList.length).toBeGreaterThan(1);
	});

	it('should prevent a member from viewing all users', async () => {
		const res = await memberAgent.get('/api/users/getAll');
		expect(res.statusCode).toEqual(403);
	});

	it("TC_USER_UPDATE_001: should allow a librarian to update a user's details", async () => {
		const res = await librarianAgent
			.put(`/api/users/update/${userToManage._id}`)
			.send({ name: 'Updated Member Name', email: userToManage.email, isAdmin: userToManage.isAdmin, photoUrl: userToManage.photoUrl });
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('updatedUser.name', 'Updated Member Name');
	});

	it('TC_USER_DEL_001: should allow a librarian to delete a user', async () => {
		const userToDelete = new User({
			name: 'User To Delete',
			email: 'todelete@example.com',
			isAdmin: false,
			photoUrl: 'http://example.com/todelete.jpg',
		});
		userToDelete.setPassword('pw');
		await userToDelete.save();
		createdUserIds.push(userToDelete._id); // Add to cleanup list

		const res = await librarianAgent.delete(`/api/users/delete/${userToDelete._id}`);

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('deletedUser.name', 'User To Delete');

		const deletedUser = await User.findById(userToDelete._id);
		expect(deletedUser).toBeNull();
	});
});
