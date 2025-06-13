const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user');
const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');

// Configure dotenv for environment variables. Using a robust path.
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config({ path: __dirname + '/../../.env' });
}

// --- Test Data from User ---

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

const testGenres = [
	{ name: 'Fiction', description: 'Literary works of imaginative narration, in prose or verse' },
	{ name: 'Mystery', description: 'Stories involving puzzling crimes, enigmas, or unexplained events' },
	{ name: 'Science Fiction', description: 'Fiction dealing with futuristic concepts and advanced technology' },
	{ name: 'Romance', description: 'Stories focusing on romantic relationships and love' },
	{ name: 'Biography', description: "Non-fiction accounts of real people's lives" },
];

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
		photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop',
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
		photoUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop',
		authorName: 'Jane Austen',
		genreName: 'Romance',
	},
];

// --- Seeding Logic ---

/**
 * Seeds the database with a small, well-defined set of test data.
 */
const seedCoreData = async () => {
	console.log('Seeding core data...');

	const createdGenres = await Genre.insertMany(testGenres);
	const createdAuthors = await Author.insertMany(testAuthors);

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

	console.log(`✓ Created ${createdGenres.length} genres, ${createdAuthors.length} authors, ${testUsers.length} users, and ${createdBooks.length} books.`);
	console.log('\nTest Users Created (ensure .env passwords match):');
	console.log(`- Librarian: ${process.env.TEST_LIBRARIAN_EMAIL || 'mainLibrarian@example.com'}`);
	console.log(`- Member: ${process.env.TEST_MEMBER_EMAIL || 'testmember@example.com'}`);
};

/**
 * Generates a large volume of additional dummy books for performance testing.
 * @param {number} count - The number of dummy books to generate.
 */
const generateLargeVolumeData = async (count) => {
	console.log(`Generating ${count} additional books for large volume test...`);

	const authors = [];
	for (let i = 0; i < Math.ceil(count / 10); i++) {
		authors.push({ name: `Perf Test Author ${i + 1}`, description: `Bio for perf test author ${i + 1}` });
	}
	const createdAuthors = await Author.insertMany(authors);

	const genres = [];
	for (let i = 0; i < Math.ceil(count / 100); i++) {
		genres.push({ name: `Perf Test Genre ${i + 1}`, description: 'Perf test genre' });
	}
	const createdGenres = await Genre.insertMany(genres);

	const books = [];
	for (let i = 0; i < count; i++) {
		books.push({
			name: `Perf Test Book ${i + 1}`,
			authorId: createdAuthors[i % createdAuthors.length]._id,
			genreId: createdGenres[i % createdGenres.length]._id,
			isbn: `${9781000000000 + i}`,
			isAvailable: true,
			summary: `Summary for performance test book ${i + 1}`,
			photoUrl: 'https://images.unsplash.com/photo-1543002588-b9b656603c86?w=200&h=300&fit=crop',
		});
	}

	await Book.insertMany(books);
	console.log(`✓ Created ${count} additional books.`);
};

/**
 * Main seeder function. Clears the DB and seeds data based on volume argument.
 */
const seedDatabase = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongodb:27017/library', {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('MongoDB Connected for seeding...');

		console.log('Clearing all existing data...');
		await Promise.all([User.deleteMany({}), Book.deleteMany({}), Author.deleteMany({}), Genre.deleteMany({})]);
		console.log('Data cleared.');

		const args = process.argv.slice(2);
		const volumeArg = args.find((arg) => arg.startsWith('--volume='));
		const volume = volumeArg ? volumeArg.split('=')[1] : 'small';

		console.log(`Starting to seed with '${volume}' volume settings...`);
		await seedCoreData();

		if (volume === 'large') {
			await generateLargeVolumeData(5000);
		}

		console.log('\n🎉 Database seeding completed successfully!');
	} catch (error) {
		console.error('Error during database seeding process:', error);
		process.exit(1);
	} finally {
		if (mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('MongoDB disconnected.');
		}
	}
};

if (require.main === module) {
	seedDatabase();
}

module.exports = seedDatabase;
