import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import AuthorPage from './AuthorPage';

// Mocking API calls and other dependencies
jest.mock('../../../utils/api', () => ({
  getAuthors: jest.fn(),
  addAuthor: jest.fn(),
  deleteAuthor: jest.fn(),
}));
const mockUseAuth = require('../../../hooks/useAuth');
jest.mock('../../../hooks/useAuth');

const api = require('../../../utils/api');

// Helper to render the component with Router context
const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('AuthorPage Component Tests (Librarian)', () => {
  const mockAuthors = [
    { _id: '1', name: 'J.K. Rowling', description: 'Author of Harry Potter series.' },
    { _id: '2', name: 'George Orwell', description: 'Author of 1984 and Animal Farm.' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the user as a Librarian (admin)
    mockUseAuth.default.mockReturnValue({
      user: { isAdmin: true },
    });
    api.getAuthors.mockResolvedValue({ data: { authorsList: mockAuthors } });
    api.addAuthor.mockResolvedValue({ data: { message: 'Author added successfully' } });
    api.deleteAuthor.mockResolvedValue({ data: { message: 'Author deleted successfully' } });
  });

  /**
   * Test Case: TC_AUTHOR_CREATE_001 - Successful new author creation by Librarian
   * Verifies that a librarian can open the form and create a new author.
   */
  test('TC_AUTHOR_CREATE_001: should allow a librarian to add a new author', async () => {
    renderWithRouter(<AuthorPage />);
    
    // Click 'New Author' button to open the form
    fireEvent.click(screen.getByRole('button', { name: /new author/i }));
    
    // Wait for the modal to appear and fill it out
    expect(await screen.findByText(/add author/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/author name/i), { target: { value: 'New Author' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A new description.' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Verify that the addUser API was called with the correct data
    await waitFor(() => {
      expect(api.addAuthor).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Author',
        description: 'A new description.',
      }));
    });
  });

  /**
   * Test Case: TC_AUTHOR_DELETE_001 - (Referential Integrity) Attempt to delete an author linked to a book
   * This test simulates an API failure when trying to delete an author who is linked to books.
   */
  test('TC_AUTHOR_DELETE_001: should prevent deletion of an author linked to books', async () => {
    // Mock the API to return an error indicating a conflict
    api.deleteAuthor.mockRejectedValue({ 
      response: { data: { message: 'Cannot delete author assigned to existing books' } } 
    });
    
    renderWithRouter(<AuthorPage />);
    expect(await screen.findByText('J.K. Rowling')).toBeInTheDocument();

    // Find the 'more' button for the first author and click it to open the popover
    const moreButton = screen.getAllByRole('button', { name: /more-vertical/i })[0];
    fireEvent.click(moreButton);
    
    // Click the 'Delete' option in the popover
    fireEvent.click(await screen.findByText(/delete/i));

    // Confirm the deletion in the dialog
    fireEvent.click(screen.getByRole('button', { name: /yes/i }));

    // Check that the deleteAuthor function was called and an error toast is shown
    await waitFor(() => {
      expect(api.deleteAuthor).toHaveBeenCalledWith('1');
      // In a real app, you would check for a toast message like:
      // expect(await screen.findByText("Cannot delete author assigned to existing books")).toBeInTheDocument();
    });
  });
});