/**
 * E2E Test Commands
 * File: cypress/support/commands.ts
 *
 * This file contains custom Cypress commands to streamline test authoring.
 * Refactored to include helpers for filling forms and to use session caching
 * for both UI and programmatic logins, improving test speed and reliability.
 */

// Extend the Cypress.Chainable namespace to include your custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in as a librarian using a cached session.
       * @param email The librarian's email
       * @param password The librarian's password
       * @example cy.loginAsLibrarian('librarian@example.com', 'password123')
       */
      loginAsLibrarian(email: string, password?: string): Chainable<void>

      /**
       * Custom command to log in as a member using a cached session.
       * @param email The member's email
       * @param password The member's password
       * @example cy.loginAsMember('member@example.com', 'password123')
       */
      loginAsMember(email: string, password?: string): Chainable<void>

      /**
       * Fills the user registration form with the provided data.
       * @param user - Object with user details.
       */
      fillRegistrationForm(user: {
        name?: string
        dob?: string
        email?: string
        phone?: string
        password?: string
        isAdmin?: boolean
      }): Chainable<void>

      /**
       * Custom command to automatically fill the login form fields.
       * Does not submit the form.
       * @param credentials - An object with email and password.
       * @example cy.autoFillLoginForm({ email: 'test@test.com', password: 'password' })
       */
      autoFillLoginForm(credentials: {
        email?: string
        password?: string
      }): Chainable<void>

      /**
       * Custom command to wait for an API to be callable.
       * @param url The API endpoint URL
       * @param timeout The maximum time to wait in milliseconds (default: 30000)
       */
      waitForApi(url: string, timeout?: number): Chainable<void>

      /**
       * Custom command to clear all user session data.
       */
      clearUserSession(): Chainable<void>
    }
  }
}

/**
 * Command: autoFillLoginForm
 * Description: Fills the email and password fields on the login page.
 */
Cypress.Commands.add('autoFillLoginForm', ({ email, password }) => {
  cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible')

  if (email) {
    cy.get('input[name="email"]').clear()
    cy.get('input[name="email"]').type(email)
  } else {
    cy.get('input[name="email"]').clear()
  }

  if (password) {
    cy.get('input[name="password"]').clear()
    cy.get('input[name="password"]').type(password)
  } else {
    cy.get('input[name="password"]').clear()
  }
})

/**
 * Command: loginAsLibrarian
 * Description: Logs in a user with the 'librarian' role using a cached session.
 * Refactored to use the autoFillLoginForm helper command.
 */
Cypress.Commands.add('loginAsLibrarian', (email, password) => {
  cy.session(
    [email, password, 'librarian'], // Unique key for the session
    () => {
      cy.visit('/login')
      cy.autoFillLoginForm({ email, password })
      cy.get('button[type="submit"]').click()
      cy.url({ timeout: 15000 }).should('include', '/dashboard')
      cy.contains('h4', /Welcome back/i, { timeout: 15000 }).should(
        'be.visible'
      )
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        // Visit a protected route to ensure the session is still valid
        // cy.visit('/dashboard')
        cy.contains('h4', /Welcome back/i, { timeout: 10000 }).should(
          'be.visible'
        )
      },
    }
  )
})

/**
 * Command: loginAsMember
 * Description: Logs in a user with the 'member' role using a cached session.
 * Refactored to use the autoFillLoginForm helper command.
 */
Cypress.Commands.add('loginAsMember', (email, password) => {
  cy.session(
    [email, password, 'member'], // Unique key for the session
    () => {
      cy.visit('/login')
      cy.autoFillLoginForm({ email, password })
      cy.get('button[type="submit"]').click()
      cy.url({ timeout: 15000 }).should('include', '/books')
      cy.contains('h3', 'Books', { timeout: 15000 }).should('be.visible')
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        // Visit a protected route to ensure the session is still valid
        //cy.visit('/books')
        cy.contains('h3', 'Books', { timeout: 10000 }).should('be.visible')
      },
    }
  )
})

/**
 * Command: fillRegistrationForm
 * Description: Fills the user registration/update form fields from a dialog.
 */
Cypress.Commands.add('fillRegistrationForm', (user) => {
  cy.get('div.MuiBox-root.css-1bbaby5')
    .should('be.visible')
    .then(($dialog) => {
      if (user.name) {
        cy.wrap($dialog).find('input[name="name"]').clear()
        cy.wrap($dialog).find('input[name="name"]').type(user.name)
      }
      if (user.dob) {
        cy.wrap($dialog).find('input[name="dob"]').clear()
        cy.wrap($dialog).find('input[name="dob"]').type(user.dob)
      }
      if (user.email) {
        cy.wrap($dialog).find('input[name="email"]').clear()
        cy.wrap($dialog).find('input[name="email"]').type(user.email)
      }
      if (user.phone) {
        cy.wrap($dialog).find('input[name="phone"]').clear()
        cy.wrap($dialog).find('input[name="phone"]').type(user.phone)
      }
      if (user.password) {
        cy.wrap($dialog).find('input[name="password"]').clear()
        cy.wrap($dialog).find('input[name="password"]').type(user.password)
      }
      if (user.isAdmin !== undefined) {
        const role = user.isAdmin ? 'Librarian' : 'Member'
        cy.wrap($dialog)
          .contains('label', role)
          .find('input[type="radio"]')
          .click()
      }
    })
})

/**
 * Command: waitForApi
 * Description: Waits for a specific API endpoint to become responsive.
 */
Cypress.Commands.add('waitForApi', (url, timeout = 30000) => {
  cy.request({
    url: url,
    timeout: timeout,
    retryOnStatusCodeFailure: true,
    retryOnNetworkFailure: true,
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.be.lessThan(500) // Ensure no server errors
  })
})

/**
 * Command: clearUserSession
 * Description: Clears all session data, including localStorage and cookies.
 */
Cypress.Commands.add('clearUserSession', () => {
  Cypress.session.clearAllSavedSessions()
  cy.clearLocalStorage()
  cy.clearCookies()
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })
})

// To ensure the file is treated as a module by TypeScript
export {}
