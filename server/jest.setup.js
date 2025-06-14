// Jest setup file to configure test environment
// Set NODE_ENV to test before loading dotenv
process.env.NODE_ENV = 'test';

// Load test environment variables
require('dotenv').config({ path: '../.env.test' });

// Increase test timeout for API tests
jest.setTimeout(30000); 