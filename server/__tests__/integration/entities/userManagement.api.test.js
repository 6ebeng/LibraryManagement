/*
 * server/__tests__/integration/entities/userManagement.api.test.js
 *
 * This test file covers additional test cases for User Management by a Librarian,
 * focusing on RBAC and referential integrity.
 * Corresponds to cases from 'TC_Entity_Management.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const User = require('../../../models/user');
const Borrowal = require('../../../models/borrowal');
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');

let librarianAgent;
let memberAgent;
let testMemberWithBorrowal; // Renamed for clarity
let testBookForUserManagement; // Renamed for clarity
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];
let createdBorrowalIds = [];

beforeAll(async () => {
	if (!process.env.MONGO_URI) {
		throw new Error('MONGO_URI environment variable is not set. Tests cannot connect to the database.');
	}
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for userManagement.api tests: ${process.env.MONGO_URI}`);

	// Unique suffix for emails to avoid conflicts
	const uniqueSuffix = Date.now();

	// Seed Users
	const librarianData = {
		name: 'Lib UserMgmtMain', // Unique name
		email: `librarian.usermgmtmain.${uniqueSuffix}@example.com`, // Unique email
		isAdmin: true,
		photoUrl: 'http://example.com/lib_usermgmtmain.jpg',
	};
	const librarian = new User(librarianData);
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	const memberData = {
		name: 'Mem UserWithBorrowal', // Unique name
		email: `member.userwithborrowal.${uniqueSuffix}@example.com`, // Unique email
		isAdmin: false,
		photoUrl: 'http://example.com/mem_userwithborrowal.jpg',
	};
	const member = new User(memberData);
	member.setPassword('password123');
	await member.save();
	createdUserIds.push(member._id);
	testMemberWithBorrowal = member; // This member will have an active borrowal

	// Login Agents
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: librarianData.email, password: 'password123' });
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: memberData.email, password: 'password123' });

	// Seed other data necessary for creating an active borrowal for testMemberWithBorrowal
	const author = await Author.create({ name: `Test Author UM ${uniqueSuffix}`, description: 'Test', photoUrl: 'http://example.com/testauthor_um.jpg' });
	createdAuthorIds.push(author._id);
	const genre = await Genre.create({ name: `Test Genre UM ${uniqueSuffix}`, description: 'Test' });
	createdGenreIds.push(genre._id);

	testBookForUserManagement = await Book.create({
		name: 'A Book for Borrowal UM Test',
		isbn: `111-UM-B-${uniqueSuffix}`, // Unique ISBN
		authorId: author._id,
		genreId: genre._id,
		isAvailable: false, // Mark as unavailable as it will be borrowed
	});
	createdBookIds.push(testBookForUserManagement._id);

	const borrowal = await Borrowal.create({
		memberId: testMemberWithBorrowal._id,
		bookId: testBookForUserManagement._id,
		status: 'Borrowed', // Active borrowal
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
	} catch (error) {
		console.error('Error during afterAll cleanup in userManagement.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after userManagement.api tests.');
		}
	}
});

describe('User Management API - Additional Tests', () => {
	// Test Case: TC_USER_READ_001 (RBAC)
	// Objective: Verify that a non-admin member cannot access the list of all users.
	it('TC_USER_READ_001: (RBAC) should prevent a member from accessing user management list', async () => {
		const res = await memberAgent.get('/api/users/getAll');
		// Expect 403 Forbidden if the route is protected and user is not authorized
		expect(res.statusCode).toEqual(403);
		// Optionally, check for a specific error message or structure if your API provides one
		// For example: if(res.body.message) expect(res.body.message).toMatch(/Access denied/i);
	});

	// Test Case: TC_USER_DELETE_001 (Referential Integrity)
	// Objective: Verify that a librarian cannot delete a member who has active borrowals.
	it('TC_USER_DELETE_001: (Referential Integrity) should prevent a librarian from deleting a member with active borrowals', async () => {
		// Attempt to delete testMemberWithBorrowal, who has an active borrowal
		const res = await librarianAgent.delete(`/api/users/delete/${testMemberWithBorrowal._id}`);

		// Expect 400 Bad Request (or a similar error code like 409 Conflict)
		expect(res.statusCode).toBe(400);
		// The exact message depends on your userController's implementation.
		expect(res.body.message).toMatch(/Cannot delete user with active borrowals/i);

		// Verify the user still exists in the database
		const userCheck = await User.findById(testMemberWithBorrowal._id);
		expect(userCheck).not.toBeNull();
	});
});
