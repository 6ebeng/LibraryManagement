/**
 * E2E Test Cases for Authentication & Authorization
 * File: cypress/e2e/authentication.cy.js
 * Based on TC_Authentication_Authorization.tex
 * Generated: 2025-05-30 12:25:29 UTC
 * Project: Library Management System
 * User: 6ebeng
 */

// TODO: Define custom commands in cypress/support/commands.js for repetitive actions like login
// Example: Cypress.Commands.add('loginAsLibrarian', (username, password) => { ... });
// Cypress.Commands.add('loginAsMember', (username, password) => { ... });

describe('E2E: Authentication & Authorization', () => {
	const testTimestamp = Date.now(); // For creating unique usernames/emails if needed

	// TODO: Set your application's baseUrl in cypress.config.js
	// TODO: Ensure your application server is running before starting Cypress tests.
	// TODO: Consider seeding your test database with necessary initial data (e.g., a default librarian account)
	// cy.exec('npm run db:seed:test'); // Example of a seed command

	beforeEach(() => {
		// Clear cookies and local storage to ensure a clean state for each test.
		cy.clearCookies();
		cy.clearLocalStorage();
		// TODO: cy.visit('/'); or cy.visit('/login'); - Navigate to the initial page
	});

	describe('User Registration (by Librarian)', () => {
		const newMemberUsername = `e2e_member_${testTimestamp}`;
		const newMemberEmail = `e2e_member_${testTimestamp}@example.com`;

		it('TC_AUTH_REG_001: Successful new user (Member) registration by Librarian', () => {
			// 1. Login as Librarian.
			cy.loginAsLibrarian('librarian_username', 'librarian_password'); // TODO: Use valid seeded librarian credentials

			// 2. Navigate to 'User Management' or 'Add User' section.
			cy.visit('/admin/users/add'); // TODO: Adjust path to your 'Add User' page
			cy.url().should('include', '/admin/users/add');

			// 3. Fill in all required fields with valid and unique data for a new 'Member'.
			cy.get('[data-testid="username-input"]').type(newMemberUsername);
			cy.get('[data-testid="password-input"]').type('ValidPassword123!');
			cy.get('[data-testid="email-input"]').type(newMemberEmail);
			cy.get('[data-testid="fullName-input"]').type('E2E Test Member');
			// TODO: Add selector for role if it's a dropdown/radio, e.g., cy.get('[data-testid="role-select"]').select('Member');

			// 4. Submit the registration form.
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();

			// Expected Results:
			// 1. System accepts the data.
			// 2. A success message "User registered successfully" (or similar) is displayed.
			cy.get('[data-testid="success-message"]').should('contain.text', 'User registered successfully'); // TODO: Adjust selector and message

			// 3. The new user appears in the list of users.
			cy.visit('/admin/users'); // TODO: Adjust path to user list page
			cy.get('[data-testid="user-list-table"]').should('contain.text', newMemberUsername);

			// 4. The new user can subsequently log in (covered by TC_AUTH_LOGIN_002).
		});

		it('TC_AUTH_REG_002: Attempt to register a new user with an existing username', () => {
			cy.loginAsLibrarian('librarian_username', 'librarian_password');
			cy.visit('/admin/users/add');

			// TODO: Ensure 'existing_e2e_user' is already in the database for this test
			cy.get('[data-testid="username-input"]').type('existing_e2e_user');
			cy.get('[data-testid="password-input"]').type('ValidPassword123!');
			cy.get('[data-testid="email-input"]').type(`another_${testTimestamp}@example.com`);
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();

			// Expected Results:
			cy.get('[data-testid="error-message"]').should('contain.text', 'Username already exists'); // TODO: Adjust selector and message
			// TODO: Verify user is not created/duplicated in user list or via an API check if necessary.
		});

		it('TC_AUTH_REG_003: Attempt to register a new user with missing required fields (e.g., password)', () => {
			cy.loginAsLibrarian('librarian_username', 'librarian_password');
			cy.visit('/admin/users/add');

			cy.get('[data-testid="username-input"]').type(`missing_fields_user_${testTimestamp}`);
			cy.get('[data-testid="email-input"]').type(`missing_${testTimestamp}@example.com`);
			// Password field is left blank
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();

			// Expected Results:
			cy.get('[data-testid="error-message-password"]').should('contain.text', 'Password is required'); // TODO: Adjust selector and message for specific field
		});

		it('TC_AUTH_REG_004: Attempt to register a new user with invalid data format (e.g., email)', () => {
			cy.loginAsLibrarian('librarian_username', 'librarian_password');
			cy.visit('/admin/users/add');

			cy.get('[data-testid="username-input"]').type(`invalid_email_user_${testTimestamp}`);
			cy.get('[data-testid="password-input"]').type('ValidPassword123!');
			cy.get('[data-testid="email-input"]').type('invalidemailformat'); // Invalid email
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();

			// Expected Results:
			cy.get('[data-testid="error-message-email"]').should('contain.text', 'Invalid email format'); // TODO: Adjust selector and message
		});
	});

	describe('User Login', () => {
		// User created in TC_AUTH_REG_001
		const memberUsernameForLogin = `e2e_member_${testTimestamp}`;

		it('TC_AUTH_LOGIN_001: Successful login with valid Librarian credentials', () => {
			cy.visit('/login'); // TODO: Adjust path to your login page
			cy.get('[data-testid="username-input"]').type('librarian_username'); // TODO: Use valid seeded librarian credentials
			cy.get('[data-testid="password-input"]').type('librarian_password');
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();

			// Expected Results:
			cy.url().should('include', '/admin/dashboard'); // TODO: Adjust Librarian dashboard path
			cy.get('[data-testid="librarian-dashboard-welcome"]').should('be.visible'); // TODO: Adjust selector
			// TODO: Verify Librarian-specific functionalities are visible/accessible (e.g., a link to User Management)
		});

		it('TC_AUTH_LOGIN_002: Successful login with valid Member credentials', () => {
			// This test depends on TC_AUTH_REG_001 successfully creating a member.
			// Consider creating the user via API in a beforeEach if tests need to be independent.
			cy.visit('/login');
			cy.get('[data-testid="username-input"]').type(memberUsernameForLogin);
			cy.get('[data-testid="password-input"]').type('ValidPassword123!'); // Password from TC_AUTH_REG_001
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();

			// Expected Results:
			cy.url().should('include', '/member/dashboard'); // TODO: Adjust Member dashboard path
			cy.get('[data-testid="member-dashboard-welcome"]').should('be.visible'); // TODO: Adjust selector
			// TODO: Verify Member-specific functionalities are visible/accessible
		});

		it('TC_AUTH_LOGIN_003: Attempt login with invalid username', () => {
			cy.visit('/login');
			cy.get('[data-testid="username-input"]').type('nonexistent_e2e_user');
			cy.get('[data-testid="password-input"]').type('anypassword');
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();

			// Expected Results:
			cy.get('[data-testid="error-message"]').should('contain.text', 'Invalid username or password'); // TODO: Adjust selector and message
			cy.url().should('include', '/login'); // Stays on login page
		});

		it('TC_AUTH_LOGIN_004: Attempt login with valid username but invalid password', () => {
			cy.visit('/login');
			cy.get('[data-testid="username-input"]').type(memberUsernameForLogin); // Valid user
			cy.get('[data-testid="password-input"]').type('WrongPassword123!'); // Invalid password
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();

			// Expected Results:
			cy.get('[data-testid="error-message"]').should('contain.text', 'Invalid username or password');
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_LOGIN_005: Attempt login with empty username field', () => {
			cy.visit('/login');
			// Username field left empty
			cy.get('[data-testid="password-input"]').type('anypassword');
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();

			// Expected Results:
			cy.get('[data-testid="error-message-username"]').should('contain.text', 'Username is required'); // TODO: Adjust selector for field-specific error
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_LOGIN_006: Attempt login with empty password field', () => {
			cy.visit('/login');
			cy.get('[data-testid="username-input"]').type(memberUsernameForLogin);
			// Password field left empty
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();

			// Expected Results:
			cy.get('[data-testid="error-message-password"]').should('contain.text', 'Password is required'); // TODO: Adjust selector
			cy.url().should('include', '/login');
		});
	});

	describe('User Logout', () => {
		it('TC_AUTH_LOGOUT_001: Successful logout for a logged-in Librarian', () => {
			cy.loginAsLibrarian('librarian_username', 'librarian_password');
			cy.url().should('include', '/admin/dashboard'); // Verify login

			cy.get('[data-testid="logout-button"]').click(); // TODO: Adjust logout button selector

			// Expected Results:
			cy.url().should('match', /\/login|\/$/); // Redirected to login or public homepage. TODO: Adjust regex if needed.
			// Verify session termination by trying to access a protected page
			cy.visit('/admin/dashboard', { failOnStatusCode: false }); // Allow navigation to potentially restricted page
			cy.url().should('match', /\/login|\/$/); // Should be redirected
		});

		it('TC_AUTH_LOGOUT_002: Successful logout for a logged-in Member', () => {
			// Use member created in TC_AUTH_REG_001 or create/login a member here
			cy.loginAsMember(`e2e_member_${testTimestamp}`, 'ValidPassword123!'); // TODO: Adjust/create this custom command
			cy.url().should('include', '/member/dashboard');

			cy.get('[data-testid="logout-button"]').click();

			// Expected Results:
			cy.url().should('match', /\/login|\/$/);
			cy.visit('/member/dashboard', { failOnStatusCode: false });
			cy.url().should('match', /\/login|\/$/);
		});
	});

	describe('Role-Based Access Control (RBAC)', () => {
		it('TC_AUTH_RBAC_001: Verify Librarian can access Librarian-specific features', () => {
			cy.loginAsLibrarian('librarian_username', 'librarian_password');

			// Attempt to navigate to 'User Management' section.
			cy.visit('/admin/users'); // TODO: Adjust path
			cy.get('[data-testid="user-management-page-title"]').should('be.visible'); // TODO: Adjust selector

			// Attempt to navigate to 'Book Management' (add/edit/delete books).
			cy.visit('/admin/books/add'); // TODO: Adjust path
			cy.get('[data-testid="add-book-page-title"]').should('be.visible'); // TODO: Adjust selector
			// TODO: Add more checks for specific CRUD operations if UI elements exist and are testable
		});

		it('TC_AUTH_RBAC_002: Verify Member cannot access Librarian-specific features', () => {
			cy.loginAsMember(`e2e_member_${testTimestamp}`, 'ValidPassword123!');

			// Check if 'User Management' link/button is visible (it should NOT be).
			cy.get('a[href="/admin/users"]').should('not.exist'); // TODO: Adjust selector for navigation item

			// Attempt to navigate directly to the User Management URL.
			cy.visit('/admin/users', { failOnStatusCode: false });
			cy.url().should('not.include', '/admin/users');
			cy.url().should('include', '/member/dashboard'); // Or an access-denied page / login page. TODO: Adjust expected redirect.

			// Check if 'Add Book' or 'Edit Book' options are available.
			cy.get('a[href="/admin/books/add"]').should('not.exist');
		});

		it('TC_AUTH_RBAC_003: Verify Member can access Member-specific features', () => {
			cy.loginAsMember(`e2e_member_${testTimestamp}`, 'ValidPassword123!');

			// Attempt to navigate to 'Search Books' page.
			cy.visit('/member/search-books'); // TODO: Adjust path
			cy.get('[data-testid="search-books-page-title"]').should('be.visible'); // TODO: Adjust selector

			// Attempt to view 'My Borrowal History'.
			cy.visit('/member/borrow-history'); // TODO: Adjust path
			cy.get('[data-testid="borrow-history-page-title"]').should('be.visible'); // TODO: Adjust selector
		});

		it('TC_AUTH_RBAC_004: Verify guest (not logged in) user access to public pages and restriction from protected pages', () => {
			// Ensure no user is logged in (Cypress clears session before each test by default)
			// Attempt to navigate to the login page.
			cy.visit('/login');
			cy.url().should('include', '/login'); // Login page is accessible.

			// Attempt to navigate to a public book search page (if applicable).
			// cy.visit('/public/search-books'); // TODO: Uncomment and adjust if such a page exists
			// cy.get('[data-testid="public-search-title"]').should('be.visible');

			// Attempt to navigate to 'User Management' URL.
			cy.visit('/admin/users', { failOnStatusCode: false });
			cy.url().should('include', '/login'); // Should be denied and redirected to login.

			// Attempt to navigate to 'My Borrowal History' URL.
			cy.visit('/member/borrow-history', { failOnStatusCode: false });
			cy.url().should('include', '/login'); // Should be denied and redirected to login.
		});
	});
});
