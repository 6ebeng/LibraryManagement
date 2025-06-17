/**
 * E2E Test Cases for Browser Compatibility
 * File: cypress/e2e/browser_compatibility.cy.ts
 *
 * Implements the test cases defined in the "Browser Compatibility Testing" document.
 * This script uses custom commands and fixtures for efficiency and robustness.
 * Selectors have been updated based on the rendered HTML for stability.
 */
describe('Browser Compatibility Testing', () => {
  before(function () {
    cy.fixture('user-data.json').as('userData')
  })

  beforeEach(function () {
    cy.intercept('POST', '/api/auth/login').as('loginRequest')
    cy.intercept('POST', '/api/users').as('createUser')
    cy.intercept('POST', '/api/books').as('createBook')
    cy.intercept('DELETE', '/api/users/*').as('deleteUser')
    cy.clearUserSession()
    cy.visit('/login')
  })

  const browsers = ['chrome', 'firefox', 'edge']

  browsers.forEach((browser) => {
    describe(`Testing on ${browser}`, { browser }, () => {
      it('TC_BC_GEN_001: Verifies overall layout and style consistency', function () {
        cy.loginAsLibrarian(
          this.userData.librarian.email,
          this.userData.librarian.password
        )

        const keyPages = [
          '/dashboard',
          '/users',
          '/books',
          '/authors',
          '/genres',
        ]
        keyPages.forEach((page) => {
          cy.visit(page)
          cy.get('header.MuiAppBar-root').should('be.visible')
          cy.get('nav .MuiDrawer-root').should('be.visible')
          cy.get('main').should('be.visible')
          cy.log(`Layout consistency verified for ${page}`)
        })
      })

      it('TC_BC_GEN_002: Verifies responsiveness of the UI', function () {
        cy.loginAsLibrarian(
          this.userData.librarian.email,
          this.userData.librarian.password
        )
        cy.visit('/dashboard')

        cy.log('Testing on desktop viewport')
        cy.viewport('macbook-15')
        cy.get('nav .MuiDrawer-docked').should('be.visible')
        cy.get('header button').first().should('be.visible')

        cy.log('Testing on tablet viewport')
        cy.viewport('ipad-2')
        cy.get('nav .MuiDrawer-docked').should('not.be.visible')
        cy.get('header button').first().should('be.visible').click()
        cy.get('div.MuiDrawer-root[role="presentation"]').should('be.visible')
        cy.get('body').click(0, 0)

        cy.log('Testing on mobile viewport')
        cy.viewport('iphone-x')
        cy.get('nav .MuiDrawer-docked').should('not.be.visible')
        cy.get('header button').first().should('be.visible')
      })

      it('TC_BC_AUTH_001 & TC_BC_AUTH_002: Verifies Login/Logout and error messages', function () {
        // TC_BC_AUTH_001: Successful login
        cy.autoFillLoginForm({
          email: this.userData.librarian.email,
          password: this.userData.librarian.password,
        })
        cy.get('button[type="submit"]').click()
        cy.wait('@loginRequest')
        cy.url().should('include', '/dashboard')

        // Logout
        cy.performLogout()

        // TC_BC_AUTH_002: Error message display
        cy.autoFillLoginForm({
          email: 'invalid@user.com',
          password: 'wrongpassword',
        })
        cy.get('button[type="submit"]').click()
        cy.contains('No account found with this email address').should(
          'be.visible'
        )
      })

      it('TC_BC_CRUD_001 & TC_BC_CRUD_002: Verifies rendering and functionality of data tables, forms, and dialogs', function () {
        cy.loginAsLibrarian(
          this.userData.librarian.email,
          this.userData.librarian.password
        )
        cy.visit('/users')

        // TC_BC_CRUD_001: Verify table rendering
        cy.get('table.MuiTable-root').should('be.visible')
        cy.get('thead.MuiTableHead-root').should('be.visible')
        cy.get('.MuiTablePagination-root').should('be.visible')

        // TC_BC_CRUD_002: Verify form and dialog rendering
        cy.contains('button', 'New User').click()
        cy.contains('h4', 'Add user').should('be.visible')
        cy.get('input[name="name"]').should('be.visible')
        cy.get('input[name="email"]').should('be.visible')

        // Test delete confirmation dialog
        const newUserEmail = `deletable.user.${Date.now()}@example.com`
        cy.fillRegistrationForm({
          name: 'Deletable User',
          email: newUserEmail,
          password: 'password123',
        })
        cy.contains('button', 'Submit').click()
        cy.wait('@createUser')

        cy.deleteFromTable(newUserEmail) // This command includes checking the dialog
        cy.wait('@deleteUser')
        cy.contains(newUserEmail).should('not.exist')
      })

      it('TC_BC_CRUD_003: Verifies client-side form validation', function () {
        cy.loginAsLibrarian(
          this.userData.librarian.email,
          this.userData.librarian.password
        )
        cy.visit('/users')

        cy.contains('button', 'New User').click()

        // Trigger validation by attempting to submit an empty form
        cy.contains('button', 'Submit').click()
        cy.contains('Name is required').should('be.visible')
        cy.contains('Email is required').should('be.visible')

        cy.get('input[name="email"]').type('not-an-email').blur()
        cy.contains('Email must be a valid email address').should('be.visible')
      })

      it('TC_BC_FEAT_001 & TC_BC_FEAT_002: Verifies Dashboard rendering and JS interactions', function () {
        cy.loginAsLibrarian(
          this.userData.librarian.email,
          this.userData.librarian.password
        )
        cy.visit('/dashboard')

        // TC_BC_FEAT_001
        cy.contains('h4', /welcome back/i).should('be.visible')
        cy.get('.apexcharts-canvas', { timeout: 10000 }).should('be.visible')

        // TC_BC_FEAT_002
        cy.visit('/users')
        cy.get('th span').contains('Name').click() // Test sorting
        // Add specific assertions here to verify sort order if data is predictable
        cy.get('th span').contains('Name').click() // Sort descending
      })
    })
  })
})
