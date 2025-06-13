/*
 * server/__tests__/unit/authController.test.js
 *
 * This file contains unit tests for the authController.
 * It tests user registration, login, and logout functionalities
 * by mocking the User model and passport.
 */
const authController = require('../../controllers/authController');
const User = require('../../models/user');
const passport = require('passport');

// Mock the User model
jest.mock('../../models/user');
// Mock passport
jest.mock('passport', () => ({
	authenticate: jest.fn((strategy, callback) => (req, res, next) => {
		// This mock simulates the passport.authenticate middleware
		// We will call the callback to control the outcome of authentication
		req.logIn = jest.fn((user, cb) => cb());

		if (req.body.username === 'testuser' && req.body.password === 'password') {
			callback(null, { _id: '123', username: 'testuser' }, null);
		} else if (req.body.username === 'nouser') {
			callback(null, false, { message: 'Incorrect username.' });
		} else {
			callback(new Error('Auth error'), false);
		}
	}),
}));

describe('Auth Controller - Unit Tests', () => {
	let req, res, next;

	beforeEach(() => {
		req = {
			body: {},
			logIn: jest.fn((user, done) => done()),
			logout: jest.fn((cb) => cb()),
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			send: jest.fn(),
			redirect: jest.fn(),
		};
		next = jest.fn();
	});

	describe('registerUser', () => {
		it('should register a new user successfully', async () => {
			req.body = { username: 'newuser', email: 'new@test.com', password: 'password', fullName: 'New User' };
			User.findOne.mockResolvedValue(null);
			User.create.mockResolvedValue({ _id: '1', ...req.body });

			await authController.registerUser(req, res);

			expect(User.findOne).toHaveBeenCalledWith({ $or: [{ username: 'newuser' }, { email: 'new@test.com' }] });
			expect(User.create).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully' });
		});

		it('should return 400 if user already exists', async () => {
			req.body = { username: 'existing', email: 'existing@test.com' };
			User.findOne.mockResolvedValue({ username: 'existing' });

			await authController.registerUser(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'Username or email already exists' });
		});
	});

	describe('loginUser', () => {
		it('should login a user successfully', () => {
			req.body = { username: 'testuser', password: 'password' };

			const middleware = authController.loginUser;
			middleware(req, res, next);

			expect(passport.authenticate).toHaveBeenCalled();
			expect(req.logIn).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: 'Logged in successfully', user: { _id: '123', username: 'testuser' } });
		});

		it('should return 401 for invalid credentials', () => {
			req.body = { username: 'nouser', password: 'wrongpassword' };

			const middleware = authController.loginUser;
			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ message: 'Incorrect username.' });
		});
	});

	describe('logoutUser', () => {
		it('should log out the user and respond with a success message', () => {
			authController.logoutUser(req, res);

			expect(req.logout).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
		});
	});
});
