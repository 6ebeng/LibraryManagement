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
		if (!memberEmailForSeeding || !memberPasswordForSeeding) {
			console.warn(
				'Default test member credentials (CYPRESS_TEST_MEMBER_EMAIL, CYPRESS_TEST_MEMBER_PASSWORD) ' +
					'are not fully set. Some member-specific tests might be affected if this member is expected to be pre-seeded.'
			);
		}
	});

	beforeEach(() => {
		cy.visit('/login');
	});

	describe('User Registration (by Librarian)', () => {
		beforeEach(() => {
			cy.loginAsLibrarian(librarianEmail, librarianPassword);
		});

		const newMemberUsername = `e2e_member_reg_${testTimestamp}`;
		const newMemberEmail = `e2e_member_reg_${testTimestamp}@example.com`;
		const newMemberPassword = 'ValidRegPassword123!';

		it('TC_AUTH_REG_001: Successful new user (Member) registration by Librarian', () => {
			cy.visit('/admin/users/add');
			cy.url().should('include', '/admin/users/add');
			cy.get('[data-testid="username-input"]').clear().type(newMemberUsername);
			cy.get('[data-testid="email-input"]').clear().type(newMemberEmail);
			cy.get('[data-testid="fullName-input"]').clear().type('E2E Test Reg Member');
			cy.get('[data-testid="password-input"]').clear().type(newMemberPassword);
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();
			// Assuming success message appears as a toast or a specific element
			// This might need adjustment if it's a toast: e.g. cy.contains('User registered successfully').should('be.visible');
			cy.get('[data-testid="success-message"]').should('contain.text', 'User registered successfully');
			cy.visit('/admin/users');
			cy.get('[data-testid="user-list-table"]').should('contain.text', newMemberUsername);
		});

		it('TC_AUTH_REG_002: Attempt to register a new user with an existing email', () => {
			const existingEmailForTest = `existing_${testTimestamp}@example.com`;
			cy.visit('/admin/users/add');
			cy.get('[data-testid="username-input"]').clear().type(`user_with_existing_email_${testTimestamp}`);
			cy.get('[data-testid="email-input"]').clear().type(existingEmailForTest);
			cy.get('[data-testid="fullName-input"]').clear().type('User Existing Email');
			cy.get('[data-testid="password-input"]').clear().type('TempPass123!');
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();
			// This might need adjustment if it's a toast: e.g. cy.contains('User registered successfully').should('be.visible');
			cy.get('[data-testid="success-message"]').should('be.visible');

			cy.visit('/admin/users/add');
			cy.get('[data-testid="username-input"]').clear().type(`another_user_${testTimestamp}`);
			cy.get('[data-testid="email-input"]').clear().type(existingEmailForTest);
			cy.get('[data-testid="fullName-input"]').clear().type('Another User Same Email');
			cy.get('[data-testid="password-input"]').clear().type('AnotherPass123!');
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();
			// This might need adjustment if it's a toast: e.g. cy.contains('Email already exists').should('be.visible');
			cy.get('[data-testid="error-message"]').should('contain.text', 'Email already exists');
		});

		it('TC_AUTH_REG_003: Attempt to register a new user with missing required fields (e.g., password)', () => {
			cy.visit('/admin/users/add');
			cy.get('[data-testid="username-input"]').clear().type(`missing_fields_user_${testTimestamp}`);
			cy.get('[data-testid="email-input"]').clear().type(`missing_${testTimestamp}@example.com`);
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();
			// This might need adjustment if it's a toast: e.g. cy.contains('Password is required').should('be.visible');
			cy.get('[data-testid="error-message-password"]').should('contain.text', 'Password is required');
		});

		it('TC_AUTH_REG_004: Attempt to register a new user with invalid data format (e.g., email)', () => {
			cy.visit('/admin/users/add');
			cy.get('[data-testid="username-input"]').clear().type(`invalid_data_user_${testTimestamp}`);
			cy.get('[data-testid="password-input"]').clear().type('ValidPassword123!');
			cy.get('[data-testid="email-input"]').clear().type('invalidemailformat');
			cy.get('button[type="submit"][data-testid="register-submit-button"]').click();
			// This might need adjustment if it's a toast: e.g. cy.contains('Invalid email format').should('be.visible');
			cy.get('[data-testid="error-message-email"]').should('contain.text', 'Invalid email format');
		});
	});

	describe('User Login', () => {
		const memberEmailForLogin = memberEmailForSeeding;
		const memberPasswordForLogin = memberPasswordForSeeding;

		it('TC_AUTH_LOGIN_001: Successful login with valid Librarian credentials', () => {
			cy.loginAsLibrarian(librarianEmail, librarianPassword);
			// The loginAsLibrarian command should assert internal login success.
			// Add assertions for elements *after* login command's internal checks.
			// Potential Failure Point: [data-testid="librarian-dashboard-welcome"] may not exist or text may differ.
			cy.get('[data-testid="librarian-dashboard-welcome"]').should('be.visible');
			cy.contains('User Management').should('be.visible');
		});

		it('TC_AUTH_LOGIN_002: Successful login with valid Member credentials', () => {
			if (!memberEmailForLogin || !memberPasswordForLogin) {
				this.skip();
				return;
			}
			cy.loginAsMember(memberEmailForLogin, memberPasswordForLogin);
			// Potential Failure Point: [data-testid="member-dashboard-welcome"] may not exist or text may differ.
			cy.get('[data-testid="member-dashboard-welcome"]').should('be.visible');
			cy.contains('My Borrowals').should('be.visible');
		});

		it('TC_AUTH_LOGIN_003: Attempt login with invalid email', () => {
			// Using correct selectors for LoginForm.js
			cy.get('input[name="email"]').clear().type('nonexistent_e2e_user@example.com');
			cy.get('input[name="password"]').clear().type('anypassword');
			cy.get('button[type="submit"]').click();
			// Assuming error appears in a toast. This assertion may need refinement based on toast implementation.
			cy.contains('Invalid email or password', { timeout: 5000 }).should('be.visible');
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_LOGIN_004: Attempt login with valid email but invalid password', () => {
			cy.get('input[name="email"]').clear().type(librarianEmail);
			cy.get('input[name="password"]').clear().type('WrongPassword123!');
			cy.get('button[type="submit"]').click();
			// Assuming error appears in a toast.
			cy.contains('Invalid email or password', { timeout: 5000 }).should('be.visible');
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_LOGIN_005: Attempt login with empty email field', () => {
			cy.get('input[name="password"]').clear().type('anypassword');
			cy.get('button[type="submit"]').click();
			// LoginPage.jsx shows "Please enter email and password" for this case.
			cy.contains('Please enter email and password', { timeout: 5000 }).should('be.visible');
			cy.url().should('include', '/login');
		});

		it('TC_AUTH_LOGIN_006: Attempt login with empty password field', () => {
			cy.get('input[name="email"]').clear().type(librarianEmail);
			cy.get('button[type="submit"]').click();
			// LoginPage.jsx shows "Please enter email and password" for this case.
			cy.contains('Please enter email and password', { timeout: 5000 }).should('be.visible');
			cy.url().should('include', '/login');
		});
	});

	describe('User Logout', () => {
		it('TC_AUTH_LOGOUT_001: Successful logout for a logged-in Librarian', () => {
			cy.loginAsLibrarian(librarianEmail, librarianPassword);
			// Potential Failure Point: [data-testid="logout-button"] might not exist.
			cy.get('[data-testid="logout-button"]').click();
			cy.url().should('match', /\/login|\/$/);
			cy.visit('/admin/dashboard', { failOnStatusCode: false });
			cy.url().should('match', /\/login|\/$/);
		});

		it('TC_AUTH_LOGOUT_002: Successful logout for a logged-in Member', () => {
			if (!memberEmailForSeeding || !memberPasswordForSeeding) {
				this.skip();
				return;
			}
			cy.loginAsMember(memberEmailForSeeding, memberPasswordForSeeding);
			// Potential Failure Point: [data-testid="logout-button"] might not exist.
			cy.get('[data-testid="logout-button"]').click();
			cy.url().should('match', /\/login|\/$/);
			cy.visit('/member/dashboard', { failOnStatusCode: false }); // This should be a relevant member page if '/member/dashboard' is not the one.
			cy.url().should('match', /\/login|\/$/);
		});
	});

	describe('Role-Based Access Control (RBAC)', () => {
		it('TC_AUTH_RBAC_001: Verify Librarian can access Librarian-specific features', () => {
			cy.loginAsLibrarian(librarianEmail, librarianPassword);
			cy.visit('/admin/users');
			// Potential Failure Point: [data-testid="user-management-page-title"] might not exist.
			cy.get('[data-testid="user-management-page-title"]').should('be.visible');
			cy.visit('/admin/books/add');
			// Potential Failure Point: [data-testid="add-book-page-title"] might not exist.
			cy.get('[data-testid="add-book-page-title"]').should('be.visible');
		});

		it('TC_AUTH_RBAC_002: Verify Member cannot access Librarian-specific features', () => {
			if (!memberEmailForSeeding || !memberPasswordForSeeding) {
				this.skip();
				return;
			}
			cy.loginAsMember(memberEmailForSeeding, memberPasswordForSeeding);
			cy.get('a[href="/admin/users"]').should('not.exist');
			cy.visit('/admin/users', { failOnStatusCode: false });
			cy.url().should('not.include', '/admin/users');
			// Changed from '/member/dashboard' to match common redirect behavior to /login for unauthorized access.
			cy.url().should('include', '/login'); // Or match a more generic pattern: /\/login|\/access-denied|\/$/
			cy.get('a[href="/admin/books/add"]').should('not.exist');
		});

		it('TC_AUTH_RBAC_003: Verify Member can access Member-specific features', () => {
			if (!memberEmailForSeeding || !memberPasswordForSeeding) {
				this.skip();
				return;
			}
			cy.loginAsMember(memberEmailForSeeding, memberPasswordForSeeding);
			cy.visit('/member/search-books'); // Adjust if this is not the correct URL
			// Potential Failure Point: [data-testid="search-books-page-title"] might not exist.
			cy.get('[data-testid="search-books-page-title"]').should('be.visible');
			cy.visit('/member/borrow-history'); // Adjust if this is not the correct URL
			// Potential Failure Point: [data-testid="borrow-history-page-title"] might not exist.
			cy.get('[data-testid="borrow-history-page-title"]').should('be.visible');
		});

		it('TC_AUTH_RBAC_004: Verify guest (not logged in) user access to public pages and restriction from protected pages', () => {
			cy.visit('/login'); // beforeEach also does this
			cy.url().should('include', '/login');
			cy.visit('/admin/users', { failOnStatusCode: false });
			cy.url().should('include', '/login');
			cy.visit('/member/borrow-history', { failOnStatusCode: false });
			cy.url().should('include', '/login');
		});
	});
});
