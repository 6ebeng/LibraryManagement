/**
 * Comprehensive API Integration Test Suite
 * File: server/__tests__/integration/api_comprehensive.test.js
 * 
 * Tests all API endpoints comprehensively based on TC_API_Testing.tex
 * Covers Authentication, Book Management, Borrowal Management, and Security
 */

const request = require('supertest');
const app = require('../../index.js');
const mongoose = require('mongoose');
const User = require('../../models/user');
const Book = require('../../models/book');
const Author = require('../../models/author');
const Genre = require('../../models/genre');
const Borrowal = require('../../models/borrowal');

// Test credentials from environment variables
const apiLibrarianCredentials = {
  email: process.env.TEST_LIBRARIAN_EMAIL,
  password: process.env.TEST_LIBRARIAN_PASSWORD,
};

const apiMemberCredentials = {
  email: process.env.TEST_MEMBER_EMAIL,
  password: process.env.TEST_MEMBER_PASSWORD,
};

let testTimestamp;
let librarianAgent;
let memberAgent;
let testBookId;
let testAuthorId;
let testGenreId;
let testUserId;

beforeAll(async () => {
  if (!apiLibrarianCredentials.email || !apiLibrarianCredentials.password) {
    throw new Error('Missing test librarian credentials in environment.');
  }
  if (!apiMemberCredentials.email || !apiMemberCredentials.password) {
    throw new Error('Missing test member credentials in environment.');
  }

  // Create agents for maintaining sessions
  librarianAgent = request.agent(app);
  memberAgent = request.agent(app);

  // Login librarian
  const librarianLogin = await librarianAgent
    .post('/api/auth/login')
    .send(apiLibrarianCredentials);
  
  if (librarianLogin.statusCode !== 200) {
    throw new Error(`Librarian login failed: ${librarianLogin.status}`);
  }

  // Login member
  const memberLogin = await memberAgent
    .post('/api/auth/login')
    .send(apiMemberCredentials);
  
  if (memberLogin.statusCode !== 200) {
    throw new Error(`Member login failed: ${memberLogin.status}`);
  }
});

beforeEach(() => {
  testTimestamp = Date.now();
});

