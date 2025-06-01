const { defineConfig } = require('cypress');

module.exports = defineConfig({
	e2e: {
		baseUrl: 'http://localhost:3000', // Will be overridden by CYPRESS_BASE_URL in Docker
		specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
		supportFile: 'cypress/support/e2e.js',
		experimentalSessionAndOrigin: true, // Added this line
		// projectId: "yourProjectId", // If you use Cypress Cloud
		setupNodeEvents(on, config) {
			// Initialize config.env if it doesn't exist
			config.env = config.env || {};

			// Load environment variables from process.env (sourced from .env.test by Docker Compose)
			// and make them available to Cypress.env() in your tests.
			config.env.TEST_LIBRARIAN_EMAIL = process.env.TEST_LIBRARIAN_EMAIL;
			config.env.TEST_LIBRARIAN_PASSWORD = process.env.TEST_LIBRARIAN_PASSWORD;
			config.env.TEST_MEMBER_EMAIL = process.env.TEST_MEMBER_EMAIL;
			config.env.TEST_MEMBER_PASSWORD = process.env.TEST_MEMBER_PASSWORD;

			// You can add any other environment variables you need here in the same way.

			// Make sure to return the config object as it might have been modified.
			return config;
		},
	},
});
