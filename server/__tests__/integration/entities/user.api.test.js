/*
 * server/__tests__/integration/entities/user.api.test.js
 *
 * This test file covers test cases for User Management by a Librarian.
 * Corresponds to cases from 'TC_Specific_Feature_Testing.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const User = require('../../../models/user');

let librarianAgent;
let memberAgent;
let userToManage; // This will be the member user created for management tests
let createdUserIds = [];

beforeAll(async () => {
	if (!process.env.MONGO_URI) {
		throw new Error('MONGO_URI environment variable is not set. Tests cannot connect to the database.');
	}
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for user.api tests: ${process.env.MONGO_URI}`);

	// Create a unique suffix for emails to avoid collisions during re-runs or in shared environments
	const uniqueSuffix = Date.now();

	// Create a librarian user
	const librarianData = {
		name: 'Lib UserMgmt',
		email: `librarian.usermgmt.${uniqueSuffix}@example.com`,
		isAdmin: true,
		photoUrl: 'http://example.com/lib_usermgmt.jpg',
	};
	const librarian = new User(librarianData);
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	// Create a member user to manage
	const memberData = {
		name: 'Mem UserToManage',
		email: `member.usertomanage.${uniqueSuffix}@example.com`,
		isAdmin: false,
		photoUrl: 'http://example.com/mem_usertomanage.jpg',
	};
	const member = new User(memberData);
	member.setPassword('password123');
	await member.save();
	createdUserIds.push(member._id);
	userToManage = member; // Assign the created member to userToManage

	// Login agents
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: librarianData.email, password: 'password123' });

	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: memberData.email, password: 'password123' });
});

afterAll(async () => {
	try {
		// Delete all users created during the tests
		if (createdUserIds.length > 0) {
			await User.deleteMany({ _id: { $in: createdUserIds } });
		}
		// Additional cleanup for any users specifically created in tests and not added to createdUserIds
		await User.deleteMany({ email: { $regex: /todelete\..*@example\.com/i } });
	} catch (error) {
		console.error('Error during afterAll cleanup in user.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after user.api tests.');
		}
	}
});

describe('User Management API (Librarian)', () => {
	// Test Case: TC_USER_VIEW_001
	// Objective: Verify a librarian can view all users.
	it('TC_USER_VIEW_001: should allow a librarian to view all users', async () => {
		const res = await librarianAgent.get('/api/users/getAll');
		expect(res.statusCode).toEqual(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.usersList)).toBe(true);
		// There should be at least the librarian and the member created in beforeAll
		expect(res.body.usersList.length).toBeGreaterThanOrEqual(2);
	});

	// Test Case: (Implicit from TC_USER_VIEW_001 context)
	// Objective: Verify a non-librarian (member) cannot view all users.
	it('should prevent a member from viewing all users', async () => {
		const res = await memberAgent.get('/api/users/getAll');
		// Expecting 403 Forbidden if the route is admin-protected
		expect(res.statusCode).toEqual(403);
	});

	// Test Case: TC_USER_UPDATE_001
	// Objective: Verify a librarian can update another user's details.
	it("TC_USER_UPDATE_001: should allow a librarian to update a user's details", async () => {
		const updatedName = 'Updated Member Name by Librarian';
		const updatePayload = {
			name: updatedName,
			email: userToManage.email, // Keep original email or provide a new valid one if allowed
			isAdmin: userToManage.isAdmin, // Keep original isAdmin status or change if intended
			photoUrl: userToManage.photoUrl, // Keep original photoUrl or provide new
			// DO NOT send 'password' field if not intending to change it.
		};

		const res = await librarianAgent.put(`/api/users/update/${userToManage._id}`).send(updatePayload);

		expect(res.statusCode).toEqual(200);
		expect(res.body.success).toBe(true);
		expect(res.body.updatedUser).toBeDefined();
		expect(res.body.updatedUser.name).toEqual(updatedName);

		// Optionally, verify in DB
		const dbUser = await User.findById(userToManage._id).lean();
		expect(dbUser.name).toEqual(updatedName);
	});

	// Test Case: TC_USER_DEL_001
	// Objective: Verify a librarian can delete a user (that has no blocking referential integrity).
	it('TC_USER_DEL_001: should allow a librarian to delete a user', async () => {
		const uniqueSuffixDelete = Date.now();
		const userToDeletePayload = {
			name: 'User To Be Deleted',
			email: `todelete.${uniqueSuffixDelete}@example.com`,
			isAdmin: false,
			photoUrl: 'http://example.com/todelete.jpg',
		};
		const userToDelete = new User(userToDeletePayload);
		userToDelete.setPassword('password123'); // Set a password for the new user
		await userToDelete.save();

		// Important: Add to createdUserIds for cleanup ONLY if you are sure it should be cleaned up by the main hook.
		// If the test is about deletion, this user ID might be removed by the test itself.
		// For safety, let's add it, assuming afterAll is robust.
		createdUserIds.push(userToDelete._id);

		const res = await librarianAgent.delete(`/api/users/delete/${userToDelete._id}`);

		expect(res.statusCode).toEqual(200);
		expect(res.body.success).toBe(true);
		expect(res.body.deletedUser).toBeDefined();
		expect(res.body.deletedUser.name).toEqual(userToDeletePayload.name);
		expect(res.body.deletedUser.email).toEqual(userToDeletePayload.email);

		// Verify the user is actually deleted from the database
		const deletedUserFromDb = await User.findById(userToDelete._id);
		expect(deletedUserFromDb).toBeNull();
	});
});
