/**
 * E2E Test Cases for Authentication & Authorization
 * File: cypress/e2e/authentication.cy.ts
 *
 * Refactored to use helper commands for filling forms, improving
 * readability and maintainability of the test specs.
 */

describe('E2E: Authentication & Authorization', () => {
  const testTimestamp: number = Date.now() // For creating unique user data

  interface UserCredentials {
    email: string
    password: string
  }
  interface FixtureData {
    librarian: UserCredentials
    member: UserCredentials
  }

  let fixtureUserData: FixtureData // To store loaded fixture data

  before(() => {
    // Load user data from fixture for all tests
    cy.fixture('user-data.json').then((data) => {
      fixtureUserData = data
    })
  })

  // --- User Registration Tests (by Librarian) ---
  describe('User Registration (by Librarian)', () => {
    beforeEach(() => {
      if (
        !fixtureUserData?.librarian?.email ||
        !fixtureUserData?.librarian?.password
      ) {
        throw new Error('Librarian credentials not found in fixture.')
      }
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/users')
      cy.url().should('include', '/users')
    })

    it('TC_AUTH_REG_001: Successfully register a new user (Member)', () => {
      const newMember = {
        name: `TestRegMember${testTimestamp}`,
        email: `e2e_member_reg_${testTimestamp}@example.com`,
        password: 'ValidRegPassword123!',
        isAdmin: false,
      }

      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(newMember)
      cy.get('div.MuiBox-root.css-1bbaby5').contains('button', 'Submit').click()

      cy.get('.MuiTablePagination-select').click()
      cy.get('li[data-value="25"]').click()
      cy.get('table > tbody')
        .contains('td', newMember.email)
        .should('be.visible')
    })
  })

  // --- User Login Tests ---
  describe('User Login', () => {
    beforeEach(() => {
      cy.visit('/login')
    })

    it('TC_AUTH_LOGIN_001: Successfully log in with valid Librarian credentials', () => {
      if (!fixtureUserData?.librarian)
        throw new Error('Librarian fixture data not loaded')

      cy.autoFillLoginForm({
        email: fixtureUserData.librarian.email,
        password: fixtureUserData.librarian.password,
      })
      cy.get('button[type="submit"]').click()

      cy.url().should('include', '/dashboard')
      cy.contains('h4', /Welcome back/i).should('be.visible')
    })

    it('TC_AUTH_LOGIN_002: Successfully log in with valid Member credentials', () => {
      if (!fixtureUserData?.member)
        throw new Error('Member fixture data not loaded')

      cy.autoFillLoginForm({
        email: fixtureUserData.member.email,
        password: fixtureUserData.member.password,
      })
      cy.get('button[type="submit"]').click()

      cy.url().should('include', '/books')
      cy.contains('h3', 'Books').should('be.visible')
    })

    it('TC_AUTH_LOGIN_003: Attempt to log in with an invalid email', () => {
      cy.autoFillLoginForm({
        email: 'nonexistent_user@example.com',
        password: 'anypassword',
      })
      cy.get('button[type="submit"]').click()

      cy.contains('User not found').should('be.visible')
      cy.url().should('include', '/login')
    })

    it('TC_AUTH_LOGIN_004: Attempt with valid email but invalid password', () => {
      cy.autoFillLoginForm({
        email: fixtureUserData.librarian.email,
        password: 'WrongPassword123!',
      })
      cy.get('button[type="submit"]').click()

      cy.contains('Password incorrect').should('be.visible')
      cy.url().should('include', '/login')
    })

    it('TC_AUTH_LOGIN_005: Attempt to log in with an empty email field', () => {
      cy.autoFillLoginForm({ password: 'anypassword' }) // Email is empty
      cy.get('button[type="submit"]').click()

      cy.contains(/Please enter email and password/i).should('be.visible')
    })

    it('TC_AUTH_LOGIN_006: Attempt to log in with an empty password field', () => {
      cy.autoFillLoginForm({ email: fixtureUserData.librarian.email }) // Password is empty
      cy.get('button[type="submit"]').click()

      cy.contains(/Please enter email and password/i).should('be.visible')
    })
  })

  // --- User Logout Tests ---
  describe('User Logout', () => {
    const performLogout = () => {
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()
    }

    it('TC_AUTH_LOGOUT_001: Successfully log out a Librarian', () => {
      if (!fixtureUserData?.librarian)
        throw new Error('Librarian fixture data not loaded')
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/dashboard')
      performLogout()
      cy.url().should('include', '/login')
    })

    it('TC_AUTH_LOGOUT_002: Successfully log out a Member', () => {
      if (!fixtureUserData?.member)
        throw new Error('Member fixture data not loaded')
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.visit('/books')
      performLogout()
      cy.url().should('include', '/login')
    })
  })

  // --- Role-Based Access Control (RBAC) Tests ---
  describe('Role-Based Access Control (RBAC)', () => {
    it('TC_AUTH_RBAC_001: Verify Librarian can access admin features', () => {
      if (!fixtureUserData?.librarian)
        throw new Error('Librarian fixture data not loaded')
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/users')
      cy.contains('h3', 'Users').should('be.visible')
    })

    it('TC_AUTH_RBAC_002: Verify Member cannot access admin features', () => {
      if (!fixtureUserData?.member)
        throw new Error('Member fixture data not loaded')
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.visit('/users', { failOnStatusCode: false })
      cy.url().should('not.include', '/users')
      cy.url().should('include', '/404')
    })
  })
})
