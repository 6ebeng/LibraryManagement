/**
 * White-Box Unit Tests for Book Controller
 * File: server/__tests__/unit/controllers/bookController.test.js
 * 
 * Tests internal logic, validation flows, and error handling of book controller
 * Coverage: Input validation, ObjectId validation, database interactions
 */

const bookController = require('../../../controllers/bookController');
const Book = require('../../../models/book');
const mongoose = require('mongoose');
const { errorMessages } = require('../../../utils/errorMessages');

// Mock dependencies
jest.mock('../../../models/book');
jest.mock('mongoose');

describe('Book Controller - White-Box Testing', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      params: {},
      body: {}
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock mongoose ObjectId validation
    mongoose.Types = {
      ObjectId: jest.fn((id) => ({ _id: id }))
    };
    mongoose.Types.ObjectId.isValid = jest.fn();
  });

  describe('getBook - White-Box Testing', () => {
    test('TC_WB_BOOK_001: Should validate ObjectId format', async () => {
      mockReq.params.id = 'invalid-id';
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await bookController.getBook(mockReq, mockRes);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessages.book.invalidData
      });
    });

    test('TC_WB_BOOK_002: Should handle database error', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      
      const dbError = new Error('Database connection failed');
      Book.findById.mockImplementation((id, callback) => {
        callback(dbError, null);
      });

      await bookController.getBook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessages.general.databaseError
      });
    });

    test('TC_WB_BOOK_003: Should handle book not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      
      Book.findById.mockImplementation((id, callback) => {
        callback(null, null);
      });

      await bookController.getBook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessages.book.notFound
      });
    });
  });

  describe('addBook - White-Box Testing', () => {
    test('TC_WB_BOOK_004: Should validate title field first', async () => {
      mockReq.body = {
        authorId: '507f1f77bcf86cd799439011',
        genreId: '507f1f77bcf86cd799439012',
        isbn: '978-0123456789'
      };

      await bookController.addBook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessages.book.titleRequired
      });
    });

    test('TC_WB_BOOK_005: Should validate authorId field after title', async () => {
      mockReq.body = {
        title: 'Test Book',
        genreId: '507f1f77bcf86cd799439012',
        isbn: '978-0123456789'
      };

      await bookController.addBook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessages.book.authorRequired
      });
    });

    test('TC_WB_BOOK_006: Should validate ObjectId formats', async () => {
      mockReq.body = {
        title: 'Test Book',
        authorId: 'invalid-author-id',
        genreId: '507f1f77bcf86cd799439012',
        isbn: '978-0123456789'
      };

      mongoose.Types.ObjectId.isValid
        .mockReturnValueOnce(false) // authorId invalid
        .mockReturnValueOnce(true);  // genreId valid

      await bookController.addBook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessages.book.invalidData
      });
    });

    test('TC_WB_BOOK_007: Should check for duplicate ISBN', async () => {
      mockReq.body = {
        title: 'Test Book',
        authorId: '507f1f77bcf86cd799439011',
        genreId: '507f1f77bcf86cd799439012',
        isbn: '978-0123456789'
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      
      const existingBook = { _id: 'existing-id', isbn: '978-0123456789' };
      Book.findOne.mockImplementation((query, callback) => {
        callback(null, existingBook);
      });

      await bookController.addBook(mockReq, mockRes);

      expect(Book.findOne).toHaveBeenCalledWith(
        { isbn: '978-0123456789' },
        expect.any(Function)
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessages.book.duplicateISBN
      });
    });
  });

  describe('getAllBooks - White-Box Testing', () => {
    test('TC_WB_BOOK_008: Should use aggregation pipeline with lookups', async () => {
      const mockBooks = [
        {
          _id: '1',
          title: 'Book 1',
          author: { name: 'Author 1' },
          genre: { name: 'Genre 1' }
        }
      ];

      const mockExec = jest.fn((callback) => {
        callback(null, mockBooks);
      });

      Book.aggregate.mockReturnValue({ exec: mockExec });

      await bookController.getAllBooks(mockReq, mockRes);

      expect(Book.aggregate).toHaveBeenCalledWith([
        {
          $lookup: {
            from: "authors",
            localField: "authorId",
            foreignField: "_id",
            as: "author"
          }
        },
        { $unwind: "$author" },
        {
          $lookup: {
            from: "genres",
            localField: "genreId",
            foreignField: "_id",
            as: "genre"
          }
        },
        { $unwind: "$genre" }
      ]);
    });
  });
}); 