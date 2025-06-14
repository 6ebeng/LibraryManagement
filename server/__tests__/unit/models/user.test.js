/**
 * White-Box Unit Tests for User Model
 * File: server/__tests__/unit/models/user.test.js
 * 
 * Tests internal logic, methods, and data validation of User model
 * Coverage: Password hashing, validation, schema validation
 */

const mongoose = require('mongoose');
const User = require('../../../models/user');
const crypto = require('crypto');

// Mock crypto for deterministic testing
jest.mock('crypto');

describe('User Model - White-Box Testing', () => {
  let mockUser;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a test user instance
    mockUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      isAdmin: false,
      photoUrl: 'https://example.com/photo.jpg'
    });
  });

  describe('Schema Validation', () => {
    test('TC_WB_USER_001: Should require name field', () => {
      const user = new User({
        email: 'test@example.com',
        isAdmin: false,
        photoUrl: 'https://example.com/photo.jpg'
      });
      
      const validationError = user.validateSync();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.message).toContain('required');
    });

    test('TC_WB_USER_002: Should require email field', () => {
      const user = new User({
        name: 'Test User',
        isAdmin: false,
        photoUrl: 'https://example.com/photo.jpg'
      });
      
      const validationError = user.validateSync();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.message).toContain('required');
    });

    test('TC_WB_USER_003: Should require isAdmin field', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        photoUrl: 'https://example.com/photo.jpg'
      });
      
      const validationError = user.validateSync();
      expect(validationError.errors.isAdmin).toBeDefined();
      expect(validationError.errors.isAdmin.message).toContain('required');
    });

    test('TC_WB_USER_004: Should require photoUrl field', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        isAdmin: false
      });
      
      const validationError = user.validateSync();
      expect(validationError.errors.photoUrl).toBeDefined();
      expect(validationError.errors.photoUrl.message).toContain('required');
    });

    test('TC_WB_USER_005: Should allow optional dob and phone fields', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        isAdmin: false,
        photoUrl: 'https://example.com/photo.jpg'
      });
      
      const validationError = user.validateSync();
      expect(validationError.errors.dob).toBeUndefined();
      expect(validationError.errors.phone).toBeUndefined();
    });
  });

  describe('setPassword Method - White-Box Testing', () => {
    test('TC_WB_USER_006: Should generate random salt using crypto.randomBytes', () => {
      const mockSalt = 'mockedsalt123456';
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockSalt)
      });

      const mockHash = 'mockedhash123456';
      crypto.pbkdf2Sync.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockHash)
      });

      mockUser.setPassword('testpassword');

      // Verify crypto.randomBytes was called with correct parameters
      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
      expect(crypto.randomBytes().toString).toHaveBeenCalledWith('hex');
      expect(mockUser.salt).toBe(mockSalt);
    });

    test('TC_WB_USER_007: Should hash password with correct parameters', () => {
      const mockSalt = 'mockedsalt123456';
      const mockHash = 'mockedhash123456';
      const testPassword = 'testpassword';

      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockSalt)
      });
      crypto.pbkdf2Sync.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockHash)
      });

      mockUser.setPassword(testPassword);

      // Verify pbkdf2Sync was called with correct parameters
      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(
        testPassword,
        mockSalt,
        1000,
        64,
        'sha512'
      );
      expect(crypto.pbkdf2Sync().toString).toHaveBeenCalledWith('hex');
      expect(mockUser.hash).toBe(mockHash);
    });

    test('TC_WB_USER_008: Should handle empty password', () => {
      const mockSalt = 'mockedsalt123456';
      const mockHash = 'mockedhash123456';

      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockSalt)
      });
      crypto.pbkdf2Sync.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockHash)
      });

      mockUser.setPassword('');

      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith('', mockSalt, 1000, 64, 'sha512');
      expect(mockUser.salt).toBe(mockSalt);
      expect(mockUser.hash).toBe(mockHash);
    });

    test('TC_WB_USER_009: Should handle special characters in password', () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const mockSalt = 'mockedsalt123456';
      const mockHash = 'mockedhash123456';

      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockSalt)
      });
      crypto.pbkdf2Sync.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockHash)
      });

      mockUser.setPassword(specialPassword);

      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(
        specialPassword,
        mockSalt,
        1000,
        64,
        'sha512'
      );
    });
  });

  describe('isValidPassword Method - White-Box Testing', () => {
    beforeEach(() => {
      // Set up user with known salt and hash
      mockUser.salt = 'knownsalt123456';
      mockUser.hash = 'knownhash123456';
    });

    test('TC_WB_USER_010: Should hash input password with stored salt', () => {
      const testPassword = 'testpassword';
      const mockComputedHash = 'computedhash123456';

      crypto.pbkdf2Sync.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockComputedHash)
      });

      mockUser.isValidPassword(testPassword);

      // Verify pbkdf2Sync was called with stored salt
      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(
        testPassword,
        mockUser.salt,
        1000,
        64,
        'sha512'
      );
      expect(crypto.pbkdf2Sync().toString).toHaveBeenCalledWith('hex');
    });

    test('TC_WB_USER_011: Should return true when hashes match', () => {
      const testPassword = 'correctpassword';
      const storedHash = 'knownhash123456';
      
      mockUser.hash = storedHash;
      crypto.pbkdf2Sync.mockReturnValue({
        toString: jest.fn().mockReturnValue(storedHash)
      });

      const result = mockUser.isValidPassword(testPassword);

      expect(result).toBe(true);
    });

    test('TC_WB_USER_012: Should return false when hashes do not match', () => {
      const testPassword = 'wrongpassword';
      const storedHash = 'knownhash123456';
      const computedHash = 'differenthash789';
      
      mockUser.hash = storedHash;
      crypto.pbkdf2Sync.mockReturnValue({
        toString: jest.fn().mockReturnValue(computedHash)
      });

      const result = mockUser.isValidPassword(testPassword);

      expect(result).toBe(false);
    });

    test('TC_WB_USER_013: Should handle empty password validation', () => {
      const emptyPassword = '';
      const mockComputedHash = 'emptyhash123456';

      crypto.pbkdf2Sync.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockComputedHash)
      });

      mockUser.isValidPassword(emptyPassword);

      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(
        emptyPassword,
        mockUser.salt,
        1000,
        64,
        'sha512'
      );
    });

    test('TC_WB_USER_014: Should handle null/undefined password', () => {
      const mockComputedHash = 'nullhash123456';

      crypto.pbkdf2Sync.mockReturnValue({
        toString: jest.fn().mockReturnValue(mockComputedHash)
      });

      // Test null password
      mockUser.isValidPassword(null);
      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(null, mockUser.salt, 1000, 64, 'sha512');

      // Test undefined password
      mockUser.isValidPassword(undefined);
      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(undefined, mockUser.salt, 1000, 64, 'sha512');
    });
  });

  describe('Integration Testing - Password Flow', () => {
    test('TC_WB_USER_015: Complete password set and validation flow', () => {
      // Use real crypto for integration test
      jest.unmock('crypto');
      const realCrypto = require('crypto');
      
      const testUser = new User({
        name: 'Integration Test User',
        email: 'integration@example.com',
        isAdmin: false,
        photoUrl: 'https://example.com/photo.jpg'
      });

      const testPassword = 'integrationTestPassword123!';
      
      // Set password
      testUser.setPassword(testPassword);
      
      // Verify salt and hash were set
      expect(testUser.salt).toBeDefined();
      expect(testUser.hash).toBeDefined();
      expect(testUser.salt.length).toBeGreaterThan(0);
      expect(testUser.hash.length).toBeGreaterThan(0);
      
      // Verify correct password validates
      expect(testUser.isValidPassword(testPassword)).toBe(true);
      
      // Verify incorrect password fails
      expect(testUser.isValidPassword('wrongpassword')).toBe(false);
      expect(testUser.isValidPassword('')).toBe(false);
      expect(testUser.isValidPassword('integrationTestPassword124!')).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('TC_WB_USER_016: Should handle crypto errors gracefully', () => {
      crypto.randomBytes.mockImplementation(() => {
        throw new Error('Crypto error');
      });

      expect(() => {
        mockUser.setPassword('testpassword');
      }).toThrow('Crypto error');
    });

    test('TC_WB_USER_017: Should handle pbkdf2Sync errors gracefully', () => {
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('mockedsalt')
      });
      crypto.pbkdf2Sync.mockImplementation(() => {
        throw new Error('PBKDF2 error');
      });

      expect(() => {
        mockUser.setPassword('testpassword');
      }).toThrow('PBKDF2 error');
    });
  });
}); 