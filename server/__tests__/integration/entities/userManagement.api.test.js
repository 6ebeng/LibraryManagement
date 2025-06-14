/*
 * server/__tests__/integration/userManagement.api.test.js
 *
 * This new test file covers additional test cases for User Management by a Librarian.
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

// Removed: let mongoServer;

let librarianAgent;
let memberAgent;
let testMember;
let testBook;
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];
let createdBorrowalIds = [];

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	await mongoose.connect(process.env.MONGO_URI);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	// Seed Users with all required fields and set password
	const librarian = new User({
		name: 'Lib UserMgmt',
		email: 'librarian.usermgmt@example.com',
		isAdmin: true,
		photoUrl: 'http://example.com/lib_usermgmt.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	const member = new User({
		name: 'Mem UserMgmt',
		email: 'member.usermgmt@example.com',
		isAdmin: false,
		photoUrl: 'http://example.com/mem_usermgmt.jpg',
	});
	member.setPassword('password123');
	await member.save();
	createdUserIds.push(member._id);

	testMember = member; // Assign the created member to testMember

	// Agents - login with emails
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.usermgmt@example.com', password: 'password123' });
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: 'member.usermgmt@example.com', password: 'password123' });

	// Seed other data
	const author = await Author.create({ name: 'Test Author UM', description: 'Test', photoUrl: 'http://example.com/testauthor_um.jpg' });
	createdAuthorIds.push(author._id);
	const genre = await Genre.create({ name: 'Test Genre UM', description: 'Test' });
	createdGenreIds.push(genre._id);
	testBook = await Book.create({ name: 'A Book for Borrowal UM', isbn: '111-UM-B', authorId: author._id, genreId: genre._id, isAvailable: false });
	createdBookIds.push(testBook._id);
	const borrowal = await Borrowal.create({ memberId: testMember._id, bookId: testBook._id, status: 'Borrowed' });
	createdBorrowalIds.push(borrowal._id);
});

afterAll(async () => {
	try {
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
			console.log('MongoDB connection disconnected after userManagement tests.');
		}
	}
});

describe('User Management API - Additional Tests', () => {
	it('TC_USER_READ_001: (RBAC) should prevent a member from accessing user management list', async () => {
		const res = await memberAgent.get('/api/users/getAll');
		expect(res.statusCode).toEqual(403);
	});

	it('TC_USER_DELETE_001: (Referential Integrity) should prevent a librarian from deleting a member with active borrowals', async () => {
		const res = await librarianAgent.delete(`/api/users/delete/${testMember._id}`);
		expect(res.statusCode).toBe(400);
		expect(res.body.message).toMatch(/Cannot delete user with active borrowals/i);
	});
});
