import toast from 'react-hot-toast';

/**
 * Centralized error handler for the Library Management System frontend
 * Provides consistent error messaging across the application
 */

// Error message mappings for common scenarios
const errorMessages = {
  network: {
    noConnection: 'Cannot connect to server. Please check your internet connection',
    timeout: 'Request timed out. Please try again',
    serverDown: 'Server is not responding. Please try again later',
  },
  validation: {
    requiredField: 'Please fill in all required fields',
    invalidEmail: 'Please enter a valid email address',
    weakPassword: 'Password must be at least 8 characters long',
    invalidData: 'Please check your input and try again',
  },
  auth: {
    unauthorized: 'Please login to access this feature',
    forbidden: 'You do not have permission to perform this action',
    sessionExpired: 'Your session has expired. Please login again',
  },
  general: {
    unexpected: 'An unexpected error occurred. Please try again',
    tryAgain: 'Something went wrong. Please try again',
  }
};

/**
 * Main error handler function
 * @param {Error} error - The error object from axios or other sources
 * @param {string} context - Optional context about where the error occurred
 * @param {boolean} showToast - Whether to show a toast notification (default: true)
 * @returns {string} The error message that was displayed
 */
export const handleError = (error, context = '', showToast = true) => {
  let errorMessage = '';
  
  // Handle axios errors
  if (error.response) {
    // Server responded with an error status
    const status = error.response.status;
    const serverMessage = error.response.data?.message;
    
    switch (status) {
      case 400:
        // Bad request - validation errors
        errorMessage = serverMessage || errorMessages.validation.invalidData;
        break;
        
      case 401:
        // Unauthorized
        errorMessage = serverMessage || errorMessages.auth.unauthorized;
        break;
        
      case 403:
        // Forbidden
        errorMessage = serverMessage || errorMessages.auth.forbidden;
        break;
        
      case 404:
        // Not found
        errorMessage = serverMessage || `The requested ${context || 'resource'} was not found`;
        break;
        
      case 409:
        // Conflict (e.g., duplicate data)
        errorMessage = serverMessage || 'This item already exists';
        break;
        
      case 422:
        // Unprocessable entity
        errorMessage = serverMessage || errorMessages.validation.invalidData;
        break;
        
      case 500:
      case 502:
      case 503:
        // Server errors
        errorMessage = 'Server error. Please try again later or contact support';
        break;
        
      default:
        errorMessage = serverMessage || errorMessages.general.unexpected;
    }
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = errorMessages.network.noConnection;
  } else if (error.message) {
    // Something else went wrong
    if (error.message.includes('Network Error')) {
      errorMessage = errorMessages.network.noConnection;
    } else if (error.message.includes('timeout')) {
      errorMessage = errorMessages.network.timeout;
    } else {
      errorMessage = error.message;
    }
  } else {
    errorMessage = errorMessages.general.unexpected;
  }
  
  // Show toast if requested
  if (showToast) {
    toast.error(errorMessage);
  }
  
  // Log error for debugging
  console.error(`Error in ${context}:`, error);
  
  return errorMessage;
};

/**
 * Success handler for consistent success messaging
 * @param {string} message - The success message to display
 * @param {object} options - Additional options for the toast
 */
export const handleSuccess = (message, options = {}) => {
  toast.success(message, {
    duration: 4000,
    ...options
  });
};

/**
 * Loading handler for showing loading states
 * @param {string} message - The loading message to display
 * @returns {string} The toast ID for later dismissal
 */
export const showLoading = (message = 'Loading...') => {
  return toast.loading(message);
};

/**
 * Dismiss a specific toast
 * @param {string} toastId - The ID of the toast to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Field validation helpers
 */
export const validators = {
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isStrongPassword: (password) => {
    return password && password.length >= 8;
  },
  
  isISBN: (isbn) => {
    // Basic ISBN-10 or ISBN-13 validation
    const isbn10Regex = /^\d{9}[\d|X]$/;
    const isbn13Regex = /^\d{13}$/;
    const isbnWithDashes = isbn.replace(/-/g, '');
    return isbn10Regex.test(isbnWithDashes) || isbn13Regex.test(isbnWithDashes);
  },
  
  isRequired: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }
};

export default {
  handleError,
  handleSuccess,
  showLoading,
  dismissToast,
  validators
}; 