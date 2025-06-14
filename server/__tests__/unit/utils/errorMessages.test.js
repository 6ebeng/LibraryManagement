/**
 * White-Box Unit Tests for Error Messages Utility
 * File: server/__tests__/unit/utils/errorMessages.test.js
 * 
 * Tests internal logic and structure of error message utility
 * Coverage: Error message structure, getErrorMessage function logic
 */

const { errorMessages, getErrorMessage } = require('../../../utils/errorMessages');

describe('Error Messages Utility - White-Box Testing', () => {
  
  describe('errorMessages Object Structure', () => {
    test('TC_WB_UTIL_001: Should have auth category with required messages', () => {
      expect(errorMessages.auth).toBeDefined();
      expect(errorMessages.auth.emailRequired).toBe('Email address is required');
      expect(errorMessages.auth.passwordRequired).toBe('Password is required');
      expect(errorMessages.auth.invalidCredentials).toBe('Invalid email or password. Please check your credentials and try again.');
      expect(errorMessages.auth.userNotFound).toBe('No account found with this email address. Please check your email or register.');
      expect(errorMessages.auth.incorrectPassword).toBe('The password you entered is incorrect. Please try again.');
      expect(errorMessages.auth.userAlreadyExists).toBe('An account with this email already exists. Please login or use a different email.');
    });

    test('TC_WB_UTIL_002: Should have book category with required messages', () => {
      expect(errorMessages.book).toBeDefined();
      expect(errorMessages.book.notFound).toBe('Book not found. It may have been deleted or the ID is incorrect.');
      expect(errorMessages.book.titleRequired).toBe('Book title is required');
      expect(errorMessages.book.authorRequired).toBe('Please select an author for the book');
      expect(errorMessages.book.genreRequired).toBe('Please select a genre for the book');
      expect(errorMessages.book.isbnRequired).toBe('ISBN is required for book identification');
    });

    test('TC_WB_UTIL_003: Should have user category with required messages', () => {
      expect(errorMessages.user).toBeDefined();
      expect(errorMessages.user.notFound).toBe('User not found');
      expect(errorMessages.user.nameRequired).toBe('User name is required');
      expect(errorMessages.user.emailRequired).toBe('Email address is required');
      expect(errorMessages.user.passwordRequired).toBe('Password is required');
      expect(errorMessages.user.weakPassword).toBe('Password must be at least 8 characters long');
    });

    test('TC_WB_UTIL_004: Should have borrowal category with required messages', () => {
      expect(errorMessages.borrowal).toBeDefined();
      expect(errorMessages.borrowal.bookNotAvailable).toBe('This book is currently not available for borrowing');
      expect(errorMessages.borrowal.alreadyBorrowed).toBe('You have already borrowed this book');
      expect(errorMessages.borrowal.borrowLimitExceeded).toBe('You have reached your borrowing limit. Please return some books first.');
      expect(errorMessages.borrowal.notFound).toBe('Borrowal record not found');
    });

    test('TC_WB_UTIL_005: Should have general category with required messages', () => {
      expect(errorMessages.general).toBeDefined();
      expect(errorMessages.general.serverError).toBe('An unexpected error occurred. Please try again or contact support if the problem persists.');
      expect(errorMessages.general.invalidRequest).toBe('Invalid request. Please check your data and try again.');
      expect(errorMessages.general.databaseError).toBe('Database error occurred. Please try again later.');
      expect(errorMessages.general.networkError).toBe('Network error. Please check your internet connection and try again.');
    });

    test('TC_WB_UTIL_006: Should have all message strings as non-empty', () => {
      const checkCategory = (category, categoryName) => {
        Object.keys(category).forEach(key => {
          expect(category[key]).toBeDefined();
          expect(typeof category[key]).toBe('string');
          expect(category[key].length).toBeGreaterThan(0);
        });
      };

      checkCategory(errorMessages.auth, 'auth');
      checkCategory(errorMessages.book, 'book');
      checkCategory(errorMessages.user, 'user');
      checkCategory(errorMessages.borrowal, 'borrowal');
      checkCategory(errorMessages.general, 'general');
    });
  });

  describe('getErrorMessage Function - White-Box Testing', () => {
    test('TC_WB_UTIL_007: Should return correct message when category and key exist', () => {
      const result = getErrorMessage('auth', 'emailRequired');
      expect(result).toBe('Email address is required');
    });

    test('TC_WB_UTIL_008: Should return correct message for nested access', () => {
      const result = getErrorMessage('book', 'titleRequired');
      expect(result).toBe('Book title is required');
    });

    test('TC_WB_UTIL_009: Should return fallback when category does not exist', () => {
      const fallback = 'Custom fallback message';
      const result = getErrorMessage('nonexistent', 'someKey', fallback);
      expect(result).toBe(fallback);
    });

    test('TC_WB_UTIL_010: Should return fallback when key does not exist', () => {
      const fallback = 'Custom fallback message';
      const result = getErrorMessage('auth', 'nonexistentKey', fallback);
      expect(result).toBe(fallback);
    });

    test('TC_WB_UTIL_011: Should return general.serverError when no fallback provided and category missing', () => {
      const result = getErrorMessage('nonexistent', 'someKey');
      expect(result).toBe(errorMessages.general.serverError);
    });

    test('TC_WB_UTIL_012: Should return general.serverError when no fallback provided and key missing', () => {
      const result = getErrorMessage('auth', 'nonexistentKey');
      expect(result).toBe(errorMessages.general.serverError);
    });

    test('TC_WB_UTIL_013: Should handle null/undefined category', () => {
      const fallback = 'Null category fallback';
      
      const resultNull = getErrorMessage(null, 'someKey', fallback);
      expect(resultNull).toBe(fallback);
      
      const resultUndefined = getErrorMessage(undefined, 'someKey', fallback);
      expect(resultUndefined).toBe(fallback);
    });

    test('TC_WB_UTIL_014: Should handle null/undefined key', () => {
      const fallback = 'Null key fallback';
      
      const resultNull = getErrorMessage('auth', null, fallback);
      expect(resultNull).toBe(fallback);
      
      const resultUndefined = getErrorMessage('auth', undefined, fallback);
      expect(resultUndefined).toBe(fallback);
    });

    test('TC_WB_UTIL_015: Should handle empty string category and key', () => {
      const fallback = 'Empty string fallback';
      
      const result = getErrorMessage('', '', fallback);
      expect(result).toBe(fallback);
    });

    test('TC_WB_UTIL_016: Should handle boolean/number inputs gracefully', () => {
      const fallback = 'Type error fallback';
      
      const resultBoolean = getErrorMessage(true, false, fallback);
      expect(resultBoolean).toBe(fallback);
      
      const resultNumber = getErrorMessage(123, 456, fallback);
      expect(resultNumber).toBe(fallback);
    });
  });

  describe('Error Message Content Validation', () => {
    test('TC_WB_UTIL_017: Should have user-friendly auth messages', () => {
      expect(errorMessages.auth.emailRequired).toMatch(/email/i);
      expect(errorMessages.auth.passwordRequired).toMatch(/password/i);
      expect(errorMessages.auth.userNotFound).toMatch(/account.*not found/i);
      expect(errorMessages.auth.incorrectPassword).toMatch(/password.*incorrect/i);
    });

    test('TC_WB_UTIL_018: Should have descriptive book error messages', () => {
      expect(errorMessages.book.notFound).toMatch(/book.*not found/i);
      expect(errorMessages.book.titleRequired).toMatch(/title.*required/i);
      expect(errorMessages.book.authorRequired).toMatch(/author/i);
      expect(errorMessages.book.genreRequired).toMatch(/genre/i);
    });

    test('TC_WB_UTIL_019: Should have helpful borrowal messages', () => {
      expect(errorMessages.borrowal.bookNotAvailable).toMatch(/not available/i);
      expect(errorMessages.borrowal.alreadyBorrowed).toMatch(/already borrowed/i);
      expect(errorMessages.borrowal.borrowLimitExceeded).toMatch(/limit.*exceeded/i);
    });

    test('TC_WB_UTIL_020: Should have professional general error messages', () => {
      expect(errorMessages.general.serverError).toMatch(/unexpected error/i);
      expect(errorMessages.general.databaseError).toMatch(/database error/i);
      expect(errorMessages.general.networkError).toMatch(/network error/i);
    });
  });

  describe('Message Consistency and Standards', () => {
    test('TC_WB_UTIL_021: Should have consistent punctuation', () => {
      const allMessages = [];
      
      Object.values(errorMessages).forEach(category => {
        Object.values(category).forEach(message => {
          allMessages.push(message);
        });
      });

      allMessages.forEach(message => {
        // Most messages should end with period or exclamation
        expect(message).toMatch(/[.!]$/);
      });
    });

    test('TC_WB_UTIL_022: Should have appropriate message lengths', () => {
      const allMessages = [];
      
      Object.values(errorMessages).forEach(category => {
        Object.values(category).forEach(message => {
          allMessages.push(message);
        });
      });

      allMessages.forEach(message => {
        // Messages should be informative but not too long
        expect(message.length).toBeGreaterThan(10);
        expect(message.length).toBeLessThan(200);
      });
    });

    test('TC_WB_UTIL_023: Should not contain placeholder text', () => {
      const allMessages = [];
      
      Object.values(errorMessages).forEach(category => {
        Object.values(category).forEach(message => {
          allMessages.push(message);
        });
      });

      allMessages.forEach(message => {
        expect(message).not.toMatch(/TODO|FIXME|placeholder|lorem ipsum/i);
      });
    });
  });

  describe('Module Exports', () => {
    test('TC_WB_UTIL_024: Should export errorMessages object', () => {
      expect(errorMessages).toBeDefined();
      expect(typeof errorMessages).toBe('object');
    });

    test('TC_WB_UTIL_025: Should export getErrorMessage function', () => {
      expect(getErrorMessage).toBeDefined();
      expect(typeof getErrorMessage).toBe('function');
    });

    test('TC_WB_UTIL_026: Should have correct function arity', () => {
      // getErrorMessage should accept 3 parameters
      expect(getErrorMessage.length).toBe(3);
    });
  });
}); 