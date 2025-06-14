/*
 * server/__tests__/integration/review.api.test.js
 *
 * This new test file covers test cases for Review entity management.
 * Corresponds to cases from 'TC_Entity_Management.pdf' and 'TC_Specific_Feature_Testing.pdf'.
 */
const request = require('supertest');
const app = require('../../../index');
const mongoose = require('mongoose');
const Book = require('../../../models/book');
const Review = require('../../../models/review');
const User = require('../../../models/user');
const Author = require('../../../models/author');
const Genre = require('../../../models/genre');

// Removed: let mongoServer;

let librarianAgent, memberAgent;
let testBook, testMember, testReview;
let createdUserIds = [];
let createdAuthorIds = [];
let createdGenreIds = [];
let createdBookIds = [];
let createdReviewIds = [];

beforeAll(async () => {
	// Connect to the external MongoDB instance specified by MONGO_URI
	const mongoUri = process.env.MONGO_URI;
	await mongoose.connect(mongoUri);
	console.log(`Connected to MongoDB for tests: ${process.env.MONGO_URI}`);

	const librarian = new User({
		name: 'librarian_rev',
		email: 'librarian.rev@example.com',
		password: 'password123',
		isAdmin: true,
		photoUrl: 'http://example.com/librarian_rev.jpg',
	});
	librarian.setPassword('password123');
	await librarian.save();
	createdUserIds.push(librarian._id);

	const member = new User({ name: 'member_rev', email: 'member.rev@example.com', password: 'password123', isAdmin: false, photoUrl: 'http://example.com/member_rev.jpg' });
	member.setPassword('password123');
	await member.save();
	createdUserIds.push(member._id);
	testMember = member;

	const author = await Author.create({ name: 'Review Author', description: 'Review Author', photoUrl: 'http://example.com/review_author.jpg' });
	createdAuthorIds.push(author._id);
	const genre = await Genre.create({ name: 'Review Genre', description: 'Review Genre' });
	createdGenreIds.push(genre._id);
	testBook = await Book.create({ name: 'Review Book', isbn: '123-R', authorId: author._id, genreId: genre._id });
	createdBookIds.push(testBook._id);
	testReview = await Review.create({ bookId: testBook._id, memberId: testMember._id, rating: 4, comment: 'Good read!' });
	createdReviewIds.push(testReview._id);

	librarianAgent = request.agent(app);
	await librarianAgent.post('/api/auth/login').send({ email: 'librarian.rev@example.com', password: 'password123' });
	memberAgent = request.agent(app);
	await memberAgent.post('/api/auth/login').send({ email: 'member.rev@example.com', password: 'password123' });
});

afterAll(async () => {
	try {
		await Review.deleteMany({ _id: { $in: createdReviewIds } });
		await Book.deleteMany({ _id: { $in: createdBookIds } });
		await Author.deleteMany({ _id: { $in: createdAuthorIds } });
		await Genre.deleteMany({ _id: { $in: createdGenreIds } });
		await User.deleteMany({ _id: { $in: createdUserIds } });
	} catch (error) {
		console.error('Error during afterAll cleanup in review.api.test.js:', error.message);
	} finally {
		if (mongoose.connection && mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB connection disconnected after review tests.');
		}
	}
});

// Corrected API Endpoints
describe('Review Management API', () => {
	it('TC_REVIEW_CREATE_001: should allow a member to create a review', async () => {
		const res = await memberAgent.post('/api/reviews/add').send({
			// Corrected endpoint
			bookId: testBook._id,
			rating: 5,
			comment: 'Absolutely fantastic!',
			memberId: testMember._id, // Added memberId as it's required by the controller
		});
		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('review.comment', 'Absolutely fantastic!');
	});

	it('TC_REVIEW_CREATE_002: should prevent creating a review with invalid data (e.g., no rating)', async () => {
		const res = await memberAgent.post('/api/reviews/add').send({
			// Corrected endpoint
			bookId: testBook._id,
			comment: 'This review has no rating.',
			memberId: testMember._id, // Added memberId
		});
		expect(res.statusCode).toEqual(400);
	});

	it('TC_REV_VIEW_001: should allow any user to view all reviews with populated fields', async () => {
		const res = await request(app).get(`/api/reviews/getAll/${testBook._id}`); // Corrected endpoint to get reviews for a specific book
		expect(res.statusCode).toEqual(200);
		expect(res.body.reviewList.length).toBeGreaterThan(0);

		// Assert that populated fields exist
		const firstReview = res.body.reviewList[0];
		expect(firstReview).toHaveProperty('comment', 'Good read!');
		expect(firstReview).toHaveProperty('bookId');
		expect(firstReview.bookId.toString()).toEqual(testBook._id.toString()); // Check bookId directly
		expect(firstReview).toHaveProperty('memberId');
		expect(firstReview.memberId).toHaveProperty('name'); // Check that member name exists
	});

	it('TC_REVIEW_DELETE_001: should allow a librarian to delete a review', async () => {
		// This requires a mock middleware for authorization or a more complex test setup
		// For now, we assume the librarian has the right to delete.
		const res = await librarianAgent.delete(`/api/reviews/delete/${testReview._id}`); // Corrected endpoint
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('success', true);
	});
});
