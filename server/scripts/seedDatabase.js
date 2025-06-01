// LibraryManagement/server/scripts/seedDatabase.js
const mongoose = require('mongoose');
const User = require('../models/user');
const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');

// Configure dotenv for environment variables
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

// Test Users Data
const testUsers = [
	{
		name: process.env.TEST_LIBRARIAN_FULLNAME,
		email: process.env.TEST_LIBRARIAN_EMAIL,
		isAdmin: true,
		photoUrl: 'http://example.com/default.jpg',
		password: process.env.TEST_LIBRARIAN_PASSWORD,
	},
	{
		name: process.env.TEST_MEMBER_FULLNAME,
		email: process.env.TEST_MEMBER_EMAIL,
		isAdmin: false,
		photoUrl: 'http://example.com/member.jpg',
		password: process.env.TEST_MEMBER_PASSWORD,
	},
];

// Test Genres Data
const testGenres = [
	{
		name: 'Fiction',
		description: 'Literary works of imaginative narration, in prose or verse',
	},
	{
		name: 'Mystery',
		description: 'Stories involving puzzling crimes, enigmas, or unexplained events',
	},
	{
		name: 'Science Fiction',
		description: 'Fiction dealing with futuristic concepts and advanced technology',
	},
	{
		name: 'Romance',
		description: 'Stories focusing on romantic relationships and love',
	},
	{
		name: 'Biography',
		description: "Non-fiction accounts of real people's lives",
	},
];

// Test Authors Data
const testAuthors = [
	{
		name: 'Agatha Christie',
		description: 'British crime writer known for her detective novels featuring Hercule Poirot and Miss Marple',
		photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
	},
	{
		name: 'Isaac Asimov',
		description: 'American writer and professor of biochemistry, known for his science fiction works',
		photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
	},
	{
		name: 'Jane Austen',
		description: 'English novelist known for her social commentary and romantic fiction',
		photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
	},
	{
		name: 'Harper Lee',
		description: 'American novelist best known for To Kill a Mockingbird',
		photoUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
	},
	{
		name: 'George Orwell',
		description: 'English novelist and essayist, known for his dystopian fiction',
		photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
	},
];

// Test Books Data (will be populated with author and genre IDs after creation)
const testBooksTemplate = [
	{
		name: 'Murder on the Orient Express',
		isbn: '978-0-00-711928-5',
		isAvailable: true,
		summary: 'A classic detective novel featuring Hercule Poirot solving a murder on a luxury train.',
		photoUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop',
		authorName: 'Agatha Christie',
		genreName: 'Mystery',
	},
	{
		name: 'Foundation',
		isbn: '978-0-553-29335-0',
		isAvailable: true,
		summary: "The first novel in Asimov's acclaimed Foundation series about the future of humanity.",
		photoUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop',
		authorName: 'Isaac Asimov',
		genreName: 'Science Fiction',
	},
	{
		name: 'Pride and Prejudice',
		isbn: '978-0-14-143951-8',
		isAvailable: true,
		summary: 'A romantic novel about Elizabeth Bennet and Mr. Darcy in 19th century England.',
		photoUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=300&fit=crop',
		authorName: 'Jane Austen',
		genreName: 'Romance',
	},
	{
		name: 'To Kill a Mockingbird',
		isbn: '978-0-06-112008-4',
		isAvailable: true,
		summary: 'A novel about racial injustice and childhood innocence in the American South.',
		photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop', // Note: URL seems duplicated
		authorName: 'Harper Lee',
		genreName: 'Fiction',
	},
	{
		name: '1984',
		isbn: '978-0-452-28423-4',
		isAvailable: true,
		summary: 'A dystopian novel about totalitarian control and surveillance in a future society.',
		photoUrl: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=200&h=300&fit=crop',
		authorName: 'George Orwell',
		genreName: 'Fiction',
	},
	{
		name: 'The ABC Murders',
		isbn: '978-0-00-711929-2',
		isAvailable: false,
		summary: 'Another Hercule Poirot mystery involving a series of murders following the alphabet.',
		photoUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=200&h=300&fit=crop',
		authorName: 'Agatha Christie',
		genreName: 'Mystery',
	},
	{
		name: 'I, Robot',
		isbn: '978-0-553-29438-8',
		isAvailable: true,
		summary: 'A collection of short stories about robots and artificial intelligence.',
		photoUrl: 'https://images.unsplash.com/photo-1485988412941-77a35537dae4?w=200&h=300&fit=crop',
		authorName: 'Isaac Asimov',
		genreName: 'Science Fiction',
	},
	{
		name: 'Emma',
		isbn: '978-0-14-143977-8',
		isAvailable: true,
		summary: 'A comedy of manners about a young woman who fancies herself a matchmaker.',
		photoUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop', // Note: URL seems duplicated
		authorName: 'Jane Austen',
		genreName: 'Romance',
	},
];

