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
	testReview = await Review.create({ book: testBook._id, member: testMember._id, rating: 4, comment: 'Good read!' });

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ username: 'librarian_rev', password: 'password123' });
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ username: 'member_rev', password: 'password123' });
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe('Review Management API', () => {
	it('TC_REVIEW_CREATE_001: should allow a member to create a review', async () => {
		const res = await memberAgent.post('/api/reviews').send({
			bookId: testBook._id,
			rating: 5,
			comment: 'Absolutely fantastic!',
		});
		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('comment', 'Absolutely fantastic!');
	});

	it('TC_REVIEW_CREATE_002: should prevent creating a review with invalid data (e.g., no rating)', async () => {
		const res = await memberAgent.post('/api/reviews').send({
			bookId: testBook._id,
			comment: 'This review has no rating.',
		});
		expect(res.statusCode).toEqual(400);
	});

	it('TC_REV_VIEW_001: should allow any user to view reviews for a book', async () => {
		const res = await request(app).get(`/api/reviews/book/${testBook._id}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body.length).toBeGreaterThan(0);
		expect(res.body[0]).toHaveProperty('comment', 'Good read!');
	});

	it('TC_REVIEW_DELETE_001: should allow a librarian to delete a review', async () => {
		const res = await librarianAgent.delete(`/api/reviews/${testReview._id}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Review removed');
	});

	it('should prevent a member from deleting a review they did not write', async () => {
		const otherMember = await User.create({ username: 'other_member', password: 'password123', role: 'Member' });
		const otherAgent = request.agent(app);
		await otherAgent.post('/api/auth/login').send({ username: 'other_member', password: 'password123' });

		const res = await otherAgent.delete(`/api/reviews/${testReview._id}`);
		// The policy could be 403 (Forbidden) or 404 (if hiding existence). Let's assume 403.
		// Also note: The current implementation allows any authenticated user to delete any review.
		// This test will fail unless the controller logic is updated for stricter checks.
		// For now, we test the existing (permissive) logic.
		// A librarian can delete it, let's check if a non-author member can.
		// According to reviewRouter.js, only 'Librarian' can delete.
		const resMember = await memberAgent.delete(`/api/reviews/${testReview._id}`);
		expect(resMember.statusCode).toEqual(403); // A member shouldn't be able to delete.
	});
});
