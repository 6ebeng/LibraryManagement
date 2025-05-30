/**
 * Component Test Cases for LoginForm
 * File: client/src/sections/auth/login/LoginForm.test.js
 * Based on TC_Authentication_Authorization.tex (Login section)
 * Generated: 2025-05-30 12:25:29 UTC
 * Project: Library Management System
 * User: 6ebeng
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // For more realistic user interactions
import LoginForm from './LoginForm'; // TODO: Adjust path if your LoginForm.js is elsewhere

// Mock any external dependencies or context if LoginForm uses them.
// Example:
// jest.mock('../../../contexts/AuthContext', () => ({
//   useAuth: () => ({
//     login: jest.fn(), // This would be the function called by LoginForm internally if using context
//     error: null,
//     loading: false,
//   }),
// }));

describe('Component: LoginForm', () => {
  // Mock function for the onSubmit prop (assuming LoginForm takes onSubmit)
  const mockOnSubmit = jest.fn();
  // Mock function for a potential onValidationError prop if the form calls it
  const mockOnValidationError = jest.fn();

  beforeEach(() => {
    // Clear any previous mock calls and states before each test
    mockOnSubmit.mockClear();
    mockOnValidationError.mockClear();
  });

  const renderLoginForm = (props) => {
    return render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onValidationError={mockOnValidationError} // Assuming this prop for client-side errors
        error={null}    // Backend error message
        loading={false}
        {...props}      // Allow overriding default props for specific tests
      />
    );
  };

  test('TC_COMP_LOGIN_RENDERS: Renders correctly with username, password inputs and login button', () => {
    renderLoginForm();
    // Use getByLabelText if your inputs are properly labeled (recommended)
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    // Use getByRole for semantic elements like buttons
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('TC_COMP_LOGIN_TYPING: Allows typing into username and password fields', async () => {
    renderLoginForm();
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  test('TC_AUTH_LOGIN_001_COMP & TC_AUTH_LOGIN_002_COMP: Calls onSubmit with credentials for valid submission', async () => {
    // This covers successful login attempts for any role from a component perspective.
    renderLoginForm();
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(usernameInput, 'validuser');
    await userEvent.type(passwordInput, 'validpass123');
    await userEvent.click(loginButton);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      username: 'validuser',
      password: 'validpass123',
    });
    expect(mockOnValidationError).not.toHaveBeenCalled(); // No client-side validation errors
  });

  test('TC_AUTH_LOGIN_005_COMP: Shows validation error and does not call onSubmit if username is empty', async () => {
    // This assumes client-side validation within LoginForm for empty fields.
    renderLoginForm();
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(passwordInput, 'anypassword');
    await userEvent.click(loginButton);

    // TODO: Adjust how you check for the error. It could be text, an aria attribute, etc.
    // Example: expect(screen.getByTestId('username-error')).toHaveTextContent('Username is required');
    // Or, if it calls a prop:
    expect(mockOnValidationError).toHaveBeenCalledWith(expect.stringMatching(/username is required/i)); // Example
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('TC_AUTH_LOGIN_006_COMP: Shows validation error and does not call onSubmit if password is empty', async () => {
    renderLoginForm();
    const usernameInput = screen.getByLabelText(/username/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(usernameInput, 'anyusername');
    await userEvent.click(loginButton);

    // TODO: Adjust error checking
    // Example: expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
    expect(mockOnValidationError).toHaveBeenCalledWith(expect.stringMatching(/password is required/i)); // Example
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('TC_AUTH_LOGIN_003_COMP & TC_AUTH_LOGIN_004_COMP: Displays a server error message if `error` prop is provided', () => {
    // This covers scenarios where login fails due to invalid username or password (backend validation).
    const backendErrorMessage = 'Invalid username or password';
    renderLoginForm({ error: backendErrorMessage });

    // TODO: Adjust selector for where the error message is displayed
    expect(screen.getByTestId('server-error-message')).toHaveTextContent(backendErrorMessage);
    // Or if it's a more generic error display:
    // expect(screen.getByText(backendErrorMessage)).toBeInTheDocument();
  });

  test('TC_COMP_LOGIN_LOADING_STATE: Disables inputs and button, shows loading indicator when `loading` prop is true', () => {
    renderLoginForm({ loading: true });

    expect(screen.getByLabelText(/username/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    const loginButton = screen.getByRole('button', { name: /login/i }); // Or loading text like "Logging in..."
    expect(loginButton).toBeDisabled();

    // TODO: Check for a visual loading indicator if one exists
    // Example: expect(screen.getByTestId('loading-spinner')).toBeVisible();
    // Or if button text changes:
    // expect(screen.getByRole('button', { name: /logging in.../i })).toBeInTheDocument();
  });

  test('TC_COMP_LOGIN_ERROR_CLEAR: Clears server error message on new input', async () => {
    // Assumes the component or its parent logic clears the 'error' prop when user types.
    const initialError = "Old server error";
    const { rerender } = render(<LoginForm onSubmit={mockOnSubmit} error={initialError} loading={false} />);
    expect(screen.getByTestId('server-error-message')).toHaveTextContent(initialError);

    const usernameInput = screen.getByLabelText(/username/i);
    await userEvent.type(usernameInput, 'n'); // User starts typing

    // Simulate parent component clearing the error prop
    rerender(<LoginForm onSubmit={mockOnSubmit} error={null} loading={false} />);
    
    // TODO: Adjust selector for the error message
    expect(screen.queryByTestId('server-error-message')).not.toBeInTheDocument();
    // Or if error message element is always there but empty:
    // expect(screen.getByTestId('server-error-message')).toBeEmptyDOMElement();
  });
});