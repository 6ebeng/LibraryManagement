/**
 * White-Box Unit Tests for Book Model
 * File: server/__tests__/unit/models/book.test.js
 * 
 * Tests internal schema validation and data structure of Book model
 * Coverage: Schema validation, field requirements, data types
 */

const mongoose = require('mongoose');
const Book = require('../../../models/book');

describe('Book Model - White-Box Testing', () => {
  
  describe('Schema Validation', () => {
    test('TC_WB_BOOK_MODEL_001: Should require name field', () => {
      const book = new Book({
        isbn: '978-0123456789',
        isAvailable: true
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.message).toContain('required');
    });

    test('TC_WB_BOOK_MODEL_002: Should require isbn field', () => {
      const book = new Book({
        name: 'Test Book',
        isAvailable: true
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.isbn).toBeDefined();
      expect(validationError.errors.isbn.message).toContain('required');
    });

    test('TC_WB_BOOK_MODEL_003: Should require isAvailable field', () => {
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789'
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.isAvailable).toBeDefined();
      expect(validationError.errors.isAvailable.message).toContain('required');
    });

    test('TC_WB_BOOK_MODEL_004: Should allow optional authorId field', () => {
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.authorId).toBeUndefined();
    });

    test('TC_WB_BOOK_MODEL_005: Should allow optional genreId field', () => {
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.genreId).toBeUndefined();
    });

    test('TC_WB_BOOK_MODEL_006: Should allow optional summary field', () => {
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.summary).toBeUndefined();
    });

    test('TC_WB_BOOK_MODEL_007: Should allow optional photoUrl field', () => {
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.photoUrl).toBeUndefined();
    });
  });

  describe('Data Type Validation', () => {
    test('TC_WB_BOOK_MODEL_008: Should accept string for name field', () => {
      const book = new Book({
        name: 'Valid Book Name',
        isbn: '978-0123456789',
        isAvailable: true
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.name).toBeUndefined();
      expect(book.name).toBe('Valid Book Name');
    });

    test('TC_WB_BOOK_MODEL_009: Should accept string for isbn field', () => {
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.isbn).toBeUndefined();
      expect(book.isbn).toBe('978-0123456789');
    });

    test('TC_WB_BOOK_MODEL_010: Should accept boolean for isAvailable field', () => {
      const bookTrue = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true
      });
      
      const bookFalse = new Book({
        name: 'Test Book 2',
        isbn: '978-0123456790',
        isAvailable: false
      });
      
      expect(bookTrue.validateSync().errors.isAvailable).toBeUndefined();
      expect(bookFalse.validateSync().errors.isAvailable).toBeUndefined();
      expect(bookTrue.isAvailable).toBe(true);
      expect(bookFalse.isAvailable).toBe(false);
    });

    test('TC_WB_BOOK_MODEL_011: Should accept ObjectId for authorId field', () => {
      const validObjectId = new mongoose.Types.ObjectId();
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true,
        authorId: validObjectId
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.authorId).toBeUndefined();
      expect(book.authorId).toEqual(validObjectId);
    });

    test('TC_WB_BOOK_MODEL_012: Should accept ObjectId for genreId field', () => {
      const validObjectId = new mongoose.Types.ObjectId();
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true,
        genreId: validObjectId
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.genreId).toBeUndefined();
      expect(book.genreId).toEqual(validObjectId);
    });

    test('TC_WB_BOOK_MODEL_013: Should accept string for summary field', () => {
      const summary = 'This is a test book summary with detailed description.';
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true,
        summary: summary
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.summary).toBeUndefined();
      expect(book.summary).toBe(summary);
    });

    test('TC_WB_BOOK_MODEL_014: Should accept string for photoUrl field', () => {
      const photoUrl = 'https://example.com/book-cover.jpg';
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true,
        photoUrl: photoUrl
      });
      
      const validationError = book.validateSync();
      expect(validationError.errors.photoUrl).toBeUndefined();
      expect(book.photoUrl).toBe(photoUrl);
    });
  });

  describe('Schema Structure Validation', () => {
    test('TC_WB_BOOK_MODEL_015: Should have correct schema structure', () => {
      const book = new Book({
        name: 'Complete Test Book',
        isbn: '978-0123456789',
        isAvailable: true,
        authorId: new mongoose.Types.ObjectId(),
        genreId: new mongoose.Types.ObjectId(),
        summary: 'Test summary',
        photoUrl: 'https://example.com/photo.jpg'
      });

      // Verify all fields are present
      expect(book.name).toBeDefined();
      expect(book.isbn).toBeDefined();
      expect(book.isAvailable).toBeDefined();
      expect(book.authorId).toBeDefined();
      expect(book.genreId).toBeDefined();
      expect(book.summary).toBeDefined();
      expect(book.photoUrl).toBeDefined();
      
      // Verify no validation errors
      const validationError = book.validateSync();
      expect(validationError).toBeNull();
    });

    test('TC_WB_BOOK_MODEL_016: Should have minimal required fields only', () => {
      const book = new Book({
        name: 'Minimal Book',
        isbn: '978-0123456789',
        isAvailable: false
      });

      const validationError = book.validateSync();
      expect(validationError).toBeNull();
      
      // Verify required fields are set
      expect(book.name).toBe('Minimal Book');
      expect(book.isbn).toBe('978-0123456789');
      expect(book.isAvailable).toBe(false);
      
      // Verify optional fields are undefined
      expect(book.authorId).toBeUndefined();
      expect(book.genreId).toBeUndefined();
      expect(book.summary).toBeUndefined();
      expect(book.photoUrl).toBeUndefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('TC_WB_BOOK_MODEL_017: Should handle empty string values', () => {
      const book = new Book({
        name: '',
        isbn: '',
        isAvailable: true
      });
      
      // Empty strings should still pass validation (they are truthy)
      const validationError = book.validateSync();
      expect(validationError).toBeNull();
      expect(book.name).toBe('');
      expect(book.isbn).toBe('');
    });

    test('TC_WB_BOOK_MODEL_018: Should handle null values for optional fields', () => {
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true,
        authorId: null,
        genreId: null,
        summary: null,
        photoUrl: null
      });
      
      const validationError = book.validateSync();
      expect(validationError).toBeNull();
    });

    test('TC_WB_BOOK_MODEL_019: Should handle undefined values for optional fields', () => {
      const book = new Book({
        name: 'Test Book',
        isbn: '978-0123456789',
        isAvailable: true,
        authorId: undefined,
        genreId: undefined,
        summary: undefined,
        photoUrl: undefined
      });
      
      const validationError = book.validateSync();
      expect(validationError).toBeNull();
    });

    test('TC_WB_BOOK_MODEL_020: Should handle very long string values', () => {
      const longString = 'a'.repeat(1000);
      const book = new Book({
        name: longString,
        isbn: '978-0123456789',
        isAvailable: true,
        summary: longString,
        photoUrl: longString
      });
      
      const validationError = book.validateSync();
      expect(validationError).toBeNull();
      expect(book.name).toBe(longString);
      expect(book.summary).toBe(longString);
      expect(book.photoUrl).toBe(longString);
    });

    test('TC_WB_BOOK_MODEL_021: Should handle special characters in string fields', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const book = new Book({
        name: `Book with ${specialChars}`,
        isbn: '978-0123456789',
        isAvailable: true,
        summary: `Summary with ${specialChars}`,
        photoUrl: `https://example.com/photo${specialChars}.jpg`
      });
      
      const validationError = book.validateSync();
      expect(validationError).toBeNull();
    });

    test('TC_WB_BOOK_MODEL_022: Should handle unicode characters', () => {
      const unicodeText = '测试书籍 📚 Тестовая книга';
      const book = new Book({
        name: unicodeText,
        isbn: '978-0123456789',
        isAvailable: true,
        summary: unicodeText
      });
      
      const validationError = book.validateSync();
      expect(validationError).toBeNull();
      expect(book.name).toBe(unicodeText);
      expect(book.summary).toBe(unicodeText);
    });
  });

  describe('Model Export and Mongoose Integration', () => {
    test('TC_WB_BOOK_MODEL_023: Should be a valid Mongoose model', () => {
      expect(Book).toBeDefined();
      expect(typeof Book).toBe('function');
      expect(Book.modelName).toBe('Book');
    });

    test('TC_WB_BOOK_MODEL_024: Should have correct schema paths', () => {
      const schemaPaths = Object.keys(Book.schema.paths);
      
      expect(schemaPaths).toContain('name');
      expect(schemaPaths).toContain('isbn');
      expect(schemaPaths).toContain('authorId');
      expect(schemaPaths).toContain('genreId');
      expect(schemaPaths).toContain('isAvailable');
      expect(schemaPaths).toContain('summary');
      expect(schemaPaths).toContain('photoUrl');
      expect(schemaPaths).toContain('_id');
      expect(schemaPaths).toContain('__v');
    });

    test('TC_WB_BOOK_MODEL_025: Should have correct field types in schema', () => {
      const schema = Book.schema;
      
      expect(schema.paths.name.instance).toBe('String');
      expect(schema.paths.isbn.instance).toBe('String');
      expect(schema.paths.isAvailable.instance).toBe('Boolean');
      expect(schema.paths.authorId.instance).toBe('ObjectID');
      expect(schema.paths.genreId.instance).toBe('ObjectID');
      expect(schema.paths.summary.instance).toBe('String');
      expect(schema.paths.photoUrl.instance).toBe('String');
    });

    test('TC_WB_BOOK_MODEL_026: Should have correct required field configuration', () => {
      const schema = Book.schema;
      
      expect(schema.paths.name.isRequired).toBe(true);
      expect(schema.paths.isbn.isRequired).toBe(true);
      expect(schema.paths.isAvailable.isRequired).toBe(true);
      expect(schema.paths.authorId.isRequired).toBe(false);
      expect(schema.paths.genreId.isRequired).toBe(false);
      expect(schema.paths.summary.isRequired).toBe(false);
      expect(schema.paths.photoUrl.isRequired).toBe(false);
    });
  });
}); 