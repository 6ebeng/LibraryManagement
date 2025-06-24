// client/src/sections/@dashboard/author/AuthorPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import AuthorPage from './AuthorPage';
import axios from 'axios';
import useAuth from '../../../hooks/useAuth';

// Mocking API calls and other dependencies
jest.mock('axios');
jest.mock('../../../hooks/useAuth');

// Helper to render the component with Router context
const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('AuthorPage Component Tests (Librarian)', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: {
        isAdmin: true,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('TC_FUNC_AUTHOR_001: should fetch and display authors', async () => {
    const mockAuthors = [
      {
        _id: '1',
        name: 'J.K. Rowling',
        description: 'British author, best known for the Harry Potter series.',
        photoUrl: 'https://via.placeholder.com/150',
      },
      {
        _id: '2',
        name: 'George Orwell',
        description: 'English novelist, essayist, journalist and critic.',
        photoUrl: 'https://via.placeholder.com/150',
      },
    ];

    axios.get.mockResolvedValue({
      data: {
        success: true,
        authors: mockAuthors,
      },
    });

    renderWithRouter(<AuthorPage />);

    expect(await screen.findByText('J.K. Rowling')).toBeInTheDocument();
    expect(screen.getByText('George Orwell')).toBeInTheDocument();
  });
});