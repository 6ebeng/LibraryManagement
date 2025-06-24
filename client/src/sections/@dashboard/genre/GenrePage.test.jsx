// client/src/sections/@dashboard/genre/GenrePage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import GenrePage from './GenrePage';
import axios from 'axios';
import useAuth from '../../../hooks/useAuth';

// Mocking API calls and other dependencies
jest.mock('axios');
jest.mock('../../../hooks/useAuth');

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('GenrePage Component Tests (Librarian)', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: {
        isAdmin: true,
      },
    });
  });

  test('TC_FUNC_GENRE_001: should display a list of genres', async () => {
    const mockGenres = [
      { _id: '1', name: 'Science Fiction', description: 'Genre of speculative fiction.' },
      { _id: '2', name: 'Fantasy', description: 'Genre of speculative fiction set in a fictional universe.' },
    ];

    axios.get.mockResolvedValue({
      data: {
        success: true,
        genres: mockGenres,
      },
    });

    renderWithRouter(<GenrePage />);

    expect(await screen.findByText('Science Fiction')).toBeInTheDocument();
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
  });
});