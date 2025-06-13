import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BookPage from './src/sections/@dashboard/book/BookPage';

// Mocking necessary dependencies
// Mock the API functions to simulate server responses without making actual network requests
jest.mock('./src/utils/api', () => ({
  getBooks: jest.fn(),
  addBook: jest.fn(),
  updateBook: jest.fn(),
  deleteBook: jest.fn(),
  getAuthors: jest.fn(),
  getGenres: jest.fn(),
}));

// Mock the useAuth hook. We will dynamically change its return value in tests.
const mockUseAuth = require('./src/hooks/useAuth');
jest.mock('./src/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Import the mocked modules to control them in tests
const api = require('./src/utils/api');

// A wrapper to provide necessary context (like Router) for the component
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('BookPage Component Tests', () => {
  // Mock data to be used across tests
  const mockBooks = [
    { _id: '1', name: 'The Lord of the Rings', isbn: '978-0618640157', author: { name: 'J.R.R. Tolkien' }, genre: { name: 'Fantasy' }, isAvailable: true },
    { _id: '2', name: 'The Hitchhiker\'s Guide to the Galaxy', isbn: '978-0345391803', author: { name: 'Douglas Adams' }, genre: { name: 'Sci-Fi' }, isAvailable: false },
  ];
  const mockAuthors = [{ _id: 'a1', firstName: 'J.R.R.', lastName: 'Tolkien' }];
  const mockGenres = [{ _id: 'g1', name: 'Fantasy' }];

  beforeEach(() => {
    // Before each test, reset mocks and provide default successful responses
    jest.clearAllMocks();
    // Default mock for a Librarian user
    mockUseAuth.default.mockReturnValue({
      user: { id: 'librarian123', role: 'Librarian' },
    });
    api.getBooks.mockResolvedValue({ data: { data: mockBooks } });
    api.getAuthors.mockResolvedValue({ data: { data: mockAuthors } });
    api.getGenres.mockResolvedValue({ data: { data: mockGenres } });
    api.addBook.mockResolvedValue({ data: { message: 'Book added' } });
    api.updateBook.mockResolvedValue({ data: { message: 'Book updated' } });
    api.deleteBook.mockResolvedValue({ data: { message: 'Book deleted' } });
  });

  describe('As a Librarian (Admin Role)', () => {
    /**
     * Test Case: TC_BOOK_READ_001
     * Verifies that the component correctly fetches and displays a list of books.
     */
    test('TC_BOOK_READ_001: Should fetch and display list of books', async () => {
      renderWithRouter(<BookPage />);
      expect(screen.getByText('Books')).toBeInTheDocument();
      expect(await screen.findByText('The Lord of the Rings')).toBeInTheDocument();
      expect(screen.getByText('The Hitchhiker\'s Guide to the Galaxy')).toBeInTheDocument();
      expect(api.getBooks).toHaveBeenCalledTimes(1);
    });

    /**
     * Test Case: TC_BOOK_CREATE_001
     * Verifies that a librarian can successfully open the dialog, fill the form, and create a new book.
     */
    test('TC_BOOK_CREATE_001: Should allow librarian to create a new book', async () => {
      renderWithRouter(<BookPage />);
      fireEvent.click(screen.getByRole('button', { name: /New Book/i }));
      expect(await screen.findByText('Add a new book')).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Book Name'), { target: { value: 'New Test Book' } });
      fireEvent.change(screen.getByLabelText('ISBN'), { target: { value: '123-4567890123' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add Book' }));
      await waitFor(() => {
        expect(api.addBook).toHaveBeenCalledWith(expect.objectContaining({
          name: 'New Test Book',
          isbn: '123-4567890123',
        }));
      });
    });

    /**
     * Test Case: TC_BOOK_CREATE_002
     * Verifies that the system shows validation errors if required fields are missing.
     */
    test('TC_BOOK_CREATE_002: Should show validation errors for missing required fields', async () => {
      renderWithRouter(<BookPage />);
      fireEvent.click(screen.getByRole('button', { name: /New Book/i }));
      expect(await screen.findByText('Add a new book')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Add Book' }));
      expect(await screen.findByText('Book name is required')).toBeInTheDocument();
      expect(screen.getByText('ISBN is required')).toBeInTheDocument();
      expect(api.addBook).not.toHaveBeenCalled();
    });

    /**
     * Test Case: TC_BOOK_UPDATE_001
     * Verifies that a librarian can edit an existing book.
     */
    test('TC_BOOK_UPDATE_001: Should allow librarian to update a book', async () => {
      renderWithRouter(<BookPage />);
      expect(await screen.findByText('The Lord of the Rings')).toBeInTheDocument();
      const row = screen.getByText('The Lord of the Rings').closest('tr');
      const editButton = row.querySelector('button[aria-label="edit"]');
      fireEvent.click(editButton);
      expect(await screen.findByText('Edit book')).toBeInTheDocument();
      expect(screen.getByLabelText('Book Name')).toHaveValue('The Lord of the Rings');
      fireEvent.change(screen.getByLabelText('Book Name'), { target: { value: 'The Lord of the Rings - Updated' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
      await waitFor(() => {
        expect(api.updateBook).toHaveBeenCalledWith('1', expect.objectContaining({
          name: 'The Lord of the Rings - Updated',
        }));
      });
    });

    /**
     * Test Case: TC_BOOK_DELETE_001
     * Verifies that a librarian can delete a book.
     */
    test('TC_BOOK_DELETE_001: Should allow librarian to delete a book', async () => {
      window.confirm = jest.fn(() => true);
      renderWithRouter(<BookPage />);
      expect(await screen.findByText('The Lord of the Rings')).toBeInTheDocument();
      const row = screen.getByText('The Lord of the Rings').closest('tr');
      const deleteButton = row.querySelector('button[aria-label="delete"]');
      fireEvent.click(deleteButton);
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this book?');
      await waitFor(() => {
        expect(api.deleteBook).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('As a Member (Non-Admin Role)', () => {
    beforeEach(() => {
      // For this block of tests, mock the user as a 'Member'
      mockUseAuth.default.mockReturnValue({
        user: { id: 'member456', role: 'Member' },
      });
    });
    
    /**
     * Test Case: TC_BOOK_CREATE_003
     * Verifies that a member cannot see the controls for creating, updating, or deleting books.
     */
    test('TC_BOOK_CREATE_003: Should not display admin controls to a member', async () => {
      renderWithRouter(<BookPage />);
      expect(await screen.findByText('The Lord of the Rings')).toBeInTheDocument();

      // Assert that admin buttons are NOT visible
      expect(screen.queryByRole('button', { name: /New Book/i })).not.toBeInTheDocument();
      const row = screen.getByText('The Lord of the Rings').closest('tr');
      expect(row.querySelector('button[aria-label="edit"]')).not.toBeInTheDocument();
      expect(row.querySelector('button[aria-label="delete"]')).not.toBeInTheDocument();
    });
  });

  describe('API and Edge Case Handling', () => {
     /**
     * Test Case: API Failure on Load
     * Verifies that an error message is shown if the initial book fetch fails.
     */
    test('Should display an error message if fetching books fails', async () => {
      // Mock the API to reject the promise
      api.getBooks.mockRejectedValue(new Error('API Error: Could not fetch books'));
      renderWithRouter(<BookPage />);
      
      // Check for an error message on the screen
      // The exact message depends on the implementation of the error handling
      expect(await screen.findByText(/Error loading books/i)).toBeInTheDocument();
    });

     /**
     * Test Case: Empty Data Set
     * Verifies that a 'not found' message is displayed when the API returns no books.
     */
    test('Should display "Not found" message when no books are returned', async () => {
      api.getBooks.mockResolvedValue({ data: { data: [] } });
      renderWithRouter(<BookPage />);
      
      // Wait for the table body to appear and check for the message
      expect(await screen.findByText('No data to display')).toBeInTheDocument();
    });
  });
});
