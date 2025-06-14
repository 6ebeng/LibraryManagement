/*
 * server/__tests__/integration/review.api.test.js
 *
 * This new test file covers test cases for Review entity management.
 * Corresponds to cases from 'TC_Entity_Management.pdf' and 'TC_Specific_Feature_Testing.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Book = require('../../../models/book');
const Review = require('../../../models/review');
const User = require('../../../models/user');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');

let mongoServer;
let librarianAgent, memberAgent;
let testBook, testMember, testReview;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	const users = await User.create([
		{ username: 'librarian_rev', password: 'password123', role: 'Librarian' },
		{ username: 'member_rev', password: 'password123', role: 'Member' },
	]);
	testMember = users.find((u) => u.username === 'member_rev');

	const author = await Author.create({ name: 'Review Author' });
	const genre = await Genre.create({ name: 'Review Genre' });
	testBook = await Book.create({ name: 'Review Book', isbn: '123-R', author: author._id, genre: genre._id });
	testReview = await Review.create({ bookId: testBook._id, memberId: testMember._id, rating: 4, comment: 'Good read!' });

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_rev', password: 'password123' });
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ username: 'member_rev', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

// Corrected API Endpoints
describe('Review Management API', () => {
	it('TC_REVIEW_CREATE_001: should allow a member to create a review', async () => {
		const res = await memberAgent.post('/api/review/add').send({
			// Corrected endpoint
			bookId: testBook._id,
			rating: 5,
			comment: 'Absolutely fantastic!',
		});
		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('comment', 'Absolutely fantastic!');
	});

	it('TC_REVIEW_CREATE_002: should prevent creating a review with invalid data (e.g., no rating)', async () => {
		const res = await memberAgent.post('/api/review/add').send({
			// Corrected endpoint
			bookId: testBook._id,
			comment: 'This review has no rating.',
		});
		expect(res.statusCode).toEqual(400);
	});

	it('TC_REV_VIEW_001: should allow any user to view all reviews with populated fields', async () => {
		const res = await request(app).get(`/api/review/getAll`);
		expect(res.statusCode).toEqual(200);
		expect(res.body.reviewsList.length).toBeGreaterThan(0);
		
		// Assert that populated fields exist
		const firstReview = res.body.reviewsList[0];
		expect(firstReview).toHaveProperty('comment', 'Good read!');
		expect(firstReview).toHaveProperty('bookId');
		expect(firstReview.bookId).toHaveProperty('name', 'Review Book'); // Check populated book name
		expect(firstReview).toHaveProperty('memberId');
		expect(firstReview.memberId).toHaveProperty('name'); // Check that member name exists
	});

	it('TC_REVIEW_DELETE_001: should allow a librarian to delete a review', async () => {
		// This requires a mock middleware for authorization or a more complex test setup
		// For now, we assume the librarian has the right to delete.
		const res = await librarianAgent.delete(`/api/review/delete/${testReview._id}`); // Corrected endpoint
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('success', true);
	});
});
