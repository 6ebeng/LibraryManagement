/**
 * E2E Test Cases for Authentication & Authorization
 * File: cypress/e2e/authentication.cy.js
 */

describe('E2E: Authentication & Authorization', () => {
	const testTimestamp = Date.now(); // For creating unique usernames/emails if needed

	// Retrieve credentials from Cypress environment variables
	// These are expected to be set in .env.test and passed via docker-compose.test.yml
	const librarianEmail = Cypress.env('TEST_LIBRARIAN_EMAIL');
	const librarianPassword = Cypress.env('TEST_LIBRARIAN_PASSWORD');
	const memberEmailForSeeding = Cypress.env('TEST_MEMBER_EMAIL'); // Assuming this is also in .env.test
	const memberPasswordForSeeding = Cypress.env('TEST_MEMBER_PASSWORD'); // Assuming this is also in .env.test

	before(() => {
		// Basic validation that essential credentials are set
		if (!librarianEmail || !librarianPassword) {
			throw new Error(
				'Librarian credentials (CYPRESS_TEST_LIBRARIAN_EMAIL, CYPRESS_TEST_LIBRARIAN_PASSWORD) ' +
					'are not set in Cypress environment. Check docker-compose.test.yml and .env.test.'
			);
		}
		// Optional: Check for member credentials if they are critical for all test suites
		if (!memberEmailForSeeding || !memberPasswordForSeeding) {
			console.warn(
				// Use warn as not all tests might need this specific member immediately
				'Default test member credentials (CYPRESS_TEST_MEMBER_EMAIL, CYPRESS_TEST_MEMBER_PASSWORD) ' +
					'are not fully set. Some member-specific tests might be affected if this member is expected to be pre-seeded.'
			);
		}
	});

	beforeEach(() => {
		// cy.session a_loginAsLibrariand cy.session are designed to persist session,
		// so clearing cookies/localStorage might be redundant if session is managed correctly.
		// However, it can ensure a very clean state if tests are not using cy.session or if issues arise.
		// cy.clearCookies({ log: false }); // {log: false} to keep command log cleaner
		// cy.clearLocalStorage({ log: false });

		// It's generally better to rely on cy.session to handle login state.
		// Navigating to a known public page or login page can be a good start.
		cy.visit('/login'); // Or your application's root page if it handles redirection
	});

	describe('User Registration (by Librarian)', () => {
		// For these tests, the librarian needs to be logged in.
		// We use the custom command which handles session.
		beforeEach(() => {
			cy.loginAsLibrarian(librarianEmail, librarianPassword);
			// The command should leave us on /admin/dashboard or a similar authenticated page.
		});

		const newMemberUsername = `e2e_member_reg_${testTimestamp}`;
		const newMemberEmail = `e2e_member_reg_${testTimestamp}@example.com`;
		const newMemberPassword = 'ValidRegPassword123!';

		it('TC_AUTH_REG_001: Successful new user (Member) registration by Librarian', () => {
			// Navigate to 'User Management' or 'Add User' section.
			cy.visit('/admin/users/add'); // Adjust path to your 'Add User' page
			cy.url().should('include', '/admin/users/add');

			// Fill in all required fields with valid and unique data for a new 'Member'.
			// Assuming your registration form uses these data-testid attributes.
			// If your User model for registration doesn't use 'username' but 'name' or 'fullName' directly, adjust accordingly.
			cy.get('[data-testid="username-input"]').clear().type(newMemberUsername); // Or 'name-input' if that's the field
			cy.get('[data-testid="email-input"]').clear().type(newMemberEmail);
			cy.get('[data-testid="fullName-input"]').clear().type('E2E Test Reg Member'); // Or use 'name-input'
			cy.get('[data-testid="password-input"]').clear().type(newMemberPassword);
			// Add selector for role if it's a dropdown/radio, e.g.,
			// cy.get('[data-testid="role-select"]').select('Member'); // Ensure 'Member' is a valid value/text

			// Submit the registration form.
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();

			// Expected Results:
			cy.get('[data-testid="success-message"]').should('contain.text', 'User registered successfully'); // Adjust selector and message

			// Verify the new user appears in the list of users.
			cy.visit('/admin/users'); // Adjust path to user list page
			cy.get('[data-testid="user-list-table"]').should('contain.text', newMemberUsername); // Or check by email/fullName
		});

		it('TC_AUTH_REG_002: Attempt to register a new user with an existing email', () => {
			// First, ensure a user with a specific email exists. This could be the pre-seeded librarian.
			// Or, create a user here for this specific test scenario.
			const existingEmailForTest = `existing_${testTimestamp}@example.com`;
			cy.visit('/admin/users/add');
			cy.get('[data-testid="username-input"]').clear().type(`user_with_existing_email_${testTimestamp}`);
			cy.get('[data-testid="email-input"]').clear().type(existingEmailForTest);
			cy.get('[data-testid="fullName-input"]').clear().type('User Existing Email');
			cy.get('[data-testid="password-input"]').clear().type('TempPass123!');
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();
			cy.get('[data-testid="success-message"]').should('be.visible'); // Wait for first registration

			// Attempt to register another user with the same email
			cy.visit('/admin/users/add');
			cy.get('[data-testid="username-input"]').clear().type(`another_user_${testTimestamp}`);
			cy.get('[data-testid="email-input"]').clear().type(existingEmailForTest); // Using the same email
			cy.get('[data-testid="fullName-input"]').clear().type('Another User Same Email');
			cy.get('[data-testid="password-input"]').clear().type('AnotherPass123!');
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();

			cy.get('[data-testid="error-message"]').should('contain.text', 'Email already exists'); // Adjust selector and message
		});

		it('TC_AUTH_REG_003: Attempt to register a new user with missing required fields (e.g., password)', () => {
			cy.visit('/admin/users/add');
			cy.get('[data-testid="username-input"]').clear().type(`missing_fields_user_${testTimestamp}`);
			cy.get('[data-testid="email-input"]').clear().type(`missing_${testTimestamp}@example.com`);
			// Password field is intentionally left blank
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();

			cy.get('[data-testid="error-message-password"]').should('contain.text', 'Password is required'); // Adjust selector for specific field error
		});

		it('TC_AUTH_REG_004: Attempt to register a new user with invalid data format (e.g., email)', () => {
			cy.visit('/admin/users/add');
			cy.get('[data-testid="username-input"]').clear().type(`invalid_data_user_${testTimestamp}`);
			cy.get('[data-testid="password-input"]').clear().type('ValidPassword123!');
			cy.get('[data-testid="email-input"]').clear().type('invalidemailformat'); // Invalid email
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();

			cy.get('[data-testid="error-message-email"]').should('contain.text', 'Invalid email format'); // Adjust selector for specific field error
		});
	});

	describe('User Login', () => {
		// For TC_AUTH_LOGIN_002, we need a member user.
		// This user could be the one from TEST_MEMBER_EMAIL/PASSWORD if seeded,
		// or one created in the registration tests (though that creates dependency).
		// For robustness, let's assume TEST_MEMBER_EMAIL is a seeded member.
		const memberEmailForLogin = memberEmailForSeeding; // `Cypress.env('TEST_MEMBER_EMAIL')`
		const memberPasswordForLogin = memberPasswordForSeeding; // `Cypress.env('TEST_MEMBER_PASSWORD')`

		it('TC_AUTH_LOGIN_001: Successful login with valid Librarian credentials', () => {
			// The cy.loginAsLibrarian command handles the login and initial assertions.
			// It also navigates to /admin/dashboard.
			cy.loginAsLibrarian(librarianEmail, librarianPassword);
			// We can add further checks specific to this test if needed.
			cy.get('[data-testid="librarian-dashboard-welcome"]').should('be.visible');
			// Example: Verify Librarian-specific functionalities are visible/accessible
			cy.contains('User Management').should('be.visible'); // Adjust if this is a link/button text
		});

		it('TC_AUTH_LOGIN_002: Successful login with valid Member credentials', () => {
			if (!memberEmailForLogin || !memberPasswordForLogin) {
				this.skip(); // Skip test if default member credentials are not available
				return;
			}
			// The cy.loginAsMember command handles the login and initial assertions.
			// It also navigates to /member/dashboard.
			cy.loginAsMember(memberEmailForLogin, memberPasswordForLogin);
			cy.get('[data-testid="member-dashboard-welcome"]').should('be.visible');
			// Example: Verify Member-specific functionalities are visible/accessible
			cy.contains('My Borrowals').should('be.visible'); // Adjust as per your member dashboard
		});

		it('TC_AUTH_LOGIN_003: Attempt login with invalid email', () => {
			cy.visit('/login');
			cy.get('[data-testid="username-input"]').clear().type('nonexistent_e2e_user@example.com');
			cy.get('[data-testid="password-input"]').clear().type('anypassword');
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();

			cy.get('[data-testid="error-message"]').should('contain.text', 'Invalid email or password'); // Adjust selector and message
			cy.url().should('include', '/login'); // Should stay on login page
		});

		it('TC_AUTH_LOGIN_004: Attempt login with valid email but invalid password', () => {
			cy.visit('/login');
			cy.get('[data-testid="username-input"]').clear().type(librarianEmail); // Valid email
			cy.get('[data-testid="password-input"]').clear().type('WrongPassword123!'); // Invalid password
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();

			cy.get('[data-testid="error-message"]').should('contain.text', 'Invalid email or password');
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_LOGIN_005: Attempt login with empty email field', () => {
			cy.visit('/login');
			// Email field ([data-testid="username-input"]) is left empty
			cy.get('[data-testid="password-input"]').clear().type('anypassword');
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();

			cy.get('[data-testid="error-message-username"]').should('contain.text', 'Email is required'); // Adjust selector for field-specific error and message
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_LOGIN_006: Attempt login with empty password field', () => {
			cy.visit('/login');
			cy.get('[data-testid="username-input"]').clear().type(librarianEmail);
			// Password field is left empty
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();

			cy.get('[data-testid="error-message-password"]').should('contain.text', 'Password is required'); // Adjust selector
			cy.url().should('include', '/login');
		});
	});

	describe('User Logout', () => {
		it('TC_AUTH_LOGOUT_001: Successful logout for a logged-in Librarian', () => {
			cy.loginAsLibrarian(librarianEmail, librarianPassword);
			// cy.url().should('include', '/admin/dashboard'); // Already asserted in login command

			cy.get('[data-testid="logout-button"]').click(); // Adjust logout button selector

			cy.url().should('match', /\/login|\/$/); // Redirected to login or public homepage. Adjust regex if needed.
			// Verify session termination by trying to access a protected page
			cy.visit('/admin/dashboard', { failOnStatusCode: false }); // Allow navigation to potentially restricted page
			cy.url().should('match', /\/login|\/$/); // Should be redirected away from protected page
		});

		it('TC_AUTH_LOGOUT_002: Successful logout for a logged-in Member', () => {
			if (!memberEmailForSeeding || !memberPasswordForSeeding) {
				this.skip(); // Skip test if default member credentials are not available
				return;
			}
			cy.loginAsMember(memberEmailForSeeding, memberPasswordForSeeding);
			// cy.url().should('include', '/member/dashboard'); // Already asserted in login command

			cy.get('[data-testid="logout-button"]').click();

			cy.url().should('match', /\/login|\/$/);
			cy.visit('/member/dashboard', { failOnStatusCode: false });
			cy.url().should('match', /\/login|\/$/);
		});
	});

	describe('Role-Based Access Control (RBAC)', () => {
		it('TC_AUTH_RBAC_001: Verify Librarian can access Librarian-specific features', () => {
			cy.loginAsLibrarian(librarianEmail, librarianPassword);

			cy.visit('/admin/users'); // Adjust path to user management
			cy.get('[data-testid="user-management-page-title"]').should('be.visible'); // Adjust selector

			cy.visit('/admin/books/add'); // Adjust path to add book page
			cy.get('[data-testid="add-book-page-title"]').should('be.visible'); // Adjust selector
		});

		it('TC_AUTH_RBAC_002: Verify Member cannot access Librarian-specific features', () => {
			if (!memberEmailForSeeding || !memberPasswordForSeeding) {
				this.skip();
				return;
			}
			cy.loginAsMember(memberEmailForSeeding, memberPasswordForSeeding);

			cy.get('a[href="/admin/users"]').should('not.exist'); // Adjust selector for navigation item

			cy.visit('/admin/users', { failOnStatusCode: false });
			cy.url().should('not.include', '/admin/users');
			cy.url().should('include', '/member/dashboard'); // Or an access-denied page / login page. Adjust expected redirect.

			cy.get('a[href="/admin/books/add"]').should('not.exist');
		});

		it('TC_AUTH_RBAC_003: Verify Member can access Member-specific features', () => {
			if (!memberEmailForSeeding || !memberPasswordForSeeding) {
				this.skip();
				return;
			}
			cy.loginAsMember(memberEmailForSeeding, memberPasswordForSeeding);

			cy.visit('/member/search-books'); // Adjust path
			cy.get('[data-testid="search-books-page-title"]').should('be.visible'); // Adjust selector

			cy.visit('/member/borrow-history'); // Adjust path
			cy.get('[data-testid="borrow-history-page-title"]').should('be.visible'); // Adjust selector
		});

		it('TC_AUTH_RBAC_004: Verify guest (not logged in) user access to public pages and restriction from protected pages', () => {
			// Session is cleared by beforeEach or by not logging in.
			cy.visit('/login');
			cy.url().should('include', '/login');

			// Attempt to navigate to 'User Management' URL.
			cy.visit('/admin/users', { failOnStatusCode: false });
			cy.url().should('include', '/login'); // Should be denied and redirected to login.

			// Attempt to navigate to 'My Borrowal History' URL.
			cy.visit('/member/borrow-history', { failOnStatusCode: false });
			cy.url().should('include', '/login'); // Should be denied and redirected to login.
		});
	});
});
