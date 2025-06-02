const { defineConfig } = require('cypress');

module.exports = defineConfig({
	e2e: {
		baseUrl: 'http://localhost:3000', // Will be overridden by CYPRESS_BASE_URL in Docker
		specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
		supportFile: 'cypress/support/e2e.js',
		videosFolder: 'cypress/videos',
		screenshotsFolder: 'cypress/screenshots',
		fixturesFolder: 'cypress/fixtures',
		downloadsFolder: 'cypress/downloads',
		video: false,
		screenshotOnRunFailure: true,
		viewportWidth: 1280,
		viewportHeight: 720,
		defaultCommandTimeout: 10000,
		requestTimeout: 10000,
		responseTimeout: 30000,
		pageLoadTimeout: 30000,

		// Fixed reporter configuration
		reporter: 'spec', // Use 'mochawesome' or 'junit' if you need XML reports
		reporterOptions: {
			// Only include these if using 'junit' reporter
			// mochaFile: 'cypress/results/results-[hash].xml',
			// toConsole: true,
		},

		// Updated for newer Cypress versions
		experimentalSessionAndOrigin: false, // Deprecated in v12+

		// Add retries for flaky tests
		retries: {
			runMode: 2,
			openMode: 0,
		},

		setupNodeEvents(on, config) {
			// Initialize config.env if it doesn't exist
			config.env = config.env || {};

			// Load environment variables with proper error handling
			const requiredEnvVars = ['TEST_LIBRARIAN_EMAIL', 'TEST_LIBRARIAN_PASSWORD', 'TEST_MEMBER_EMAIL', 'TEST_MEMBER_PASSWORD'];

			requiredEnvVars.forEach((envVar) => {
				if (process.env[envVar]) {
					config.env[envVar] = process.env[envVar];
				} else {
					console.warn(`Warning: ${envVar} is not set in environment variables`);
				}
			});

			// Load CYPRESS_ prefixed environment variables
			Object.keys(process.env).forEach((key) => {
				if (key.startsWith('CYPRESS_')) {
					const cypressKey = key.replace('CYPRESS_', '');
					config.env[cypressKey] = process.env[key];
				}
			});

			// Set API URL from environment or default
			config.env.API_URL = process.env.CYPRESS_API_URL || 'http://localhost:8080/api';

			// Task for logging (useful for debugging)
			on('task', {
				log(message) {
					console.log(message);
					return null;
				},
			});

			return config;
		},
	},

	component: {
		devServer: {
			framework: 'create-react-app',
			bundler: 'webpack',
		},
		specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
		supportFile: 'cypress/support/component.js',
	},
});
