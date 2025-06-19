// File: cypress/support/e2e.ts

import './commands'

// Import cypress-mochawesome-reporter support
import 'cypress-mochawesome-reporter/register'
import 'cypress-xpath'

// Global configuration
beforeEach(() => {
  // You can add global setup here if needed
})

// Handle uncaught exceptions to prevent test failures due to application errors
Cypress.on('uncaught:exception', (err, runnable) => {
  // Log the error for debugging
  console.error('Uncaught exception:', err)

  // Return false to prevent Cypress from failing the test
  // Only do this if you want to continue testing despite application errors
  // For most cases, you should let the test fail to catch real issues
  return false
})

// Ensure this file is treated as a module
export {}
