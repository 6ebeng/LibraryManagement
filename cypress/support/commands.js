// cypress/support/commands.js

Cypress.Commands.add('loginAsLibrarian', (email, password) => {
	cy.session(
		[email, password, 'librarian'], // Added role to session key
		() => {
			cy.visit('/login');
			cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').clear().type(email);
			cy.get('input[name="password"]', { timeout: 10000 }).should('be.visible').clear().type(password);
			cy.get('button[type="submit"]').click();

			// Wait for navigation and verify login
			cy.url({ timeout: 15000 }).should('include', '/dashboard');
			cy.contains('h4', 'Hi', { timeout: 15000 }).should('be.visible');
		},
		{
			cacheAcrossSpecs: true,
			validate() {
				// Validate that session is still valid
				cy.visit('/dashboard');
				cy.contains('h4', 'Hi', { timeout: 10000 }).should('be.visible');
			},
		}
	);
});

Cypress.Commands.add('loginAsMember', (email, password) => {
	cy.session(
		[email, password, 'member'], // Added role to session key
		() => {
			cy.visit('/login');
			cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').clear().type(email);
			cy.get('input[name="password"]', { timeout: 10000 }).should('be.visible').clear().type(password);
			cy.get('button[type="submit"]').click();

			// Wait for navigation and verify login
			cy.url({ timeout: 15000 }).should('include', '/books');
			cy.get('div.MuiBox-root > p', { timeout: 15000 }).should('be.visible');
		},
		{
			cacheAcrossSpecs: true,
			validate() {
				// Validate that session is still valid
				cy.visit('/books');
				cy.get('div.MuiBox-root > p', { timeout: 10000 }).should('be.visible');
			},
		}
	);
});

// Additional utility commands
Cypress.Commands.add('waitForApi', (url, timeout = 30000) => {
	cy.request({
		url: url,
		timeout: timeout,
		retryOnStatusCodeFailure: true,
		retryOnNetworkFailure: true,
	});
});

Cypress.Commands.add('clearAllSessions', () => {
	cy.clearAllSessionStorage();
	cy.clearAllLocalStorage();
	cy.clearCookies();
});