const seedDatabase = async () => {
	let connectionClosed = false; // Renamed from connectionClosedBySeeder for clarity within this script

	// Helper to close the Mongoose connection initiated by this script
	const closeCurrentConnection = async () => {
		if (mongoose.connection.readyState === 1 && !connectionClosed) {
			try {
				await mongoose.connection.close();
				console.log('Database connection closed by seeder script.');
				connectionClosed = true;
			} catch (error) {
				console.error('Error closing connection in seeder script:', error);
				// Decide if to throw, but usually logging is sufficient here
			}
		}
	};

	try {
		if (mongoose.connection.readyState !== 1) {
			await mongoose.connect(process.env.MONGO_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			});
			console.log(`Connected to MongoDB for seeding: ${process.env.MONGO_URI}`);
		} else {
			console.log(`Using existing MongoDB connection for seeding: ${mongoose.connection.name}`);
		}
		connectionClosed = false; // Reset flag for current execution

		const existingUsers = await User.countDocuments();
		const existingBooks = await Book.countDocuments();

		if (existingUsers > 0 || existingBooks > 0) {
			console.log('Database already contains data. Skipping seeding...');
			// No explicit return here, allow finally block to close connection
		} else {
			await Promise.all([User.deleteMany({}), Book.deleteMany({}), Author.deleteMany({}), Genre.deleteMany({})]);
			console.log('Cleared existing data...');

			console.log('Seeding genres...');
			const createdGenres = await Genre.insertMany(testGenres);
			console.log(`✓ Created ${createdGenres.length} genres`);

			console.log('Seeding authors...');
			const createdAuthors = await Author.insertMany(testAuthors);
			console.log(`✓ Created ${createdAuthors.length} authors`);

			console.log('Seeding users...');
			for (const userData of testUsers) {
				const user = new User({
					name: userData.name,
					email: userData.email,
					isAdmin: userData.isAdmin,
					photoUrl: userData.photoUrl,
				});
				user.setPassword(userData.password);
				await user.save();
			}
			console.log(`✓ Created ${testUsers.length} users`);

			console.log('Seeding books...');
			const booksToSeed = testBooksTemplate.map((bookTemplate) => {
				const author = createdAuthors.find((a) => a.name === bookTemplate.authorName);
				const genre = createdGenres.find((g) => g.name === bookTemplate.genreName);
				return {
					name: bookTemplate.name,
					isbn: bookTemplate.isbn,
					authorId: author ? author._id : null,
					genreId: genre ? genre._id : null,
					isAvailable: bookTemplate.isAvailable,
					summary: bookTemplate.summary,
					photoUrl: bookTemplate.photoUrl,
				};
			});
			const createdBooks = await Book.insertMany(booksToSeed);
			console.log(`✓ Created ${createdBooks.length} books`);

			console.log('\n🎉 Database seeding completed successfully!');
			console.log('\nTest Users Created (ensure .env passwords match):');
			console.log(`- Librarian: ${process.env.TEST_LIBRARIAN_EMAIL || 'mainLibrarian@example.com'}`);
			console.log(`- Member: ${process.env.TEST_MEMBER_EMAIL || 'testmember@example.com'}`);
			console.log(`\nCreated ${createdBooks.length} books with authors and genres`);
		}
	} catch (error) {
		console.error('Error during database seeding process:', error);
		// Allow finally block to close connection and then re-throw
		throw error;
	} finally {
		// Always attempt to close the connection made by this script before exiting.
		// The main server (index.js) will establish its own separate connection.
		await closeCurrentConnection();
	}
};

// Handling direct execution:
// This block allows the script to be run directly (e.g., `node seedDatabase.js`).
// It ensures the script exits with an appropriate code after completion or error.
if (require.main === module) {
	seedDatabase()
		.then(() => {
			console.log(`Seeding script finished operation (E2E_TESTING: ${process.env.E2E_TESTING}). Script will now exit naturally.`);
			// Node.js will exit with code 0 by default if the promise resolves.
		})
		.catch((error) => {
			console.error('Seeding script failed:', error.message);
			process.exitCode = 1; // Set exit code to 1 for errors. Node.js will exit with this code.
		});
}

module.exports = seedDatabase;
