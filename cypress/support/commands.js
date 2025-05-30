// LibraryManagement/cypress/support/commands.js
Cypress.Commands.add('loginAsLibrarian', (email, password) => {
	cy.session(
		[email, password],
		() => {
			// Use cy.session for faster logins across tests
			cy.visit('/login'); // Adjust to your login page path
			cy.get('[data-testid="username-input"]').type(email); // Ensure your app uses email for username field during login
			cy.get('[data-testid="password-input"]').type(password);
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();
			cy.url().should('include', '/admin/dashboard'); // Verify redirection to librarian dashboard
			// Add a check for a unique element on the dashboard to confirm login
			cy.get('[data-testid="librarian-dashboard-welcome"]').should('be.visible');
		},
		{
			cacheAcrossSpecs: true, // Optional: caches session across multiple spec files
		}
	);
	// Visit a page after login to ensure session is applied for the test context
	cy.visit('/admin/dashboard');
});

Cypress.Commands.add('loginAsMember', (email, password) => {
	cy.session(
		[email, password],
		() => {
			cy.visit('/login'); // Adjust to your login page path
			cy.get('[data-testid="username-input"]').type(email); // Ensure your app uses email for username field during login
			cy.get('[data-testid="password-input"]').type(password);
			cy.get('button[type="submit"][data-testid="login-submit-button"]').click();
			cy.url().should('include', '/member/dashboard'); // Verify redirection to member dashboard
			cy.get('[data-testid="member-dashboard-welcome"]').should('be.visible');
		},
		{
			cacheAcrossSpecs: true,
		}
	);
	cy.visit('/member/dashboard');
});
