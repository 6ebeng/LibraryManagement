// client/src/sections/@dashboard/borrowal/BorrowalPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BorrowalPage from './BorrowalPage';
import * as api from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';

// Mocks
jest.mock('../../../utils/api');
jest.mock('../../../hooks/useAuth');

const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('BorrowalPage Tests', () => {
  const mockMember = { _id: 'member1', name: 'John Doe', isAdmin: false };
  const mockBorrowals = [
    { _id: '1', book: { name: 'Book A' }, member: { name: 'John Doe' }, borrowedDate: '2023-01-01', dueDate: '2023-01-15', status: 'Borrowed' },
    { _id: '2', book: { name: 'Book B' }, member: { name: 'Jane Smith' }, borrowedDate: '2023-01-02', dueDate: '2023-01-16', status: 'Borrowed' }
  ];

  beforeEach(() => {
    api.getAllBorrowals.mockResolvedValue({ data: { borrowalsList: mockBorrowals } });
    api.addBorrowal.mockResolvedValue({});
    api.updateBorrowal.mockResolvedValue({});
  });

  // TC_BORW_VIEW_002
  test('TC_BORW_VIEW_002: librarian should see all borrowals', async () => {
    useAuth.mockReturnValue({ user: { isAdmin: true } });
    renderWithRouter(<BorrowalPage />);
    expect(await screen.findByText('Book A')).toBeInTheDocument();
    expect(await screen.findByText('Book B')).toBeInTheDocument();
  });

  // TC_BORW_VIEW_001
  test('TC_BORW_VIEW_001: member should see only their borrowals', async () => {
    useAuth.mockReturnValue({ user: mockMember });
    api.getAllBorrowals.mockResolvedValue({ data: { borrowalsList: [mockBorrowals[0]] } });
    renderWithRouter(<BorrowalPage />);
    expect(await screen.findByText('Book A')).toBeInTheDocument();
    expect(screen.queryByText('Book B')).not.toBeInTheDocument();
  });

  // TC_BORW_ADD_001 & TC_BORW_ADD_002
  test('TC_BORW_ADD_001 & TC_BORW_ADD_002: should handle new borrowal request', async () => {
    useAuth.mockReturnValue({ user: mockMember });
    api.getAllBooks.mockResolvedValue({ data: { booksList: [{ _id: 'book1', name: 'Available Book', isAvailable: true }, { _id: 'book2', name: 'Unavailable Book', isAvailable: false }] } });
    renderWithRouter(<BorrowalPage />);
    fireEvent.click(screen.getByRole('button', { name: /new borrowal/i }));
    
    // TC_BORW_ADD_001
    // The form should only show available books, fulfilling TC_BORW_ADD_002 implicitly
    fireEvent.change(screen.getByLabelText(/book/i), { target: { value: 'book1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(api.addBorrowal).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  // TC_BORW_UPD_001
  test('TC_BORW_UPD_001: librarian should update borrowal status', async () => {
    useAuth.mockReturnValue({ user: { isAdmin: true } });
    renderWithRouter(<BorrowalPage />);
    const moreButton = (await screen.findAllByLabelText(/more-vertical/i))[0];
    fireEvent.click(moreButton);
    fireEvent.click(await screen.findByText(/edit/i));
    
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'Returned' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(api.updateBorrowal).toHaveBeenCalledWith('1', expect.objectContaining({ status: 'Returned' }));
    });
  });
});