// client/src/sections/@dashboard/user/UserPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import UserPage from './UserPage';
import axios from 'axios';
import useAuth from '../../../hooks/useAuth';

// Mocks
jest.mock('axios');
jest.mock('../../../hooks/useAuth');

const renderWithRouter = (ui) => render(ui, { wrapper: BrowserRouter });

describe('UserPage Component Tests (Librarian)', () => {
  const mockUsers = [
    {
      _id: '1',
      name: 'John Doe',
      dob: '1990-01-01T00:00:00.000Z',
      email: 'john.doe@example.com',
      phone: '1234567890',
      isAdmin: false,
      photoUrl: 'https://via.placeholder.com/150',
    },
    {
      _id: '2',
      name: 'Jane Smith',
      dob: '1992-02-02T00:00:00.000Z',
      email: 'jane.smith@example.com',
      phone: '0987654321',
      isAdmin: true,
      photoUrl: 'https://via.placeholder.com/150',
    },
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({
      user: {
        isAdmin: true,
      },
    });
    axios.get.mockResolvedValue({ data: { success: true, users: mockUsers } });
  });

  test('TC_FUNC_USER_001: should display the list of users', async () => {
    renderWithRouter(<UserPage />);
    
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});