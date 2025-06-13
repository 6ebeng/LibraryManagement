import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import GenrePage from './GenrePage';

// Mocking API calls and other dependencies
jest.mock('../../../utils/api', () => ({
  getGenres: jest.fn(),
  addGenre: jest.fn(),
  deleteGenre: jest.fn(),
}));
const mockUseAuth = require('../../../hooks/useAuth');
jest.mock('../../../hooks/useAuth');

const api = require('../../../utils/api');

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('GenrePage Component Tests (Librarian)', () => {
  const mockGenres = [
    { _id: 'g1', name: 'Fantasy', description: 'Magic and supernatural elements.' },
    { _id: 'g2', name: 'Science Fiction', description: 'Futuristic concepts and technology.' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.default.mockReturnValue({
      user: { isAdmin: true },
    });
    api.getGenres.mockResolvedValue({ data: { genresList: mockGenres } });
    api.addGenre.mockResolvedValue({ data: { message: 'Genre added successfully' } });
    api.deleteGenre.mockResolvedValue({ data: { message: 'Genre deleted successfully' } });
  });

  /**
   * Test Case: TC_GENRE_CREATE_001 - Successful new genre creation by Librarian
   * Verifies that a librarian can open the form and create a new genre.
   */
  test('TC_GENRE_CREATE_001: should allow a librarian to add a new genre', async () => {
    renderWithRouter(<GenrePage />);
    fireEvent.click(screen.getByRole('button', { name: /new genre/i }));
    
    expect(await screen.findByText(/add genre/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/genre name/i), { target: { value: 'Mystery' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Whodunit stories.' } });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(api.addGenre).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Mystery',
        description: 'Whodunit stories.',
      }));
    });
  });

  /**
   * Test Case: TC_GENRE_DELETE_001 - (Referential Integrity) Attempt to delete a genre linked to a book
   * Simulates an API failure when trying to delete a genre that is in use.
   */
  test('TC_GENRE_DELETE_001: should prevent deletion of a genre linked to books', async () => {
    api.deleteGenre.mockRejectedValue({
      response: { data: { message: 'Cannot delete genre assigned to existing books' } },
    });

    renderWithRouter(<GenrePage />);
    expect(await screen.findByText('Fantasy')).toBeInTheDocument();

    const moreButton = screen.getAllByRole('button', { name: /more-vertical/i })[0];
    fireEvent.click(moreButton);
    
    fireEvent.click(await screen.findByText(/delete/i));
    fireEvent.click(screen.getByRole('button', { name: /yes/i }));

    await waitFor(() => {
      expect(api.deleteGenre).toHaveBeenCalledWith('g1');
      // Check for toast message if implemented
    });
  });
});