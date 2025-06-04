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
		video: true,
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
			mochaFile: 'cypress/results/[name]-[hash].xml', // For JUnit reporter
			toConsole: true, // Log to console
			overwrite: false, // Do not overwrite existing reports (Aligned with comment)
			html: false, // Disable HTML report if using JUnit
			json: true, // Enable JSON report
		},

		// Add retries for flaky tests
		retries: {
			runMode: 0,
			openMode: 0,
		},

		setupNodeEvents(on, config) {
			config.env = config.env || {};

			// This section correctly loads variables from process.env into Cypress.env()
			// Your .env.test file provides these values to process.env if loaded correctly.

			// Loads TEST_LIBRARIAN_EMAIL, etc. if they are in process.env
			const requiredEnvVars = ['TEST_LIBRARIAN_EMAIL', 'TEST_LIBRARIAN_PASSWORD', 'TEST_MEMBER_EMAIL', 'TEST_MEMBER_PASSWORD'];
			requiredEnvVars.forEach((envVar) => {
				if (process.env[envVar]) {
					config.env[envVar] = process.env[envVar];
				} else {
					console.warn(`Warning: ${envVar} is not set in environment variables`);
				}
			});

			// Loads all CYPRESS_ prefixed variables from process.env into config.env, stripping the prefix.
			// So, CYPRESS_API_URL from .env.test becomes config.env.API_URL (accessible via Cypress.env('API_URL')).
			// CYPRESS_TEST_LIBRARIAN_EMAIL becomes config.env.TEST_LIBRARIAN_EMAIL.
			// CYPRESS_defaultCommandTimeout becomes config.env.defaultCommandTimeout (accessible via Cypress.env('defaultCommandTimeout')).
			Object.keys(process.env).forEach((key) => {
				if (key.startsWith('CYPRESS_')) {
					const cypressKey = key.replace('CYPRESS_', '');
					config.env[cypressKey] = process.env[key];
				}
			});

			// This specific assignment for API_URL is okay, though the loop above would also set it
			// if CYPRESS_API_URL is in process.env. It ensures API_URL is explicitly available.
			if (process.env.CYPRESS_API_URL) {
				config.env.API_URL = process.env.CYPRESS_API_URL;
			} else {
				console.warn(
					'Warning: CYPRESS_API_URL is not set in environment variables. ' +
						'Backend API tests might fail or point to an incorrect URL. ' +
						'Defaulting to http://localhost:8080 for local non-Docker runs, but ensure this is correct for your setup, or set http://backend:8080 for default Docker setups.'
				);
				// Ensure a default is set if not present, to avoid issues if it's expected.
			}

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