afterEach(async () => {
  // Cleanup test data
  try {
    if (testTimestamp) {
      await User.deleteMany({ 
        email: { $regex: `test_.*_${testTimestamp}@example\\.com` } 
      });
      await Book.deleteMany({ 
        name: { $regex: `Test.*${testTimestamp}` } 
      });
      await Author.deleteMany({ 
        name: { $regex: `Test.*${testTimestamp}` } 
      });
      await Genre.deleteMany({ 
        name: { $regex: `Test.*${testTimestamp}` } 
      });
      await Borrowal.deleteMany({ 
        createdAt: { $gte: new Date(testTimestamp) } 
      });
    }
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
});

afterAll(async () => {
  try {
    await librarianAgent.get('/api/auth/logout');
    await memberAgent.get('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error.message);
  }
  
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
});

describe('Comprehensive API Test Suite', () => {
  
  // --- Authentication API Tests ---
  describe('Authentication API (/api/auth)', () => {
    
    it('TC_API_AUTH_001: Successful Librarian Login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(apiLibrarianCredentials);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(apiLibrarianCredentials.email);
      expect(response.body.user.isAdmin).toBe(true);
    });

    it('TC_API_AUTH_002: Successful Member Login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(apiMemberCredentials);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(apiMemberCredentials.email);
      expect(response.body.user.isAdmin).toBe(false);
    });

    it('TC_API_AUTH_003: Login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: apiLibrarianCredentials.email,
          password: 'invalid_password'
        });
      
      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/password incorrect/i);
    });

    it('TC_API_AUTH_004: Librarian registers a new member', async () => {
      const newMemberData = {
        name: `Test Member ${testTimestamp}`,
        email: `test_member_${testTimestamp}@example.com`,
        password: 'StrongPassword123!',
        isAdmin: false
      };

      const response = await librarianAgent
        .post('/api/user/add')
        .send(newMemberData);
      
      expect([201, 200]).toContain(response.statusCode);
      expect(response.body.success).toBe(true);
      
      // Verify user was created
      const createdUser = await User.findOne({ email: newMemberData.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser.isAdmin).toBe(false);
    });

    it('TC_API_AUTH_005: Attempt to register with an existing email', async () => {
      const duplicateUserData = {
        name: 'Another Member',
        email: apiMemberCredentials.email, // Existing email
        password: 'AnotherPassword123!',
        isAdmin: false
      };

      const response = await librarianAgent
        .post('/api/user/add')
        .send(duplicateUserData);
      
      expect([400, 409]).toContain(response.statusCode);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists/i);
    });

    it('TC_API_AUTH_006: Member attempts to access user registration endpoint', async () => {
      const newUserData = {
        name: 'Unauthorized User',
        email: `unauthorized_${testTimestamp}@example.com`,
        password: 'Password123!',
        isAdmin: false
      };

      const response = await memberAgent
        .post('/api/user/add')
        .send(newUserData);
      
      expect([403, 401]).toContain(response.statusCode);
      expect(response.body.success).toBe(false);
    });

    it('TC_API_AUTH_007: Successful Logout', async () => {
      // Create a new agent for this test
      const testAgent = request.agent(app);
      
      // Login first
      await testAgent.post('/api/auth/login').send(apiLibrarianCredentials);
      
      // Then logout
      const response = await testAgent.get('/api/auth/logout');
      
      expect([200, 302]).toContain(response.statusCode);
      
      // Verify session is terminated by trying to access protected endpoint
      const protectedResponse = await testAgent.get('/api/user/getAll');
      expect([401, 403]).toContain(protectedResponse.statusCode);
    });
  });

  // --- Book Management API Tests ---
  describe('Book Management API (/api/book)', () => {
    
    beforeEach(async () => {
      // Create test author and genre for book tests
      const testAuthor = new Author({ 
        name: `Test Author ${testTimestamp}`,
        biography: 'Test biography'
      });
      const savedAuthor = await testAuthor.save();
      testAuthorId = savedAuthor._id;

      const testGenre = new Genre({ 
        name: `Test Genre ${testTimestamp}`,
        description: 'Test description'
      });
      const savedGenre = await testGenre.save();
      testGenreId = savedGenre._id;
    });

    it('TC_API_BOOK_001: Librarian adds a new book', async () => {
      const newBookData = {
        name: `Test Book ${testTimestamp}`,
        isbn: `ISBN-${testTimestamp}`,
        summary: 'A test book for API testing',
        publicationDate: '2024-01-01',
        authorId: testAuthorId,
        genreId: testGenreId,
        isAvailable: true
      };

      const response = await librarianAgent
        .post('/api/book/add')
        .send(newBookData);
      
      expect([201, 200]).toContain(response.statusCode);
      expect(response.body.success).toBe(true);
      
      if (response.body.book) {
        testBookId = response.body.book._id;
        expect(response.body.book.name).toBe(newBookData.name);
        expect(response.body.book.isbn).toBe(newBookData.isbn);
      }
    });

    it('TC_API_BOOK_002: Member attempts to add a new book', async () => {
      const newBookData = {
        name: `Unauthorized Book ${testTimestamp}`,
        isbn: `UNAUTH-${testTimestamp}`,
        summary: 'Unauthorized test book',
        authorId: testAuthorId,
        genreId: testGenreId,
        isAvailable: true
      };

      const response = await memberAgent
        .post('/api/book/add')
        .send(newBookData);
      
      expect([403, 401]).toContain(response.statusCode);
      expect(response.body.success).toBe(false);
    });

    it('TC_API_BOOK_003: Any user gets a list of all books', async () => {
      // Test with librarian
      const librarianResponse = await librarianAgent.get('/api/book/getAll');
      expect(librarianResponse.statusCode).toBe(200);
      expect(Array.isArray(librarianResponse.body)).toBe(true);

      // Test with member
      const memberResponse = await memberAgent.get('/api/book/getAll');
      expect(memberResponse.statusCode).toBe(200);
      expect(Array.isArray(memberResponse.body)).toBe(true);

      // Test without authentication
      const publicResponse = await request(app).get('/api/book/getAll');
      expect([200, 401]).toContain(publicResponse.statusCode);
    });

    it('TC_API_BOOK_004: Librarian deletes a book', async () => {
      // First create a book to delete
      const bookToDelete = new Book({
        name: `Delete Test Book ${testTimestamp}`,
        isbn: `DELETE-${testTimestamp}`,
        summary: 'Book to be deleted',
        authorId: testAuthorId,
        genreId: testGenreId,
        isAvailable: true
      });
      const savedBook = await bookToDelete.save();

      const response = await librarianAgent
        .delete(`/api/book/delete/${savedBook._id}`);
      
      expect([200, 204]).toContain(response.statusCode);
      
      // Verify book is deleted
      const deletedBook = await Book.findById(savedBook._id);
      expect(deletedBook).toBeNull();
    });

    it('TC_API_BOOK_005: Unauthenticated user attempts to delete a book', async () => {
      // Create a book first
      const bookToDelete = new Book({
        name: `Unauth Delete Test ${testTimestamp}`,
        isbn: `UNAUTH-DEL-${testTimestamp}`,
        authorId: testAuthorId,
        genreId: testGenreId,
        isAvailable: true
      });
      const savedBook = await bookToDelete.save();

      const response = await request(app)
        .delete(`/api/book/delete/${savedBook._id}`);
      
      expect([401, 403]).toContain(response.statusCode);
      
      // Verify book still exists
      const existingBook = await Book.findById(savedBook._id);
      expect(existingBook).toBeTruthy();
    });
  });

  // --- Borrowal Management API Tests ---
  describe('Borrowal Management API (/api/borrowal)', () => {
    
    beforeEach(async () => {
      // Create test book for borrowal tests
      const testBook = new Book({
        name: `Borrowal Test Book ${testTimestamp}`,
        isbn: `BORROW-${testTimestamp}`,
        summary: 'Book for borrowal testing',
        authorId: testAuthorId,
        genreId: testGenreId,
        isAvailable: true
      });
      const savedBook = await testBook.save();
      testBookId = savedBook._id;
    });

    it('TC_API_BORROW_001: Member borrows an available book for themselves', async () => {
      const borrowalData = {
        bookId: testBookId,
        memberId: await User.findOne({ email: apiMemberCredentials.email })._id
      };

      const response = await memberAgent
        .post('/api/borrowal/add')
        .send(borrowalData);
      
      expect([201, 200]).toContain(response.statusCode);
      expect(response.body.success).toBe(true);
      
      // Verify borrowal was created
      const borrowal = await Borrowal.findOne({ bookId: testBookId });
      expect(borrowal).toBeTruthy();
    });

    it('TC_API_BORROW_002: Member attempts to borrow a book for another member', async () => {
      // Get another user's ID
      const anotherUser = await User.findOne({ 
        email: { $ne: apiMemberCredentials.email },
        isAdmin: false 
      });

      if (anotherUser) {
        const borrowalData = {
          bookId: testBookId,
          memberId: anotherUser._id // Different user ID
        };

        const response = await memberAgent
          .post('/api/borrowal/add')
          .send(borrowalData);
        
        expect([403, 401]).toContain(response.statusCode);
        expect(response.body.success).toBe(false);
      }
    });

    it('TC_API_BORROW_003: Librarian updates a borrowal status to Returned', async () => {
      // First create a borrowal
      const memberUser = await User.findOne({ email: apiMemberCredentials.email });
      const borrowal = new Borrowal({
        bookId: testBookId,
        memberId: memberUser._id,
        status: 'Borrowed',
        borrowDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      });
      const savedBorrowal = await borrowal.save();

      const updateData = {
        status: 'Returned'
      };

      const response = await librarianAgent
        .put(`/api/borrowal/update/${savedBorrowal._id}`)
        .send(updateData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify borrowal status was updated
      const updatedBorrowal = await Borrowal.findById(savedBorrowal._id);
      expect(updatedBorrowal.status).toBe('Returned');
    });

    it('TC_API_BORROW_004: Member can only view their own borrowals', async () => {
      const response = await memberAgent.get('/api/borrowal/getAll');
      
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Verify all returned borrowals belong to the authenticated member
      const memberUser = await User.findOne({ email: apiMemberCredentials.email });
      response.body.forEach(borrowal => {
        expect(borrowal.memberId.toString()).toBe(memberUser._id.toString());
      });
    });
  });

  // --- Security Testing ---
  describe('Security & Input Validation', () => {
    
    it('TC_API_SEC_001: Verify password hash is not returned on user lookup', async () => {
      const users = await User.find({}).limit(1);
      if (users.length > 0) {
        const response = await librarianAgent
          .get(`/api/user/get/${users[0]._id}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body.user).toBeDefined();
        expect(response.body.user.hash).toBeUndefined();
        expect(response.body.user.salt).toBeUndefined();
        expect(response.body.user.password).toBeUndefined();
      }
    });

    it('TC_API_SEC_002: Attempt basic SQL/NoSQL Injection', async () => {
      const maliciousData = {
        email: "' OR '1'='1",
        password: "' OR '1'='1"
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousData);
      
      expect([401, 400]).toContain(response.statusCode);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/user not found|invalid|incorrect/i);
    });

    it('TC_API_SEC_003: Verify XSS protection in user input', async () => {
      const xssData = {
        name: '<script>alert("XSS")</script>',
        email: `xss_test_${testTimestamp}@example.com`,
        password: 'ValidPassword123!',
        isAdmin: false
      };

      const response = await librarianAgent
        .post('/api/user/add')
        .send(xssData);
      
      if (response.statusCode === 201 || response.statusCode === 200) {
        // If user was created, verify the script tag was sanitized
        const user = await User.findOne({ email: xssData.email });
        expect(user.name).not.toContain('<script>');
        expect(user.name).not.toContain('alert');
      }
    });

    it('TC_API_SEC_004: Verify rate limiting or input validation', async () => {
      // Test with extremely long input
      const longString = 'a'.repeat(10000);
      const invalidData = {
        name: longString,
        email: `long_test_${testTimestamp}@example.com`,
        password: 'ValidPassword123!',
        isAdmin: false
      };

      const response = await librarianAgent
        .post('/api/user/add')
        .send(invalidData);
      
      // Should either reject the request or handle it gracefully
      expect([400, 413, 422]).toContain(response.statusCode);
    });
  });

  // --- Error Handling Tests ---
  describe('Error Handling', () => {
    
    it('TC_API_ERR_001: Handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');
      
      expect([400, 422]).toContain(response.statusCode);
    });

    it('TC_API_ERR_002: Handle requests with missing required fields', async () => {
      const incompleteData = {
        email: `incomplete_${testTimestamp}@example.com`
        // Missing password and other required fields
      };

      const response = await librarianAgent
        .post('/api/user/add')
        .send(incompleteData);
      
      expect([400, 422]).toContain(response.statusCode);
      expect(response.body.success).toBe(false);
    });

    it('TC_API_ERR_003: Handle requests to non-existent endpoints', async () => {
      const response = await request(app).get('/api/nonexistent/endpoint');
      
      expect(response.statusCode).toBe(404);
    });

    it('TC_API_ERR_004: Handle malformed IDs in URL parameters', async () => {
      const response = await librarianAgent
        .get('/api/book/get/invalid-id-format');
      
      expect([400, 404]).toContain(response.statusCode);
    });
  });
}); 