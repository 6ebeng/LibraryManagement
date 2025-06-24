// client/src/sections/@dashboard/book/BookPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BookPage from './BookPage';
import axios from 'axios';
import useAuth from '../../../hooks/useAuth';

// Mocks
jest.mock('axios');
jest.mock('../../../hooks/useAuth');

const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('BookPage Tests', () => {
  const mockBooks = [
    {
      _id: '1',
      name: 'The Lord of the Rings',
      author: { name: 'J.R.R. Tolkien' },
      genre: { name: 'Fantasy' },
      isAvailable: true,
      photoUrl: 'https://via.placeholder.com/150',
    },
    {
      _id: '2',
      name: '1984',
      author: { name: 'George Orwell' },
      genre: { name: 'Dystopian' },
      isAvailable: false,
      photoUrl: 'https://via.placeholder.com/150',
    },
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({
      user: {
        isAdmin: true,
      },
    });
    axios.get.mockResolvedValue({
      data: {
        success: true,
        books: mockBooks,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('TC_FUNC_BOOK_001: should display the list of books', async () => {
    renderWithRouter(<BookPage />);

    expect(await screen.findByText('The Lord of the Rings')).toBeInTheDocument();
    expect(screen.getByText('1984')).toBeInTheDocument();
  });
});