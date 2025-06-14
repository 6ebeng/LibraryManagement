// Import required modules
const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Import routers
const authRouter = require('./routes/authRouter');
const bookRouter = require('./routes/bookRouter');
const authorRouter = require('./routes/authorRouter');
const borrowalRouter = require('./routes/borrowalRouter');
const genreRouter = require('./routes/genreRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');

// Configure dotenv for environment variables
if (process.env.NODE_ENV !== 'production') {
	// Load test environment if NODE_ENV is test, otherwise load default .env
	const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
	require('dotenv').config({ path: envFile });
}

// Setup express
const app = express();
const PORT = process.env.PORT || 8080;

// Use morgan for logging, but not in test environment to keep logs cleaner
if (process.env.NODE_ENV !== 'test') {
	app.use(logger('dev'));
}

// Set middleware to process form data
app.use(express.urlencoded({ extended: false }));

// Connect to DB
const mongoose = require('mongoose');
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		// Updated logging for clarity
		if (process.env.NODE_ENV === 'test' || process.env.E2E_TESTING === 'true') {
			console.log(`Connected to test DB: ${process.env.MONGO_URI}`);
		} else {
			console.log(`Connected to DB: ${process.env.MONGO_URI}`); // Or keep the Atlas message if it's always Atlas for non-test
		}
	})
	.catch((err) => console.log('DB connection error', err));

// Configure CORS
let corsOptions;
// When NODE_ENV is 'test' (as set for backend-e2e in docker-compose.test.yml)
if (process.env.NODE_ENV === 'test') {
	const allowedTestOrigins = [
		'http://localhost:3000', // For local client development against test backend
		'http://frontend-e2e:3000', // For Cypress E2E tests
	];
	corsOptions = {
		origin: (origin, callback) => {
			if (!origin || allowedTestOrigins.indexOf(origin) !== -1) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS for test environment'));
			}
		},
		credentials: true,
	};
} else {
	// Default CORS for development/production
	corsOptions = {
		origin: 'http://localhost:3000', // Or your production frontend URL
		credentials: true,
	};
}
app.use(cors(corsOptions));

// Set middleware to manage sessions
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true,
	})
);

// Parse cookies used for session management
app.use(cookieParser(process.env.SESSION_SECRET));

// Parse JSON objects in request bodies
app.use(express.json());

// Use passport authentication middleware
app.use(passport.initialize());
app.use(passport.session());

// Initialise passport as authentication middleware
const initializePassport = require('./passport-config');
initializePassport(passport);

// Implement routes for REST API
app.use('/api/auth', authRouter);
app.use('/api/book', bookRouter);
app.use('/api/author', authorRouter);
app.use('/api/borrowal', borrowalRouter);
app.use('/api/genre', genreRouter);
app.use('/api/user', userRouter);
app.use('/api/review', reviewRouter);
app.get('/api/health', (req, res) => {
	console.log('HEALTH CHECK: /api/health endpoint was hit at', new Date().toISOString());
	try {
		res.status(200).send('Backend is healthy');
		console.log('HEALTH CHECK: Responded 200 OK at', new Date().toISOString());
	} catch (e) {
		console.error('HEALTH CHECK: Error within /api/health route:', e);
		res.status(500).send('Error processing health check');
	}
});

app.get('/', (req, res) => res.send('Welcome to Library Management System'));

// Start server only if not in test mode (Jest/Supertest will start it)
// OR if explicitly running E2E tests that might need the server started externally.
if (process.env.NODE_ENV !== 'test' || process.env.E2E_TESTING === 'true') {
	app.listen(PORT, () => console.log(`Server listening on port ${PORT} for ${process.env.NODE_ENV} (E2E: ${process.env.E2E_TESTING})!`));
}

module.exports = app;
