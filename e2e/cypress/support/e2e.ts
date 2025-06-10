// File: LibraryManagement/e2e/cypress/support/e2e.ts

// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.ts.
// Cypress will automatically resolve './commands' to 'commands.ts'
// if it exists in the same directory, otherwise it would look for 'commands.js'.
import './commands'

// Alternatively, you can use CommonJS syntax:
// require('./commands')

// It's often a good idea to import any global polyfills or
// third-party libraries that your application under test might use globally.
// For example, if you need a polyfill for Promise:
// import 'core-js/stable/promise';

// You can also define global before/beforeEach/afterEach hooks here.
// For example, to clear local storage before each test:
// beforeEach(() => {
//   cy.clearLocalStorage();
// });

// To turn off uncaught exception handling (not recommended for most cases,
// but can be useful for debugging certain types of application errors):
// Cypress.on('uncaught:exception', (err, runnable) => {
//   // returning false here prevents Cypress from
//   // failing the test
//   return false
// })

// Make sure this file is processed as a TypeScript file.
// If you have custom type definitions for your commands in commands.ts,
// those will be available globally. You can also add triple-slash directives
// if needed for other type definition files.
// e.g., /// <reference types="some-other-type-definition-package" />

export {} // Ensures this file is treated as a module.
