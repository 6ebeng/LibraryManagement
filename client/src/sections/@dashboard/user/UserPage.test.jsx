import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import UserPage from './src/sections/@dashboard/user/UserPage';

// Mocking necessary dependencies
jest.mock('./src/utils/api', () => ({
  getUsers: jest.fn(),
  addUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.mock('./src/hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({
    user: { id: 'librarian123', role: 'Librarian' },
  }),
}));

const api = require('./src/utils/api');

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('UserPage Component Tests', () => {
  const mockUsers = [
    { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', role: 'Member', isVerified: true },
    { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', role: 'Member', isVerified: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.getUsers.mockResolvedValue({ data: { data: mockUsers } });
    api.addUser.mockResolvedValue({ data: { message: 'User added' } });
    api.updateUser.mockResolvedValue({ data: { message: 'User updated' } });
    api.deleteUser.mockResolvedValue({ data: { message: 'User deleted' } });
  });

  /**
   * Test Case: Fetch and display users
   * Verifies that the component correctly fetches and displays a list of users.
   */
  test('Should fetch and display list of users', async () => {
    renderWithRouter(<UserPage />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(api.getUsers).toHaveBeenCalledTimes(1);
  });

  /**
   * Test Case: TC_AUTH_REG_001
   * Verifies that a librarian can successfully register a new user (Member).
   */
  test('TC_AUTH_REG_001: Should allow librarian to register a new user', async () => {
    renderWithRouter(<UserPage />);
    fireEvent.click(screen.getByRole('button', { name: /New User/i }));
    
    expect(await screen.findByText('Add a new user')).toBeInTheDocument();

    // Fill out the user form
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test.user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    // The 'Role' select defaults to 'Member', which is what we want.

    fireEvent.click(screen.getByRole('button', { name: 'Add User' }));

    await waitFor(() => {
      expect(api.addUser).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test.user@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Member',
      }));
    });
  });

  /**
   * Test Case: TC_AUTH_REG_003
   * Verifies that registration fails if a mandatory field is left blank.
   */
  test('TC_AUTH_REG_003: Should show validation errors for missing fields during registration', async () => {
    renderWithRouter(<UserPage />);
    fireEvent.click(screen.getByRole('button', { name: /New User/i }));
    expect(await screen.findByText('Add a new user')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add User' }));

    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(api.addUser).not.toHaveBeenCalled();
  });

  /**
   * Test Case: TC_USER_UPDATE_001 (from Specific Features)
   * Verifies a librarian can update a user's details.
   */
  test('TC_USER_UPDATE_001: Should allow librarian to update a user', async () => {
    renderWithRouter(<UserPage />);
    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    const row = screen.getByText('John Doe').closest('tr');
    const editButton = row.querySelector('button[aria-label="edit"]');
    fireEvent.click(editButton);

    expect(await screen.findByText('Edit user')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toHaveValue('John');

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Johnny' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(api.updateUser).toHaveBeenCalledWith('1', expect.objectContaining({
        firstName: 'Johnny',
      }));
    });
  });

  /**
   * Test Case: TC_USER_DEL_001 (from Specific Features)
   * Verifies a librarian can delete a user.
   */
  test('TC_USER_DEL_001: Should allow librarian to delete a user', async () => {
    window.confirm = jest.fn(() => true);
    renderWithRouter(<UserPage />);
    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    const row = screen.getByText('John Doe').closest('tr');
    const deleteButton = row.querySelector('button[aria-label="delete"]');
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');

    await waitFor(() => {
      expect(api.deleteUser).toHaveBeenCalledWith('1');
    });
  });
});
