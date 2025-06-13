import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BorrowalPage from './BorrowalPage';
import * as api from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';

// Mock dependencies
jest.mock('../../../utils/api');
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
    { _id: '1', book: { name: 'The Lord of the Rings' }, member: { name: 'John Doe' }, status: 'Borrowed', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    { _id: '2', book: { name: 'The Hobbit' }, member: { name: 'Jane Smith' }, status: 'Returned', dueDate: '2025-05-15', returnedDate: '2025-05-14' },
    { _id: '3', book: { name: '1984' }, member: { name: 'Peter Jones' }, status: 'Overdue', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  // Before each test, reset API mocks
  beforeEach(() => {
    jest.clearAllMocks();
    api.getAllBorrowals.mockResolvedValue({ data: { borrowalsList: mockBorrowals } });
    api.addBorrowal.mockResolvedValue({ data: { success: true } });
    api.updateBorrowal.mockResolvedValue({ data: { success: true } });
    api.getAllBooks.mockResolvedValue({ data: { booksList: [{ _id: 'book1', name: 'Available Book', isAvailable: true }] } });
  });

  describe('Role-Based View Tests', () => {
    // Test Case ID: TC_BORW_VIEW_002
    test('TC_BORW_VIEW_002: Librarian should see all borrowal records', async () => {
      useAuth.mockReturnValue({ user: mockLibrarian });
      renderWithRouter(<BorrowalPage />);
      // Assert all mock books are visible
      expect(await screen.findByText('The Lord of the Rings')).toBeInTheDocument();
      expect(await screen.findByText('The Hobbit')).toBeInTheDocument();
      expect(await screen.findByText('1984')).toBeInTheDocument();
    });

    // Test Case ID: TC_BORW_VIEW_001
    test('TC_BORW_VIEW_001: Member should see only their own borrowal records', async () => {
      useAuth.mockReturnValue({ user: mockMember });
      // Filter mock data to simulate member-specific API response
      const memberBorrowals = mockBorrowals.filter(b => b.member.name === mockMember.name);
      api.getAllBorrowals.mockResolvedValue({ data: { borrowalsList: memberBorrowals } });
      renderWithRouter(<BorrowalPage />);
      // Assert only the member's book is visible
      expect(await screen.findByText('The Lord of the Rings')).toBeInTheDocument();
      expect(screen.queryByText('The Hobbit')).not.toBeInTheDocument();
    });
  });

  describe('Borrowal Creation (State: None -> Borrowed)', () => {
    // Test Case ID: TC_STATE_BORROW_001, TC_BORW_ADD_001, TC_BORW_ADD_002
    test('TC_STATE_BORROW_001: Should create a new borrowal with "Borrowed" status', async () => {
      useAuth.mockReturnValue({ user: mockLibrarian });
      renderWithRouter(<BorrowalPage />);
      
      fireEvent.click(screen.getByRole('button', { name: /new borrowal/i }));
      
      await waitFor(() => {
        fireEvent.change(screen.getByLabelText(/book/i), { target: { value: 'book1' } });
      });
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      // Verify API was called to create the borrowal
      await waitFor(() => {
        expect(api.addBorrowal).toHaveBeenCalledWith(expect.objectContaining({ book: 'book1' }));
      });
    });
  });

  describe('Borrowal State Transition Tests (As Librarian)', () => {
    beforeEach(() => {
        useAuth.mockReturnValue({ user: mockLibrarian });
    });

    test("TC_STATE_BORROW_002 & TC_BORW_UPD_001", async () => {
      renderWithRouter(<BorrowalPage />);
      // Find the row for the 'Borrowed' book and open the edit menu
      const borrowedRow = (await screen.findByText('The Lord of the Rings')).closest('tr');
      fireEvent.click(borrowedRow.querySelector('[aria-label="more-vertical"]'));
      fireEvent.click(await screen.findByText(/edit/i));

      // In the dialog, change the status and submit
      await waitFor(() => {
        fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'Returned' } });
      });
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify the update API was called with the new state
      await waitFor(() => {
        expect(api.updateBorrowal).toHaveBeenCalledWith('1', expect.objectContaining({ status: 'Returned' }));
      });
    });

    // Test Case ID: TC_STATE_BORROW_003
    test("TC_STATE_BORROW_003: Should display 'Overdue' status for past due date items", async () => {
      renderWithRouter(<BorrowalPage />);
      const overdueRow = (await screen.findByText('1984')).closest('tr');
      // This assertion depends on the Label component rendering the status text
      const overdueLabel = overdueRow.querySelector('.MuiChip-label');
      expect(overdueLabel).toHaveTextContent('Overdue');
    });

    // Test Case ID: TC_STATE_BORROW_004
    test("TC_STATE_BORROW_004: Should transition status from 'Overdue' to 'Returned'", async () => {
      renderWithRouter(<BorrowalPage />);
      const overdueRow = (await screen.findByText('1984')).closest('tr');
      fireEvent.click(overdueRow.querySelector('[aria-label="more-vertical"]'));
      fireEvent.click(await screen.findByText(/edit/i));

      await waitFor(() => {
        fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'Returned' } });
      });
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(api.updateBorrowal).toHaveBeenCalledWith('3', expect.objectContaining({ status: 'Returned' }));
      });
    });
    
    // Test Case ID: TC_STATE_BORROW_005 (New)
    test("TC_STATE_BORROW_005: Should not allow invalid transition from 'Returned'", async () => {
        renderWithRouter(<BorrowalPage />);
        const returnedRow = (await screen.findByText('The Hobbit')).closest('tr');
        const moreButton = returnedRow.querySelector('[aria-label="more-vertical"]');

        // For 'Returned' items, the edit button should ideally be disabled or absent.
        // This test checks that the button does not exist.
        expect(moreButton).toBeNull();
    });
  });
});
