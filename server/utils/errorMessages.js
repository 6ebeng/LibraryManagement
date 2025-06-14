// Centralized Error Messages for Library Management System

const errorMessages = {
	// Authentication Errors
	auth: {
		emailRequired: 'Email address is required',
		passwordRequired: 'Password is required',
		invalidCredentials: 'Invalid email or password. Please check your credentials and try again.',
		userNotFound: 'No account found with this email address. Please check your email or register.',
		incorrectPassword: 'The password you entered is incorrect. Please try again.',
		userAlreadyExists: 'An account with this email already exists. Please login or use a different email.',
		loginRequired: 'Please login to access this feature',
		notAuthorized: 'You do not have permission to access this feature. Only librarians can perform this action.',
		sessionExpired: 'Your session has expired. Please login again.',
	},

	// Book Management Errors
	book: {
		notFound: 'Book not found. It may have been deleted or the ID is incorrect.',
		titleRequired: 'Book title is required',
		authorRequired: 'Please select an author for the book',
		genreRequired: 'Please select a genre for the book',
		isbnRequired: 'ISBN is required for book identification',
		invalidISBN: 'Please enter a valid ISBN format',
		duplicateISBN: 'A book with this ISBN already exists in the system',
		cannotDelete: 'Cannot delete this book as it has active borrowals',
		invalidData: 'Invalid book data. Please check all fields and try again.',
		createFailed: 'Failed to add book. Please check all required fields.',
		updateFailed: 'Failed to update book information. Please try again.',
		deleteFailed: 'Failed to delete book. Please try again.',
	},

	// User Management Errors
	user: {
		notFound: 'User not found',
		nameRequired: 'User name is required',
		emailRequired: 'Email address is required',
		invalidEmail: 'Please enter a valid email address',
		passwordRequired: 'Password is required',
		weakPassword: 'Password must be at least 8 characters long',
		createFailed: 'Failed to create user account. Please try again.',
		updateFailed: 'Failed to update user information. Please try again.',
		deleteFailed: 'Cannot delete user with active borrowals',
		accessDenied: 'Access denied. Only librarians can manage users.',
	},

	// Borrowal Errors
	borrowal: {
		bookNotAvailable: 'This book is currently not available for borrowing',
		alreadyBorrowed: 'You have already borrowed this book',
		borrowLimitExceeded: 'You have reached your borrowing limit. Please return some books first.',
		notFound: 'Borrowal record not found',
		cannotReturn: 'This book has already been returned',
		overdue: 'This book is overdue. Please return it as soon as possible.',
		createFailed: 'Failed to create borrowal record. Please try again.',
		returnFailed: 'Failed to process book return. Please try again.',
	},

	// General Errors
	general: {
		serverError: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
		invalidRequest: 'Invalid request. Please check your data and try again.',
		databaseError: 'Database error occurred. Please try again later.',
		networkError: 'Network error. Please check your internet connection and try again.',
		validationError: 'Please check all required fields and try again.',
		notFound: 'The requested resource was not found.',
		unauthorized: 'You need to be logged in to perform this action.',
		forbidden: 'You do not have permission to perform this action.',
	},
};

// Helper function to get error message with fallback
const getErrorMessage = (category, key, fallback) => {
	if (errorMessages[category] && errorMessages[category][key]) {
		return errorMessages[category][key];
	}
	return fallback || errorMessages.general.serverError;
};

module.exports = {
	errorMessages,
	getErrorMessage,
};
