import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BorrowalPage from './src/sections/@dashboard/borrowal/BorrowalPage';

// Mocking dependencies
jest.mock('./src/utils/api', () => ({
  getBorrowals: jest.fn(),
  addBorrowal: jest.fn(),
  updateBorrowal: jest.fn(),
  getBooks: jest.fn(),
  getUsers: jest.fn(),
}));

// We need to control the user role for different test scenarios
const mockUseAuth = require('./src/hooks/useAuth');
jest.mock('./src/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const api = require('./src/utils/api');

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('BorrowalPage Component Tests', () => {
  // Mock data for borrowals, users, and books
  const mockLibrarian = { _id: 'librarian123', role: 'Librarian', firstName: 'Lib', lastName: 'Rarian' };
  const mockMember = { _id: 'member456', role: 'Member', firstName: 'Mem', lastName: 'Ber' };
  const mockOtherMember = { _id: 'member789', role: 'Member', firstName: 'Other', lastName: 'Mem' };

  const mockBorrowals = [
    { _id: 'b1', book: { _id: 'book1', name: 'Book One' }, member: mockMember, status: 'Borrowed', borrowedDate: new Date(), dueDate: new Date() },
    { _id: 'b2', book: { _id: 'book2', name: 'Book Two' }, member: mockOtherMember, status: 'Returned', borrowedDate: new Date(), dueDate: new Date() },
  ];
  const mockBooks = [{ _id: 'book1', name: 'Book One', isAvailable: false }];
  const mockUsers = [mockMember, mockOtherMember];

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default successful API responses
    api.getBorrowals.mockResolvedValue({ data: { data: mockBorrowals } });
    api.getBooks.mockResolvedValue({ data: { data: mockBooks } });
    api.getUsers.mockResolvedValue({ data: { data: mockUsers } });
    api.updateBorrowal.mockResolvedValue({ data: { message: 'Borrowal updated' } });
  });

  /**
   * Test Cases for Librarian Role
   */
  describe('As a Librarian', () => {
    beforeEach(() => {
      // Set the authenticated user to be a Librarian for this block of tests
      mockUseAuth.default.mockReturnValue({ user: mockLibrarian });
    });

    /**
     * Test Case: TC_UC_HISTORY_003 (Librarian View)
     * Verifies that a librarian can see all borrowal records for all members.
     */
    test('TC_UC_HISTORY_003: Should display all borrowal records', async () => {
      renderWithRouter(<BorrowalPage />);
      expect(await screen.findByText('Book One')).toBeInTheDocument();
      expect(screen.getByText('Book Two')).toBeInTheDocument();
      // Check that borrowals for different members are visible
      expect(screen.getByText('Mem Ber')).toBeInTheDocument();
      expect(screen.getByText('Other Mem')).toBeInTheDocument();
    });

    /**
     * Test Case: TC_STATE_BORROW_002 (Borrowed to Returned)
     * Verifies a librarian can update a borrowal's status from 'Borrowed' to 'Returned'.
     */
    test('TC_STATE_BORROW_002: Should allow updating a borrowal status to "Returned"', async () => {
      renderWithRouter(<BorrowalPage />);
      expect(await screen.findByText('Book One')).toBeInTheDocument();

      const row = screen.getByText('Book One').closest('tr');
      const editButton = row.querySelector('button[aria-label="edit"]');
      fireEvent.click(editButton);

      expect(await screen.findByText('Edit borrowal')).toBeInTheDocument();
      
      // Find the status select field and change its value
      // This requires careful selection based on how the component is structured
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: 'Returned' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(api.updateBorrowal).toHaveBeenCalledWith('b1', expect.objectContaining({
          status: 'Returned',
        }));
      });
    });
  });

  /**
   * Test Cases for Member Role
   */
  describe('As a Member', () => {
    beforeEach(() => {
      // Set the authenticated user to be a Member for this block of tests
      mockUseAuth.default.mockReturnValue({ user: mockMember });
    });

    /**
     * Test Case: TC_UC_HISTORY_001 (Member View - non-empty)
     * Verifies a member can see their own borrowal history.
     */
    test('TC_UC_HISTORY_001: Should display only the logged-in member\'s borrowals', async () => {
      renderWithRouter(<BorrowalPage />);
      // Should see their own borrowal
      expect(await screen.findByText('Book One')).toBeInTheDocument();
      // Should NOT see other members' borrowals
      expect(screen.queryByText('Book Two')).not.toBeInTheDocument();
    });

    /**
     * Test Case: TC_UC_HISTORY_002 (Member View - empty)
     * Verifies that a message is shown if a member has no borrowal history.
     */
    test('TC_UC_HISTORY_002: Should display a message for empty borrowal history', async () => {
      // Override the mock response for this specific test
      api.getBorrowals.mockResolvedValue({ data: { data: [] } });
      renderWithRouter(<BorrowalPage />);
      // Check for the "Not found" message in the table body. The exact text depends on the component implementation.
      expect(await screen.findByText('No data to display')).toBeInTheDocument();
    });
  });
});
