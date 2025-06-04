// cypress/support/commands.js

Cypress.Commands.add('loginAsLibrarian', (email, password) => {
	cy.session(
		[email, password, 'librarian'], // Added role to session key
		() => {
			cy.visit('/login');
			cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').clear().type(email);
			cy.get('input[name="password"]', { timeout: 10000 }).should('be.visible').clear().type(password);
			// Using type="submit" for consistency and robustness
			cy.get('button[type="submit"]', { timeout: 10000 }).should('be.visible').click();

			// Wait for navigation and verify login
			cy.url({ timeout: 15000 }).should('include', '/dashboard');
			cy.contains('h4', 'Hi', { timeout: 15000 }).should('be.visible');
		},
		{
			cacheAcrossSpecs: true,
			validate() {
				// Validate that session is still valid
				cy.visit('/dashboard'); // Or a known protected route for librarians
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
			cy.get('button[type="submit"]', { timeout: 10000 }).should('be.visible').click();

			// Wait for navigation and verify login
			cy.url({ timeout: 15000 }).should('include', '/books'); // Assuming members go to /books
			// This check is a bit generic, consider a more specific element if available
			cy.get('div.MuiBox-root > p', { timeout: 15000 }).should('be.visible');
		},
		{
			cacheAcrossSpecs: true,
			validate() {
				// Validate that session is still valid
				cy.visit('/books'); // Or a known protected route for members
				// This check is a bit generic, consider a more specific element if available
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
		retryOnStatusCodeFailure: true, // Good for ensuring API is callable
		retryOnNetworkFailure: true, // Good for ensuring API is callable
		failOnStatusCode: false, // Depending on need, you might want this true or handle status in .then()
	}).then((response) => {
		// Optionally, assert specific status codes if needed, e.g., expect(response.status).to.eq(200)
		// For a simple "wait until callable", just letting it pass if request succeeds is often enough
		expect(response.status).to.be.lessThan(500); // Example: ensure no server errors
	});
});

Cypress.Commands.add('clearUserSession', () => {
	// Clears sessions created by cy.session()
	Cypress.session.clearAllSavedSessions();
	// Clears browser's localStorage for the current origin
	cy.clearLocalStorage();
	// Clears browser's cookies for the current origin
	cy.clearCookies();
	// Clears browser's sessionStorage for the current origin
	cy.window().then((win) => {
		win.sessionStorage.clear();
	});
});

// Renamed clearAllSessions to clearUserSession for clarity, as it focuses on user session artifacts
// If you prefer the old name, you can revert it.
