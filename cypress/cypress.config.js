const { defineConfig } = require('cypress');

module.exports = defineConfig({
	e2e: {
		baseUrl: 'http://localhost:3000', // Will be overridden by CYPRESS_BASE_URL in Docker
		specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
		supportFile: 'cypress/support/e2e.js',
		// projectId: "yourProjectId", // If you use Cypress Cloud
		setupNodeEvents(on, config) {
			// implement node event listeners here
		},
	},
});
