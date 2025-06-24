// client/src/sections/@dashboard/borrowal/BorrowalPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BorrowalPage from './BorrowalPage';
import axios from 'axios';
import useAuth from '../../../hooks/useAuth';

// Mock dependencies
jest.mock('axios');
jest.mock('../../../hooks/useAuth');

// Helper to render components with React Router
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('BorrowalPage: Functionality and State Transitions', () => {
  // Mock data for users and borrowals
  const mockMember = { _id: 'member1', name: 'John Doe', isAdmin: false };
  const mockLibrarian = { _id: 'admin1', name: 'Admin User', isAdmin: true };
  const mockBorrowals = [
    {
      _id: '1',
      book: { name: 'The Lord of the Rings' },
      member: { name: 'John Doe' },
      status: 'Borrowed',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: '2',
      book: { name: '1984' },
      member: { name: 'Jane Doe' },
      status: 'Returned',
      dueDate: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockLibrarian });
    axios.get.mockResolvedValue({ data: { success: true, borrowalsList: mockBorrowals } });
  });

  test('TC_FUNC_BORROW_001: should display all borrowals for a librarian', async () => {
    renderWithRouter(<BorrowalPage />);

    expect(await screen.findByText('The Lord of the Rings')).toBeInTheDocument();
    expect(screen.getByText('1984')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });
});