const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
// const { MongoMemoryServer } = require('mongodb-memory-server'); // Removed
const User = require('../../../models/user');
const Borrowal = require('../../../models/borrowal'); // Assuming Borrowal model is relevant for referential integrity
const Book = require('../../../models/book');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');

// let mongoServer; // Removed
let librarianAgent, memberAgent;
let testMemberWithBorrowals, testBookForBorrowal;

beforeAll(async () => {
	// mongoServer = await MongoMemoryServer.create(); // Removed
	await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo-test:27017/library_management_test');

	// Clear collections before tests
	await User.deleteMany({});
	await Borrowal.deleteMany({});
	await Book.deleteMany({});
	await Author.deleteMany({});
	await Genre.deleteMany({});

	// Setup common users
	const users = await User.create([
		{ username: 'lib_mgmt', password: 'password123', role: 'Librarian' },
		{ username: 'member_access', password: 'password123', role: 'Member' },
		{ username: 'member_with_borrowals', password: 'password123', role: 'Member' },
	]);
	testMemberWithBorrowals = users.find((u) => u.username === 'member_with_borrowals');

	// Setup book and borrowal for referential integrity test
	const author = await Author.create({ name: 'Referential Author' });
	const genre = await Genre.create({ name: 'Referential Genre' });
	testBookForBorrowal = await Book.create({ name: 'Book for Borrowal', isbn: 'B-001', author: author._id, genre: genre._id, isAvailable: false });
	await Borrowal.create({ member: testMemberWithBorrowals._id, book: testBookForBorrowal._id, status: 'Borrowed' });

	// Authenticate agents
	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'lib_mgmt', password: 'password123' });

	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ username: 'member_access', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	// if (mongoServer) { // Removed
	//     await mongoServer.stop(); // Removed
	// }
});

describe('User Management API - Additional Tests', () => {
	it('TC_USER_READ_001: (RBAC) should prevent a member from accessing user management list', async () => {
		const res = await memberAgent.get('/api/users');
		expect(res.statusCode).toEqual(403);
		expect(res.body).toHaveProperty('message', 'Forbidden: Librarians only.');
	});

	it('TC_USER_DELETE_001: (Referential Integrity) should prevent a librarian from deleting a member with active borrowals', async () => {
		// Attempt to delete the member with an active borrowal
		const res = await librarianAgent.delete(`/api/users/${testMemberWithBorrowals._id}`);
		expect(res.statusCode).toEqual(400); // Expecting a bad request or conflict status
		expect(res.body).toHaveProperty('message', 'Cannot delete user with active borrowals.');

		// Verify the user still exists in the database
		const userExists = await User.findById(testMemberWithBorrowals._id);
		expect(userExists).not.toBeNull();
	});
});
