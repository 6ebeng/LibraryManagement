const { apiUrl, routes, methods } = require('./constants');

// A "describe" block groups related tests together.
describe('apiUrl', () => {

  // Test case 1: A simple GET_ALL request
  it('should return the correct URL for getting all authors', () => {
    const expectedUrl = 'http://localhost:8080/api/author/getAll';
    const actualUrl = apiUrl(routes.AUTHOR, methods.GET_ALL);
    expect(actualUrl).toBe(expectedUrl);
  });

  // Test case 2: A request that includes an ID
  it('should return the correct URL for updating a specific book', () => {
    const bookId = '1a2b3c';
    const expectedUrl = `http://localhost:8080/api/book/update/${bookId}`;
    const actualUrl = apiUrl(routes.BOOK, methods.PUT, bookId);
    expect(actualUrl).toBe(expectedUrl);
  });

  // Test case 3: A special auth route (login)
  it('should return the correct URL for the login route', () => {
    const expectedUrl = 'http://localhost:8080/api/auth/login';
    const actualUrl = apiUrl(routes.AUTH, methods.LOGIN);
    expect(actualUrl).toBe(expectedUrl);
  });

  // Test case 4: A special auth route (register)
  it('should return the correct URL for the register route', () => {
    const expectedUrl = 'http://localhost:8080/api/auth/register';
    const actualUrl = apiUrl(routes.AUTH, methods.REGISTER);
    expect(actualUrl).toBe(expectedUrl);
  });

  // Test case 5: A request without a method, which should still work if defined
  it('should handle routes that might not have a method in the URL structure', () => {
    const customUrl = 'http://localhost:8080/api/user/getAllMembers';
    // Assuming you might have a route defined like this in the future
    // For now, this test shows how to handle different patterns.
    // Let's test an existing one that fits a pattern.
    const allUsersUrl = apiUrl(routes.USER, methods.GET_ALL);
    expect(allUsersUrl).toBe('http://localhost:8080/api/user/getAll');
  });

});