// cypress/support/commands.js

Cypress.Commands.add('loginAsLibrarian', (email, password) => {
	cy.session(
		[email, password], // Session key for caching
		() => {
			// This block runs when the session is new or needs to be re-established
			cy.visit('/login');
			// Updated selectors to match the actual HTML structure
			cy.get('input[name="email"]').type(email);
			cy.get('input[name="password"]').type(password);
			cy.get('button[type="submit"]').click();

			// Assertions to confirm successful login and correct page
			// Match this URL with your application's actual redirect for librarians
			cy.url().should('include', '/dashboard', { timeout: 10000 });
			// Example: Check for a welcome message or a unique element on the librarian's dashboard
			// Ensure this element and text actually exist on your librarian dashboard.
			// Consider using data-testid for robustness if possible.
			cy.contains('h4', 'Hi', { timeout: 10000 }).should('be.visible');
		},
		{
			cacheAcrossSpecs: true, // Enables session reuse across different spec files
		}
	);
});

Cypress.Commands.add('loginAsMember', (email, password) => {
	cy.session(
		[email, password], // Session key
		() => {
			cy.visit('/login');
			// Updated selectors to match the actual HTML structure
			cy.get('input[name="email"]').type(email);
			cy.get('input[name="password"]').type(password);
			cy.get('button[type="submit"]').click();

			// Assertions to confirm successful login and correct page
			// Match this URL with your application's actual redirect for members
			cy.url().should('include', '/books', { timeout: 10000 }); // Or '/books' if that's the landing page
			// Example: Check for a welcome message or a unique element on the member's dashboard.
			// Replace '[data-testid="member-dashboard-welcome"]' with an actual, reliable selector.
			// If not using data-testid, cy.contains('Some unique text on member dashboard').should('be.visible');
			cy.get('div.MuiBox-root > p', { timeout: 10000 }).should('be.visible');
		},
		{
			cacheAcrossSpecs: true,
		}
	);
});
