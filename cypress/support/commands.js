// cypress/support/commands.js

// Enhanced login command for Librarian with better error handling and validation
Cypress.Commands.add('loginAsLibrarian', (email, password) => {
	// Use default test credentials if not provided
	const librarianEmail = email || Cypress.env('TEST_LIBRARIAN_EMAIL') || 'mainLibrarian@example.com';
	const librarianPassword = password || Cypress.env('TEST_LIBRARIAN_PASSWORD') || 'Password123!';

	cy.session(
		['librarian', librarianEmail, librarianPassword], // Unique session key
		() => {
			// Clear any existing localStorage/cookies
			cy.clearLocalStorage();
			cy.clearCookies();

			// Visit login page
			cy.visit('/login');

			// Wait for page to load completely
			cy.contains('Sign in').should('be.visible');

			// Fill in credentials with proper waiting
			cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').clear().type(librarianEmail);

			cy.get('input[name="password"]', { timeout: 10000 }).should('be.visible').clear().type(librarianPassword);

			// Submit the form - using the LoadingButton which doesn't have type="submit"
			cy.contains('button', 'Login').click();

			// Wait for successful login and redirect
			cy.url().should('include', '/dashboard', { timeout: 15000 });

			// Verify user is logged in by checking for user data in localStorage
			cy.window().its('localStorage').invoke('getItem', 'user').should('exist');

			// Additional verification - check for librarian-specific elements
			cy.get('[data-testid="account-popover"], .MuiAvatar-root', { timeout: 10000 }).should('be.visible');
		},
		{
			cacheAcrossSpecs: true,
			validate() {
				// Validate that the session is still valid
				cy.window().its('localStorage').invoke('getItem', 'user').should('exist');
				cy.url().should('include', '/dashboard');
			},
		}
	);
});

// Enhanced login command for Member with better error handling and validation
Cypress.Commands.add('loginAsMember', (email, password) => {
	// Use default test credentials if not provided
	const memberEmail = email || Cypress.env('TEST_MEMBER_EMAIL') || 'testmember@example.com';
	const memberPassword = password || Cypress.env('TEST_MEMBER_PASSWORD') || 'MemberPass123!';

	cy.session(
		['member', memberEmail, memberPassword], // Unique session key
		() => {
			// Clear any existing localStorage/cookies
			cy.clearLocalStorage();
			cy.clearCookies();

			// Visit login page
			cy.visit('/login');

			// Wait for page to load completely
			cy.contains('Sign in').should('be.visible');

			// Fill in credentials with proper waiting
			cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').clear().type(memberEmail);

			cy.get('input[name="password"]', { timeout: 10000 }).should('be.visible').clear().type(memberPassword);

			// Submit the form - using the LoadingButton
			cy.contains('button', 'Login').click();

			// Wait for successful login and redirect to books page
			cy.url().should('include', '/books', { timeout: 15000 });

			// Verify user is logged in by checking for user data in localStorage
			cy.window().its('localStorage').invoke('getItem', 'user').should('exist');

			// Additional verification - check for member-specific elements
			cy.get('[data-testid="account-popover"], .MuiAvatar-root', { timeout: 10000 }).should('be.visible');
		},
		{
			cacheAcrossSpecs: true,
			validate() {
				// Validate that the session is still valid
				cy.window().its('localStorage').invoke('getItem', 'user').should('exist');
				cy.url().should('include', '/books');
			},
		}
	);
});

// Utility command to logout user
Cypress.Commands.add('logout', () => {
	cy.get('[data-testid="account-popover"], .MuiAvatar-root').click();
	cy.contains('Logout').click();
	cy.url().should('include', '/login');
	cy.window().its('localStorage').invoke('getItem', 'user').should('not.exist');
});

// Utility command to check if user is logged in
Cypress.Commands.add('checkLoggedIn', (userType = 'any') => {
	cy.window()
		.its('localStorage')
		.invoke('getItem', 'user')
		.then((userStr) => {
			if (userStr) {
				const user = JSON.parse(userStr);
				if (userType === 'librarian') {
					expect(user.isAdmin).to.be.true;
				} else if (userType === 'member') {
					expect(user.isAdmin).to.be.false;
				}
			}
		});
});

// Command to seed test data if needed
Cypress.Commands.add('seedTestData', () => {
	// This would make API calls to seed your database with test data
	// Adjust the API endpoint based on your backend setup
	cy.request({
		method: 'POST',
		url: `${Cypress.env('API_URL')}/api/test/seed`,
		failOnStatusCode: false, // Don't fail if endpoint doesn't exist
	});
});

// Command to clean test data
Cypress.Commands.add('cleanTestData', () => {
	// This would clean up test data from your database
	cy.request({
		method: 'DELETE',
		url: `${Cypress.env('API_URL')}/api/test/cleanup`,
		failOnStatusCode: false, // Don't fail if endpoint doesn't exist
	});
});

// Command to wait for page to be fully loaded
Cypress.Commands.add('waitForPageLoad', () => {
	cy.window().should('have.property', 'React');
	cy.get('[data-testid="loading"]', { timeout: 1000 }).should('not.exist');
});

// Command to handle Material-UI loading states
Cypress.Commands.add('waitForMUILoad', () => {
	cy.get('.MuiCircularProgress-root', { timeout: 1000 }).should('not.exist');
	cy.get('.MuiSkeleton-root', { timeout: 1000 }).should('not.exist');
});

// Enhanced command for API requests with authentication
Cypress.Commands.add('apiRequest', (method, url, body = {}) => {
	return cy
		.window()
		.its('localStorage')
		.invoke('getItem', 'user')
		.then((userStr) => {
			const headers = {
				'Content-Type': 'application/json',
			};

			// Add authorization if user is logged in
			if (userStr) {
				const user = JSON.parse(userStr);
				if (user.token) {
					headers.Authorization = `Bearer ${user.token}`;
				}
			}

			return cy.request({
				method,
				url: `${Cypress.env('API_URL')}${url}`,
				body,
				headers,
				failOnStatusCode: false,
			});
		});
});
