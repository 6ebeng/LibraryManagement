// client/src/sections/@dashboard/user/UserPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import UserPage from './UserPage';
import * as api from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';

// Mocks
jest.mock('../../../utils/api');
jest.mock('../../../hooks/useAuth');

const renderWithRouter = (ui) => render(ui, { wrapper: BrowserRouter });

describe('UserPage Tests', () => {
  const mockUsers = [
    { _id: '1', name: 'John Doe', email: 'john@example.com', phone: '1234567890', isAdmin: false, dob: '1990-01-01' },
    { _id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321', isAdmin: true, dob: '1985-05-05' }
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({ user: { isAdmin: true } });
    api.getAllUsers.mockResolvedValue({ data: { usersList: mockUsers } });
    api.updateUser.mockResolvedValue({});
    api.deleteUser.mockResolvedValue({});
  });

  // TC_USER_VIEW_001
  test('TC_USER_VIEW_001: should display a list of all users', async () => {
    renderWithRouter(<UserPage />);
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(await screen.findByText('Jane Smith')).toBeInTheDocument();
  });

  // TC_USER_UPD_001
  test('TC_USER_UPD_001: should update user details', async () => {
    renderWithRouter(<UserPage />);
    const moreButton = (await screen.findAllByLabelText(/more-vertical/i))[0];
    fireEvent.click(moreButton);
    fireEvent.click(await screen.findByText(/edit/i));
    
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1112223333' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(api.updateUser).toHaveBeenCalledWith('1', expect.objectContaining({ phone: '1112223333' }));
    });
  });

  // TC_USER_DEL_001
  test('TC_USER_DEL_001: should delete a user', async () => {
    renderWithRouter(<UserPage />);
    const moreButton = (await screen.findAllByLabelText(/more-vertical/i))[0];
    fireEvent.click(moreButton);
    fireEvent.click(await screen.findByText(/delete/i));
    fireEvent.click(screen.getByRole('button', { name: /yes/i }));
    await waitFor(() => {
      expect(api.deleteUser).toHaveBeenCalledWith('1');
    });
  });
});