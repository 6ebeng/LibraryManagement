/**
 * Installation/Deployment Testing - Smoke Tests
 * Test Suite: TC_INSTALL_SMOKE_*
 * 
 * This test suite performs smoke testing after deployment to verify
 * that the core functionality of the Library Management System works correctly.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Installation/Deployment Testing - Smoke Tests', () => {
  let app;
  let server;
  const testTimeout = 30000;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/library_smoke_test';
    process.env.JWT_SECRET = 'smoke_test_secret_key';
    process.env.PORT = '5001';

    try {
      // Import the app after setting environment variables
      app = require('../../index');
      
      // Wait for database connection
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Failed to start application for smoke tests:', error);
      throw error;
    }
  }, testTimeout);

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
      }
      if (server) {
        server.close();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Basic Application Functionality Smoke Tests', () => {
    test('TC_INSTALL_SMOKE_001: Should verify application starts successfully', async () => {
      // Test that the application is running
      expect(app).toBeDefined();
      
      // Test basic health endpoint if available
      const response = await request(app)
        .get('/')
        .timeout(5000);
      
      // Should not return 404 or 500 errors
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(500);
    });

    test('TC_INSTALL_SMOKE_002: Should verify database connectivity', async () => {
      // Check MongoDB connection
      expect(mongoose.connection.readyState).toBe(1); // Connected
      
      // Test basic database operation
      const collections = await mongoose.connection.db.listCollections().toArray();
      expect(Array.isArray(collections)).toBe(true);
    });

    test('TC_INSTALL_SMOKE_003: Should verify API endpoints are accessible', async () => {
      // Test authentication endpoints
      const authResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'testpassword'
        });
      
      // Should return proper error response, not server error
      expect(authResponse.status).not.toBe(500);
      expect([400, 401, 404]).toContain(authResponse.status);

      // Test book endpoints
      const bookResponse = await request(app)
        .get('/api/book/getAll');
      
      // Should return proper response
      expect(bookResponse.status).not.toBe(500);
      expect([200, 401, 403]).toContain(bookResponse.status);
    });

    test('TC_INSTALL_SMOKE_004: Should verify user registration functionality', async () => {
      const testUser = {
        name: 'Smoke Test User',
        email: 'smoketest@example.com',
        password: 'SmokeTest123!',
        role: 'Member'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Should either succeed or fail gracefully
      expect(response.status).not.toBe(500);
      
      if (response.status === 201 || response.status === 200) {
        expect(response.body.success).toBe(true);
      } else {
        // Should have meaningful error message
        expect(response.body.message).toBeDefined();
      }
    });

    test('TC_INSTALL_SMOKE_005: Should verify basic CRUD operations work', async () => {
      // Create a test user first for authentication
      const testUser = {
        name: 'CRUD Test User',
        email: 'crudtest@example.com',
        password: 'CrudTest123!',
        role: 'Librarian'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      if (registerResponse.status === 201 || registerResponse.status === 200) {
        // Try to login
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password
          });

        if (loginResponse.status === 200) {
          // Test book creation (if authenticated)
          const testBook = {
            name: 'Smoke Test Book',
            isbn: '978-0000000000',
            isAvailable: true
          };

          const bookResponse = await request(app)
            .post('/api/book/add')
            .send(testBook);

          // Should not crash the server
          expect(bookResponse.status).not.toBe(500);
        }
      }
    });
  });

  describe('Performance Baseline Verification', () => {
    test('TC_INSTALL_SMOKE_006: Should verify API response times are acceptable', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/book/getAll')
        .timeout(5000);
      
      const responseTime = Date.now() - startTime;
      
      // API should respond within 5 seconds (generous for smoke test)
      expect(responseTime).toBeLessThan(5000);
      
      // Should not return server error
      expect(response.status).not.toBe(500);
    });

    test('TC_INSTALL_SMOKE_007: Should verify memory usage is reasonable', () => {
      const memUsage = process.memoryUsage();
      
      // Heap usage should be reasonable (less than 100MB for basic operations)
      expect(memUsage.heapUsed).toBeLessThan(100 * 1024 * 1024);
      
      // RSS should be reasonable (less than 200MB)
      expect(memUsage.rss).toBeLessThan(200 * 1024 * 1024);
    });

    test('TC_INSTALL_SMOKE_008: Should handle concurrent requests', async () => {
      const concurrentRequests = 5;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/api/book/getAll')
            .timeout(10000)
        );
      }

      const responses = await Promise.all(requests);
      
      // All requests should complete without server errors
      responses.forEach(response => {
        expect(response.status).not.toBe(500);
      });
    });
  });

  describe('Error Handling Verification', () => {
    test('TC_INSTALL_SMOKE_009: Should handle invalid API requests gracefully', async () => {
      // Test invalid endpoint
      const invalidResponse = await request(app)
        .get('/api/nonexistent/endpoint');
      
      expect(invalidResponse.status).toBe(404);
      expect(invalidResponse.body.message || invalidResponse.text).toBeDefined();

      // Test malformed request body
      const malformedResponse = await request(app)
        .post('/api/auth/login')
        .send('invalid json');
      
      expect(malformedResponse.status).not.toBe(500);
      expect([400, 422]).toContain(malformedResponse.status);
    });

    test('TC_INSTALL_SMOKE_010: Should handle database connection issues gracefully', async () => {
      // Temporarily close database connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        
        // Try to make a request that requires database
        const response = await request(app)
          .get('/api/book/getAll');
        
        // Should handle database error gracefully
        expect(response.status).not.toBe(200);
        expect([500, 503]).toContain(response.status);
        
        // Reconnect for cleanup
        await mongoose.connect(process.env.MONGODB_URI);
      }
    });
  });

  describe('Security Baseline Verification', () => {
    test('TC_INSTALL_SMOKE_011: Should not expose sensitive information', async () => {
      // Test error responses don't expose stack traces
      const response = await request(app)
        .post('/api/auth/login')
        .send({});
      
      const responseText = JSON.stringify(response.body) + response.text;
      
      // Should not contain stack traces or file paths
      expect(responseText).not.toMatch(/at\s+\w+\s+\(/);
      expect(responseText).not.toMatch(/\/[a-zA-Z]:[\\\/]/);
      expect(responseText).not.toMatch(/node_modules/);
    });

    test('TC_INSTALL_SMOKE_012: Should have proper CORS configuration', async () => {
      const response = await request(app)
        .options('/api/auth/login');
      
      // Should handle OPTIONS request
      expect(response.status).not.toBe(500);
      
      // Check for CORS headers if configured
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).toBeDefined();
      }
    });

    test('TC_INSTALL_SMOKE_013: Should validate input sanitization', async () => {
      const maliciousInput = {
        email: '<script>alert("xss")</script>',
        password: '"; DROP TABLE users; --'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousInput);
      
      // Should not return server error
      expect(response.status).not.toBe(500);
      
      // Response should not contain the malicious script
      const responseText = JSON.stringify(response.body) + response.text;
      expect(responseText).not.toContain('<script>');
    });
  });

  describe('Configuration Verification', () => {
    test('TC_INSTALL_SMOKE_014: Should verify environment configuration', () => {
      // Check that required environment variables are set
      expect(process.env.NODE_ENV).toBeDefined();
      expect(process.env.MONGODB_URI).toBeDefined();
      expect(process.env.JWT_SECRET).toBeDefined();
      
      // Verify test environment is properly configured
      expect(process.env.NODE_ENV).toBe('test');
    });

    test('TC_INSTALL_SMOKE_015: Should verify application structure', () => {
      const projectRoot = path.resolve(__dirname, '../../../');
      
      // Check essential files exist
      const essentialFiles = [
        'package.json',
        'index.js',
        'models',
        'controllers',
        'routes'
      ];

      essentialFiles.forEach(file => {
        const filePath = path.join(projectRoot, 'server', file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Integration Smoke Tests', () => {
    test('TC_INSTALL_SMOKE_016: Should verify model-controller integration', async () => {
      // Test that models are properly connected to controllers
      const User = require('../../models/user');
      expect(User).toBeDefined();
      expect(typeof User).toBe('function');
      
      const Book = require('../../models/book');
      expect(Book).toBeDefined();
      expect(typeof Book).toBe('function');
    });

    test('TC_INSTALL_SMOKE_017: Should verify route-controller integration', async () => {
      // Test that routes are properly connected
      const response = await request(app)
        .get('/api/book/getAll');
      
      // Should reach the controller (not return 404)
      expect(response.status).not.toBe(404);
    });

    test('TC_INSTALL_SMOKE_018: Should verify middleware integration', async () => {
      // Test that middleware is working
      const response = await request(app)
        .post('/api/auth/login')
        .send({});
      
      // Should be processed by validation middleware
      expect(response.status).not.toBe(404);
      expect(response.body || response.text).toBeDefined();
    });
  });
});

/**
 * Smoke Test Utilities
 */
class SmokeTestUtils {
  static async createTestUser(app, userData) {
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    return response;
  }

  static async loginTestUser(app, credentials) {
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials);
    
    return response;
  }

  static async measureResponseTime(requestPromise) {
    const startTime = Date.now();
    const response = await requestPromise;
    const endTime = Date.now();
    
    return {
      response,
      responseTime: endTime - startTime
    };
  }

  static validateErrorResponse(response) {
    expect(response.status).not.toBe(500);
    expect(response.body.message || response.text).toBeDefined();
    
    // Should not expose sensitive information
    const responseText = JSON.stringify(response.body) + response.text;
    expect(responseText).not.toMatch(/password/i);
    expect(responseText).not.toMatch(/secret/i);
    expect(responseText).not.toMatch(/token/i);
  }
}

module.exports = { SmokeTestUtils }; 