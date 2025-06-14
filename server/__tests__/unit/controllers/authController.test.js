/**
 * White-Box Unit Tests for Auth Controller
 * File: server/__tests__/unit/controllers/authController.test.js
 * 
 * Tests internal logic, validation flows, and error handling of auth controller
 * Coverage: Input validation, database interactions, authentication logic
 */

const authController = require('../../../controllers/authController');
const User = require('../../../models/user');
const passport = require('passport');
const { errorMessages } = require('../../../utils/errorMessages');

// Mock dependencies
jest.mock('../../../models/user');
jest.mock('passport');

describe('Auth Controller - White-Box Testing', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      body: {},
      logIn: jest.fn()
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('registerUser - White-Box Testing', () => {
    describe('Input Validation Logic', () => {
      test('TC_WB_AUTH_001: Should validate email field first', async () => {
        mockReq.body = {
          password: 'validpassword123',
          name: 'Test User'
        };

        await authController.registerUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.user.emailRequired
        });
      });

      test('TC_WB_AUTH_002: Should validate password field after email', async () => {
        mockReq.body = {
          email: 'test@example.com',
          name: 'Test User'
        };

        await authController.registerUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.user.passwordRequired
        });
      });

      test('TC_WB_AUTH_003: Should validate name field after password', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'validpassword123'
        };

        await authController.registerUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.user.nameRequired
        });
      });

      test('TC_WB_AUTH_004: Should validate password length after required fields', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'short',
          name: 'Test User'
        };

        await authController.registerUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.user.weakPassword
        });
      });

      test('TC_WB_AUTH_005: Should pass validation with valid inputs', async () => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'validpassword123',
          name: 'Test User'
        };

        // Mock User.findOne to return null (user doesn't exist)
        User.findOne.mockImplementation((query, callback) => {
          callback(null, null);
        });

        // Mock User constructor and save
        const mockUserInstance = {
          setPassword: jest.fn(),
          save: jest.fn((callback) => callback(null, { id: 1, name: 'Test User' }))
        };
        User.mockImplementation(() => mockUserInstance);

        await authController.registerUser(mockReq, mockRes);

        // Should proceed to database operations
        expect(User.findOne).toHaveBeenCalled();
      });
    });

    describe('Database Interaction Logic', () => {
      beforeEach(() => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'validpassword123',
          name: 'Test User'
        };
      });

      test('TC_WB_AUTH_006: Should handle database error during user lookup', async () => {
        const dbError = new Error('Database connection failed');
        User.findOne.mockImplementation((query, callback) => {
          callback(dbError, null);
        });

        await authController.registerUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.general.databaseError
        });
      });

      test('TC_WB_AUTH_007: Should handle existing user scenario', async () => {
        const existingUser = { id: 1, email: 'test@example.com' };
        User.findOne.mockImplementation((query, callback) => {
          callback(null, existingUser);
        });

        await authController.registerUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.auth.userAlreadyExists
        });
      });

      test('TC_WB_AUTH_008: Should create new user when user does not exist', async () => {
        User.findOne.mockImplementation((query, callback) => {
          callback(null, null);
        });

        const mockUserInstance = {
          setPassword: jest.fn(),
          save: jest.fn((callback) => callback(null, { id: 1, name: 'Test User' }))
        };
        User.mockImplementation(() => mockUserInstance);

        await authController.registerUser(mockReq, mockRes);

        expect(User).toHaveBeenCalledWith(mockReq.body);
        expect(mockUserInstance.setPassword).toHaveBeenCalledWith('validpassword123');
        expect(mockUserInstance.save).toHaveBeenCalled();
      });

      test('TC_WB_AUTH_009: Should handle user save error', async () => {
        User.findOne.mockImplementation((query, callback) => {
          callback(null, null);
        });

        const saveError = new Error('Save failed');
        const mockUserInstance = {
          setPassword: jest.fn(),
          save: jest.fn((callback) => callback(saveError, null))
        };
        User.mockImplementation(() => mockUserInstance);

        await authController.registerUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.user.createFailed
        });
      });

      test('TC_WB_AUTH_010: Should return success when user is created', async () => {
        User.findOne.mockImplementation((query, callback) => {
          callback(null, null);
        });

        const newUser = { id: 1, name: 'Test User', email: 'test@example.com' };
        const mockUserInstance = {
          setPassword: jest.fn(),
          save: jest.fn((callback) => callback(null, newUser))
        };
        User.mockImplementation(() => mockUserInstance);

        await authController.registerUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          user: newUser,
          message: 'User account created successfully'
        });
      });
    });
  });

  describe('loginUser - White-Box Testing', () => {
    describe('Input Validation Logic', () => {
      test('TC_WB_AUTH_008: Should validate email field first', async () => {
        mockReq.body = {
          password: 'validpassword123'
        };

        await authController.loginUser(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.auth.emailRequired
        });
      });

      test('TC_WB_AUTH_009: Should validate password field after email', async () => {
        mockReq.body = {
          email: 'test@example.com'
        };

        await authController.loginUser(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.auth.passwordRequired
        });
      });
    });

    describe('Authentication Logic', () => {
      beforeEach(() => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'validpassword123'
        };
      });

      test('TC_WB_AUTH_010: Should handle user not found scenario', async () => {
        User.findOne.mockImplementation((query, callback) => {
          callback(null, null);
        });

        await authController.loginUser(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.auth.userNotFound
        });
      });

      test('TC_WB_AUTH_011: Should validate password when user exists', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          isValidPassword: jest.fn().mockReturnValue(false)
        };

        User.findOne.mockImplementation((query, callback) => {
          callback(null, mockUser);
        });

        await authController.loginUser(mockReq, mockRes, mockNext);

        expect(mockUser.isValidPassword).toHaveBeenCalledWith('validpassword123');
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.auth.incorrectPassword
        });
      });
    });

    describe('Passport Integration Logic', () => {
      beforeEach(() => {
        mockReq.body = {
          email: 'test@example.com',
          password: 'validpassword123'
        };

        const mockUser = {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          isValidPassword: jest.fn().mockReturnValue(true)
        };

        User.findOne.mockImplementation((query, callback) => {
          callback(null, mockUser);
        });
      });

      test('TC_WB_AUTH_017: Should handle passport authentication error', async () => {
        const passportError = new Error('Passport error');
        
        passport.authenticate.mockImplementation((strategy, callback) => {
          return (req, res, next) => {
            callback(passportError, null, null);
          };
        });

        await authController.loginUser(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.general.serverError
        });
      });

      test('TC_WB_AUTH_018: Should handle login session error', async () => {
        const sessionError = new Error('Session error');
        const mockUser = { id: 1, name: 'Test User' };

        passport.authenticate.mockImplementation((strategy, callback) => {
          return (req, res, next) => {
            callback(null, mockUser, null);
          };
        });

        mockReq.logIn.mockImplementation((user, callback) => {
          callback(sessionError);
        });

        await authController.loginUser(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: errorMessages.general.serverError
        });
      });

      test('TC_WB_AUTH_019: Should return success on successful login', async () => {
        const mockUser = { id: 1, name: 'Test User' };

        passport.authenticate.mockImplementation((strategy, callback) => {
          return (req, res, next) => {
            callback(null, mockUser, null);
          };
        });

        mockReq.logIn.mockImplementation((user, callback) => {
          callback(null);
        });

        await authController.loginUser(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          user: mockUser,
          message: `Welcome back, ${mockUser.name}!`
        });
      });
    });
  });

  describe('logoutUser - White-Box Testing', () => {
    test('TC_WB_AUTH_012: Should handle logout error', async () => {
      const logoutError = new Error('Logout failed');
      mockReq.logout = jest.fn((callback) => {
        callback(logoutError);
      });

      await authController.logoutUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to logout. Please try again.'
      });
    });

    test('TC_WB_AUTH_013: Should return success on successful logout', async () => {
      mockReq.logout = jest.fn((callback) => {
        callback(null);
      });

      await authController.logoutUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'You have been successfully logged out'
      });
    });

    test('TC_WB_AUTH_014: Should call req.logout with callback function', async () => {
      mockReq.logout = jest.fn();

      await authController.logoutUser(mockReq, mockRes, mockNext);

      expect(mockReq.logout).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('TC_WB_AUTH_015: Should handle malformed request body', async () => {
      mockReq.body = null;

      await authController.registerUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessages.user.emailRequired
      });
    });

    test('TC_WB_AUTH_016: Should handle empty string inputs', async () => {
      mockReq.body = {
        email: '',
        password: '',
        name: ''
      };

      await authController.registerUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessages.user.emailRequired
      });
    });

    test('TC_WB_AUTH_017: Should handle whitespace-only inputs', async () => {
      mockReq.body = {
        email: '   ',
        password: '   ',
        name: '   '
      };

      // Since the controller checks for falsy values, whitespace strings are truthy
      // This tests the actual behavior of the validation logic
      await authController.registerUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessages.user.weakPassword
      });
    });
  });
}); 