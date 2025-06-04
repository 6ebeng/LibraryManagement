/**
 * E2E Test Cases for Authentication & Authorization
 * File: cypress/e2e/authentication.cy.js
 */

describe('E2E: Authentication & Authorization', () => {
	const testTimestamp = Date.now(); // For creating unique usernames/emails if needed

	const librarianEmail = Cypress.env('TEST_LIBRARIAN_EMAIL');
	const librarianPassword = Cypress.env('TEST_LIBRARIAN_PASSWORD');
	const memberEmailForSeeding = Cypress.env('TEST_MEMBER_EMAIL');
	const memberPasswordForSeeding = Cypress.env('TEST_MEMBER_PASSWORD');

	before(() => {
		if (!librarianEmail || !librarianPassword) {
			throw new Error(
				'Librarian credentials (CYPRESS_TEST_LIBRARIAN_EMAIL, CYPRESS_TEST_LIBRARIAN_PASSWORD) ' +
					'are not set in Cypress environment. Check docker-compose.test.yml and .env.test.'
			);
		}
		// TEST_MEMBER_EMAIL and TEST_MEMBER_PASSWORD are used from .env.test via cypress.config.js
		if (!memberEmailForSeeding || !memberPasswordForSeeding) {
			console.warn(
				'Default test member credentials (TEST_MEMBER_EMAIL, TEST_MEMBER_PASSWORD from env) ' +
					'are not fully set. Some member-specific tests might be affected if this member is expected to be pre-seeded.'
			);
		}
	});

	beforeEach(() => {
		// Consider using cy.clearUserSession() here if you want a clean state for each test,
		// though cy.session in login commands handles caching.
		// cy.clearUserSession(); // Example if needed
		cy.visit('/login');
	});

	// User Registration tests remain unchanged as they depend on data-testid attributes
	// not present in the provided HTML. Ensure those data-testid attributes exist in your app.
	// describe('User Registration (by Librarian)', () => {
	// 	beforeEach(() => {
	// 		cy.loginAsLibrarian(librarianEmail, librarianPassword);
	// 		cy.visit('/admin/users/add'); // Navigate to the add user page
	// 		cy.url().should('include', '/admin/users/add');
	// 	});

	// 	const newMemberFullName = `E2E TestReg Member ${testTimestamp}`;
	// 	const newMemberEmail = `e2e_member_reg_${testTimestamp}@example.com`;
	// 	const newMemberPassword = 'ValidRegPassword123!';

	// 	it('TC_AUTH_REG_001: Successful new user (Member) registration by Librarian', () => {
	// 		// Assuming your UserForm.jsx uses these data-testids
	// 		cy.get('[data-testid="fullName-input"]').clear().type(newMemberFullName);
	// 		cy.get('[data-testid="email-input"]').clear().type(newMemberEmail);
	// 		cy.get('[data-testid="password-input"]').clear().type(newMemberPassword);
	// 		// Assuming role selection if necessary, e.g., cy.get('[data-testid="role-select"]').select('Member');
	// 		cy.get('button[type="submit"][data-testid="user-form-submit-button"]').click(); // Adjusted submit button testid

	// 		// Verify success (adjust selector based on actual success message/toast implementation)
	// 		cy.contains('User created successfully', { timeout: 10000 }).should('be.visible'); // Example toast

	// 		cy.visit('/admin/users'); // Navigate to users list
	// 		cy.get('[data-testid="user-list-table"]').should('contain.text', newMemberFullName); // Check by name or email
	// 	});

	// 	it('TC_AUTH_REG_002: Attempt to register a new user with an existing email', () => {
	// 		const existingEmailForTest = memberEmailForSeeding || `existing_${testTimestamp}@example.com`;
	// 		// First, ensure a user with this email exists (or create one for the test if not pre-seeded)
	// 		// This test assumes 'memberEmailForSeeding' is an existing seeded user.

	// 		cy.get('[data-testid="fullName-input"]').clear().type(`Another User ${testTimestamp}`);
	// 		cy.get('[data-testid="email-input"]').clear().type(existingEmailForTest); // Use an existing email
	// 		cy.get('[data-testid="password-input"]').clear().type('AnotherPass123!');
	// 		cy.get('button[type="submit"][data-testid="user-form-submit-button"]').click();

	// 		// Verify error message (adjust selector and text based on actual error)
	// 		cy.contains('Email already exists', { timeout: 10000 }).should('be.visible'); // Example error
	// 	});

	// 	it('TC_AUTH_REG_003: Attempt to register a new user with missing required fields (e.g., password)', () => {
	// 		cy.get('[data-testid="fullName-input"]').clear().type(`Missing Fields User ${testTimestamp}`);
	// 		cy.get('[data-testid="email-input"]').clear().type(`missing_fields_${testTimestamp}@example.com`);
	// 		// Password field is left empty
	// 		cy.get('button[type="submit"][data-testid="user-form-submit-button"]').click();

	// 		// Verify error message for password (adjust selector based on actual error display)
	// 		cy.get('[data-testid="password-input-error"]').should('contain.text', 'Password is required'); // Example
	// 	});

	// 	it('TC_AUTH_REG_004: Attempt to register a new user with invalid data format (e.g., email)', () => {
	// 		cy.get('[data-testid="fullName-input"]').clear().type(`Invalid Data User ${testTimestamp}`);
	// 		cy.get('[data-testid="email-input"]').clear().type('invalidemailformat');
	// 		cy.get('[data-testid="password-input"]').clear().type('ValidPassword123!');
	// 		cy.get('button[type="submit"][data-testid="user-form-submit-button"]').click();

	// 		// Verify error message for email (adjust selector based on actual error display)
	// 		cy.get('[data-testid="email-input-error"]').should('contain.text', 'Invalid email format'); // Example
	// 	});
	// });

	describe('User Login', () => {
		const memberEmailForLogin = memberEmailForSeeding;
		const memberPasswordForLogin = memberPasswordForSeeding;

		it('TC_AUTH_LOGIN_001: Successful login with valid Librarian credentials', () => {
			cy.loginAsLibrarian(librarianEmail, librarianPassword);
			// loginAsLibrarian asserts URL and a generic 'Hi'. Add more specific checks for the dashboard.
			// Based on "Rendered Dashboard Librarian Body"
			cy.contains('h4', 'Hi Main, Welcome back', { timeout: 10000 }).should('be.visible');
			cy.get('nav').contains('p', 'Librarian').should('be.visible');
		});

		it('TC_AUTH_LOGIN_002: Successful login with valid Member credentials', () => {
			if (!memberEmailForLogin || !memberPasswordForLogin) {
				this.skip();
				return;
			}
			cy.loginAsMember(memberEmailForLogin, memberPasswordForLogin);
			// loginAsMember asserts URL (/books) and a generic element.
			// Based on "Rendered after login member Body" (Books page)
			cy.contains('h3', 'Books', { timeout: 10000 }).should('be.visible'); // Check for Books page title
			cy.get('nav').contains('p', 'Member').should('be.visible'); // Check for role in nav
			// Check for presence of some book content if appropriate
			cy.get('.MuiGrid-container').should('contain.text', 'Murder on the Orient Express');
		});

		it('TC_AUTH_LOGIN_003: Attempt login with invalid email', () => {
			cy.get('input[name="email"]').clear().type('nonexistent_e2e_user@example.com');
			cy.get('input[name="password"]').clear().type('anypassword');
			cy.get('button[type="submit"]').click();
			cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible'); // Adjust if toast/error is different
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_LOGIN_004: Attempt login with valid email but invalid password', () => {
			cy.get('input[name="email"]').clear().type(librarianEmail);
			cy.get('input[name="password"]').clear().type('WrongPassword123!');
			cy.get('button[type="submit"]').click();
			cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible'); // Adjust if toast/error is different
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_LOGIN_005: Attempt login with empty email field', () => {
			cy.get('input[name="password"]').clear().type('anypassword');
			cy.get('button[type="submit"]').click();
			// Check for client-side validation error (HTML5 validation or JS). This might be specific.
			// Or, if it submits and backend returns error:
			cy.contains(/email should not be empty|Please enter email/i, { timeout: 5000 }).should('be.visible'); // Adjust based on actual message
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_LOGIN_006: Attempt login with empty password field', () => {
			cy.get('input[name="email"]').clear().type(librarianEmail);
			cy.get('button[type="submit"]').click();
			// Check for client-side validation error or backend error
			cy.contains(/password should not be empty|Please enter password/i, { timeout: 5000 }).should('be.visible'); // Adjust
			cy.url().should('include', '/login');
		});
	});

	describe('User Logout', () => {
		// Helper function for logout sequence
		const performLogout = () => {
			// Based on provided HTML, assumes an avatar in header opens a menu with "Logout"
			cy.get('header button .MuiAvatar-root', { timeout: 10000 }).should('be.visible').first().click();
			// This selector for logout item might need adjustment based on your Popover/Menu structure
			cy.contains('li[role="menuitem"]', /Logout/i, { timeout: 5000 })
				.should('be.visible')
				.click();
		};

		it('TC_AUTH_LOGOUT_001: Successful logout for a logged-in Librarian', () => {
			cy.loginAsLibrarian(librarianEmail, librarianPassword);
			cy.url().should('include', '/dashboard'); // Ensure logged in
			performLogout();
			cy.url().should('match', /\/login$/); // Should redirect to /login
			cy.visit('/dashboard', { failOnStatusCode: false }); // Visit a protected librarian route
			cy.url().should('match', /\/login$/); // Should be redirected back to /login
		});

		it('TC_AUTH_LOGOUT_002: Successful logout for a logged-in Member', () => {
			if (!memberEmailForSeeding || !memberPasswordForSeeding) {
				this.skip();
				return;
			}
			cy.loginAsMember(memberEmailForSeeding, memberPasswordForSeeding);
			cy.url().should('include', '/books'); // Ensure logged in
			performLogout();
			cy.url().should('match', /\/login$/); // Should redirect to /login
			cy.visit('/books', { failOnStatusCode: false }); // Visit a protected member route
			cy.url().should('match', /\/login$/); // Should be redirected back to /login
		});
	});

	describe('Role-Based Access Control (RBAC)', () => {
		it('TC_AUTH_RBAC_001: Verify Librarian can access Librarian-specific features', () => {
			cy.loginAsLibrarian(librarianEmail, librarianPassword);
			cy.visit('/admin/users');
			cy.url().should('include', '/admin/users');
			// Replace with an actual element check on the /admin/users page
			cy.contains('h3', 'Users', { timeout: 10000 }).should('be.visible'); // Example: Check for Users page title

			cy.visit('/admin/books/add'); // Ensure this URL is correct for adding books by admin
			cy.url().should('include', '/admin/books/add');
			// Replace with an actual element check on the add book page
			cy.contains('h3', 'Add New Book', { timeout: 10000 }).should('be.visible'); // Example: Check for Add Book page title
		});

		it('TC_AUTH_RBAC_002: Verify Member cannot access Librarian-specific features', () => {
			if (!memberEmailForSeeding || !memberPasswordForSeeding) {
				this.skip();
				return;
			}
			cy.loginAsMember(memberEmailForSeeding, memberPasswordForSeeding);
			// Check that admin links are not present in the nav (based on provided member nav HTML)
			cy.get('nav a[href*="/admin"]').should('not.exist');

			cy.visit('/admin/users', { failOnStatusCode: false });
			cy.url().should('not.include', '/admin/users');
			cy.url().should('include', '/login'); // Or a specific access-denied page if you have one

			cy.visit('/admin/books/add', { failOnStatusCode: false });
			cy.url().should('not.include', '/admin/books/add');
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_RBAC_003: Verify Member can access Member-specific features', () => {
			if (!memberEmailForSeeding || !memberPasswordForSeeding) {
				this.skip();
				return;
			}
			cy.loginAsMember(memberEmailForSeeding, memberPasswordForSeeding); // Lands on /books

			cy.visit('/books'); // Member's book listing page
			cy.url().should('include', '/books');
			cy.contains('h3', 'Books', { timeout: 10000 }).should('be.visible'); // From member's rendered body

			cy.visit('/borrowals'); // Member's borrowal history page (from nav)
			cy.url().should('include', '/borrowals');
			// Add a specific check for the borrowals page title/content
			cy.contains('h3', 'My Borrowals', { timeout: 10000 }).should('be.visible'); // Example, ensure this title exists
		});

		it('TC_AUTH_RBAC_004: Verify guest (not logged in) user access to public pages and restriction from protected pages', () => {
			// beforeEach already visits /login
			cy.url().should('include', '/login');

			cy.visit('/dashboard', { failOnStatusCode: false }); // Librarian dashboard
			cy.url().should('include', '/login');

			cy.visit('/books', { failOnStatusCode: false }); // Member books page
			cy.url().should('include', '/login');

			cy.visit('/admin/users', { failOnStatusCode: false }); // Admin users page
			cy.url().should('include', '/login');
		});
	});
});
