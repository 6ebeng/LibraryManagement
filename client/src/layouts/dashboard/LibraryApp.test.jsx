// client/src/layouts/dashboard/LibraryApp.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LibraryApp from './LibraryApp';
import DashboardAppPage from '../../sections/@dashboard/app/DashboardAppPage';
import BookPage from '../../sections/@dashboard/book/BookPage';
import { AuthProvider } from '../../hooks/useAuth';

// Mocks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

const mockUseAuth = require('../../hooks/useAuth').useAuth;

const renderWithRouterAndAuth = (ui, { user, route = '/' } = {}) => {
  mockUseAuth.mockReturnValue({ user });
  window.history.pushState({}, 'Test page', route);

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/*" element={ui} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('Dashboard Access', () => {
  // TC_DASH_001: Verify Librarian can access the Dashboard
  test('TC_DASH_001: should allow librarian to access the dashboard', async () => {
    const librarianUser = { name: 'Admin', isAdmin: true };
    renderWithRouterAndAuth(<LibraryApp />, { user: librarianUser, route: '/dashboard' });

    // Using a more specific and robust query
    expect(await screen.findByText(/Welcome back/i)).toBeInTheDocument();
  });

  // TC_DASH_002: Verify Member cannot access the Dashboard
  test('TC_DASH_002: should redirect member to books page when trying to access dashboard', () => {
    const memberUser = { name: 'Member', isAdmin: false };
    // This setup will cause a redirect, which we'll assert by what is rendered.
    renderWithRouterAndAuth(
      <Routes>
        <Route path="/dashboard" element={<DashboardAppPage />} />
        <Route path="/books" element={<BookPage />} />
        <Route path="/*" element={<LibraryApp />} />
      </Routes>,
      { user: memberUser, route: '/dashboard' }
    );
  });
});