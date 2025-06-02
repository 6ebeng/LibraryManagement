// LibraryManagement/cypress/cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
	e2e: {
		baseUrl: 'http://localhost:3000', // Will be overridden by CYPRESS_BASE_URL in Docker if set
		specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
		supportFile: 'cypress/support/e2e.js',
		videosFolder: 'cypress/videos', // Standard folder for videos
		screenshotsFolder: 'cypress/screenshots', // Standard folder for screenshots
		fixturesFolder: 'cypress/fixtures', // Standard folder for fixture files
		downloadsFolder: 'cypress/downloads', // Standard folder for downloaded files
		video: false, // Default to false, can be overridden by CLI or CI config
		screenshotOnRunFailure: true, // Good practice for debugging failed tests
		reporter: 'spec', // Default reporter, good for CI and local
		reporterOptions: {
			// Example reporter options for JUnit, useful for CI
			mochaFile: 'cypress/results/results-[hash].xml',
			toConsole: true,
		},
		experimentalSessionAndOrigin: true, // Enables cy.session() and cy.origin()
		// projectId: "yourProjectId", // Uncomment and set if you use Cypress Cloud

		setupNodeEvents(on, config) {
			// Initialize config.env if it doesn't exist to avoid errors
			config.env = config.env || {};

			// Load environment variables from process.env (e.g., sourced from .env.test by Docker Compose)
			// and make them available to Cypress.env() in your tests.
			// This allows for secure handling of sensitive data like credentials.
			config.env.TEST_LIBRARIAN_EMAIL = process.env.TEST_LIBRARIAN_EMAIL;
			config.env.TEST_LIBRARIAN_PASSWORD = process.env.TEST_LIBRARIAN_PASSWORD;
			config.env.TEST_MEMBER_EMAIL = process.env.TEST_MEMBER_EMAIL;
			config.env.TEST_MEMBER_PASSWORD = process.env.TEST_MEMBER_PASSWORD;

			// Example: API URL can also be set here if needed, or overridden by CYPRESS_API_URL
			// config.env.API_URL = process.env.API_URL || 'http://localhost:5000/api';

			// You can add any other environment variables you need here in the same way.
			// For example, to load all environment variables prefixed with CYPRESS_:
			// Object.keys(process.env).forEach((key) => {
			//   if (key.startsWith('CYPRESS_')) {
			//     config.env[key.replace('CYPRESS_', '')] = process.env[key];
			//   }
			// });

			// Make sure to return the config object as it might have been modified.
			return config;
		},
	},

	component: {
		// Configuration for Cypress component testing, if you plan to use it.
		devServer: {
			framework: 'create-react-app', // Or your specific framework like 'react', 'vue', 'angular'
			bundler: 'webpack', // Or 'vite'
		},
		specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}', // Common pattern for component tests
		supportFile: 'cypress/support/component.js', // Support file for component tests
	},
});
