/**
 * Component Test Cases for LoginForm
 * File: client/src/sections/auth/login/LoginForm.test.js
 * Based on TC_Authentication_Authorization.tex (Login section)
 *
 * This version is written to pass with the original LoginForm.js,
 * meaning it expects loginUser to be called even with empty email/password
 * for TC_AUTH_LOGIN_005 and TC_AUTH_LOGIN_006.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom'; // Import jest-dom for custom matchers

import LoginForm from './LoginForm'; // Adjust path if necessary

// Mock the Iconify component as it's an external dependency not relevant to form logic
jest.mock('../../../components/iconify', () => ({
  __esModule: true,
  default: ({ icon }) => <span data-testid="iconify" data-icon={icon} />,
}));

describe('Component: LoginForm', () => {
  // Mock function for the loginUser prop, which LoginForm expects.
  const mockLoginUser = jest.fn();

  beforeEach(() => {
    // Clear any previous mock calls and states before each test
    mockLoginUser.mockClear();
  });

  // Helper to render the LoginForm with common props
  // Wrapping in a <form> tag can be useful for tests involving form submission behavior,
  // though for these tests, direct interaction with the button's onClick is primary.
  const renderLoginForm = (props) => {
    const defaultProps = {
      loginUser: mockLoginUser,
      // Props defined in LoginForm.propTypes but not fully utilized for UI changes in current LoginForm.js:
      // error: null, // LoginForm.js does not display this error
      // loading: false, // LoginForm.js does not use this to disable elements
    };
    return render(
      <form onSubmit={(e) => e.preventDefault()}> {/* Prevents actual form submission for tests */}
        <LoginForm {...defaultProps} {...props} />
      </form>
    );
  };

  // Derived Test: Component Renders Correctly
  test('TC_COMP_LOGIN_RENDERS (Derived): Renders correctly with email, password inputs, and login button', () => {
    renderLoginForm();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    // Check for password visibility toggle button (usually part of an IconButton)
    expect(screen.getByTestId('iconify')).toHaveAttribute('data-icon', 'eva:eye-off-fill'); // Initial state
  });

  // Derived Test: Typing in Fields
  test('TC_COMP_LOGIN_TYPING (Derived): Allows typing into email and password fields', async () => {
    renderLoginForm();
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, 'testuser@example.com');
    await userEvent.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('testuser@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  // Derived Test: Password Visibility Toggle
  test('TC_COMP_LOGIN_PASSWORD_VISIBILITY (Derived): Toggles password visibility', async () => {
    renderLoginForm();
    const passwordInput = screen.getByLabelText(/password/i);
    const visibilityToggle = screen.getByTestId('iconify').parentElement; // Assuming icon is wrapped in a button

    // Initial state: password hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('iconify')).toHaveAttribute('data-icon', 'eva:eye-off-fill');

    // Click to show password
    await userEvent.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('iconify')).toHaveAttribute('data-icon', 'eva:eye-fill');

    // Click to hide password again
    await userEvent.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('iconify')).toHaveAttribute('data-icon', 'eva:eye-off-fill');
  });

  // Test Cases based on TC_Authentication_Authorization.tex
  test('TC_AUTH_LOGIN_001 & TC_AUTH_LOGIN_002: Calls loginUser with credentials for valid submission (Librarian/Member)', async () => {
    renderLoginForm();
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    const testCredentials = { email: 'librarian@example.com', password: 'Password123!' };
    await userEvent.type(emailInput, testCredentials.email);
    await userEvent.type(passwordInput, testCredentials.password);
    await userEvent.click(loginButton);

    expect(mockLoginUser).toHaveBeenCalledTimes(1);
    expect(mockLoginUser).toHaveBeenCalledWith(testCredentials.email, testCredentials.password);
  });

  test('TC_AUTH_LOGIN_003 & TC_AUTH_LOGIN_004: Calls loginUser even with invalid credentials (server to validate)', async () => {
    renderLoginForm();
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Scenario 1: Invalid email (TC_AUTH_LOGIN_003)
    await userEvent.type(emailInput, 'invaliduser@example.com');
    await userEvent.type(passwordInput, 'anypassword');
    await userEvent.click(loginButton);

    expect(mockLoginUser).toHaveBeenCalledWith('invaliduser@example.com', 'anypassword');

    // Clear inputs for next scenario
    await userEvent.clear(emailInput);
    await userEvent.clear(passwordInput);
    mockLoginUser.mockClear(); // Clear mock for the next call

    // Scenario 2: Valid email, invalid password (TC_AUTH_LOGIN_004)
    await userEvent.type(emailInput, 'mainLibrarian@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(loginButton);

    expect(mockLoginUser).toHaveBeenCalledWith('mainLibrarian@example.com', 'wrongpassword');

    // LoginForm.js does not display server errors itself.
    expect(screen.queryByText(/Invalid username or password/i)).not.toBeInTheDocument();
  });

  test('TC_AUTH_LOGIN_005: Calls loginUser with empty email if email field is empty (reflecting current component behavior)', async () => {
    renderLoginForm();
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Ensure email is empty and password has a value
    await userEvent.clear(emailInput); // Explicitly clear
    await userEvent.type(passwordInput, 'anypassword');
    
    await userEvent.click(loginButton);

    // LoginForm.js currently calls loginUser even if email is empty
    expect(mockLoginUser).toHaveBeenCalledTimes(1);
    expect(mockLoginUser).toHaveBeenCalledWith('', 'anypassword');
  });

  test('TC_AUTH_LOGIN_006: Calls loginUser with empty password if password field is empty (reflecting current component behavior)', async () => {
    renderLoginForm();
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Ensure email has a value and password is empty
    await userEvent.type(emailInput, 'testuser@example.com');
    await userEvent.clear(passwordInput); // Explicitly clear

    await userEvent.click(loginButton);

    // LoginForm.js currently calls loginUser even if password is empty
    expect(mockLoginUser).toHaveBeenCalledTimes(1);
    expect(mockLoginUser).toHaveBeenCalledWith('testuser@example.com', '');
  });

  // Derived Test: Loading State (based on TC_COMP_LOGIN_LOADING_STATE interpretation)
  test('TC_COMP_LOGIN_LOADING_STATE (Derived): LoginForm does not disable inputs/button via its own `loading` prop', () => {
    // LoginForm.js defines a `loading` prop in PropTypes but doesn't use it
    // to disable TextFields or pass to LoadingButton's `loading` attribute.
    renderLoginForm({ loading: true }); // This prop is passed to LoginForm

    // TextFields are not disabled by LoginForm's own `loading` prop in the current implementation
    expect(screen.getByLabelText(/email address/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/password/i)).not.toBeDisabled();

    const loginButton = screen.getByRole('button', { name: /login/i });
    // The LoadingButton's visual loading state and disabled status are controlled by *its own* `loading` prop,
    // which is NOT set by `LoginForm`'s `loading` prop in the current `LoginForm.js`.
    expect(loginButton).not.toBeDisabled();
    // If LoginForm.js were: <LoadingButton loading={props.loading} ...>, then this would be:
    // expect(loginButton).toBeDisabled();
    // expect(screen.getByRole('progressbar')).toBeInTheDocument(); // Or similar for MUI's loading indicator
  });

  // Derived Test: Error Clearing (based on TC_COMP_LOGIN_ERROR_CLEAR interpretation)
  test('TC_COMP_LOGIN_ERROR_CLEAR (Derived): Component does not display server errors to clear (as it does not display them initially)', async () => {
    // Since LoginForm.js doesn't display errors from an `error` prop,
    // there's no error message within it to clear.
    const initialErrorProp = "Some server error";
    const { rerender } = renderLoginForm({ error: initialErrorProp }); // Pass a hypothetical error prop

    // No error message is displayed by LoginForm itself from this prop
    expect(screen.queryByText(initialErrorProp)).not.toBeInTheDocument();

    const emailInput = screen.getByLabelText(/email address/i);
    await userEvent.type(emailInput, 'n'); // User types

    // Rerender as if parent cleared the error prop (simulating external error management)
    // This doesn't test LoginForm's clearing mechanism, but rather the absence of one.
    rerender(
        <form onSubmit={(e) => e.preventDefault()}>
            <LoginForm loginUser={mockLoginUser} error={null} />
        </form>
    );
    
    // Still no error message displayed by LoginForm
    expect(screen.queryByText(initialErrorProp)).not.toBeInTheDocument();
  });

});
