/**
 * E2E Test Cases for State Transition Testing
 * File: cypress/e2e/state_transition_testing.cy.ts
 * * Tests state transitions for Borrowal Records, Book Availability, and User Sessions
 * Based on TC_State_Transition_Testing
 */

describe('E2E: State Transition Testing', () => {
  let fixtureUserData: any

  before(function () {
    cy.fixture('user-data.json')
      .as('userData')
      .then((data) => {
        fixtureUserData = data
      })
  })

  beforeEach(() => {
    cy.intercept('POST', '/api/borrowals/add').as('createBorrowal')
    cy.intercept('PUT', '/api/borrowals/update/*').as('updateBorrowal')
  })

  // --- Borrowal Record State Transitions ---
  describe('Borrowal Record State Transitions', () => {
    it('TC_STATE_BORROW_001 & TC_STATE_BORROW_002: (None) -> Borrowed -> Returned', function () {
      // TC_STATE_BORROW_001: (None) to "Borrowed"
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.visit('/books')
      cy.contains('.MuiCard-root', '1984')
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]').contains('button', 'Borrow Book').click()
      cy.get('div[role="dialog"]').find('#member-label').parent().click()
      cy.get('li[role="option"]').contains(this.userData.member.email).click()
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createBorrowal')

      cy.visit('/reviews')
      cy.extendPagination()
      cy.contains('tr', '1984').within(() => {
        cy.contains('td', 'Borrowed').should('be.visible')
      })

      // TC_STATE_BORROW_002: "Borrowed" to "Returned"
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/borrowals')
      cy.extendPagination()
      cy.contains('tr', '1984').within(() => {
        cy.get('td:last-child button').click()
      })
      cy.get('.MuiPopover-root').contains('li', 'Mark as Returned').click()
      cy.wait('@updateBorrowal')

      cy.contains('tr', '1984').within(() => {
        cy.contains('td', 'Returned').should('be.visible')
      })
    })
  })

  // --- Book Availability State Transitions ---
  describe('Book Availability State Transitions', () => {
    it('TC_STATE_BOOK_001 & TC_STATE_BOOK_002: Available -> Unavailable -> Available', function () {
      const bookToBorrow = 'Foundation'
      // Ensure book is available before starting
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/books')
      cy.contains('.MuiCard-root', bookToBorrow)
        .contains('button', 'View Details & Reviews')
        .click()
      // This part of the test is tricky without a way to guarantee state.
      // A robust version would use an API call to set the book to 'Available' first.

      // TC_STATE_BOOK_001: Available -> Unavailable
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.visit('/books')
      cy.contains('.MuiCard-root', bookToBorrow)
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]').contains('button', 'Borrow Book').click()
      cy.get('div[role="dialog"]').find('#member-label').parent().click()
      cy.get('li[role="option"]').contains(fixtureUserData.member.email).click()
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createBorrowal')

      cy.visit('/books')
      cy.contains('.MuiCard-root', bookToBorrow)
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]')
        .contains('span', 'Not Available')
        .should('be.visible')
      cy.get('div[role="dialog"]').contains('button', 'Close').click()

      // TC_STATE_BOOK_002: Unavailable -> Available
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/borrowals')
      cy.extendPagination()
      cy.contains('tr', bookToBorrow).find('td:last-child button').click()
      cy.get('.MuiPopover-root').contains('li', 'Mark as Returned').click()
      cy.wait('@updateBorrowal')

      cy.visit('/books')
      cy.contains('.MuiCard-root', bookToBorrow)
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]')
        .contains('span', 'Available')
        .should('be.visible')
    })
  })

  // --- User Session State Transitions ---
  describe('User Session State Transitions', () => {
    it('TC_STATE_SESSION_001 & TC_STATE_SESSION_002: Logged-Out -> Logged-In -> Logged-Out', function () {
      // Start "Logged-Out"
      cy.visit('/login')
      cy.url().should('include', '/login')

      // TC_STATE_SESSION_001: Transition to "Logged-In"
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.url().should('include', '/books')
      cy.contains('h3', 'Books').should('be.visible')

      // TC_STATE_SESSION_002: Transition to "Logged-Out"
      cy.performLogout()
      cy.url().should('include', '/login')
    })

    it('TC_STATE_SESSION_003 & TC_STATE_SESSION_004: State persistence and invalid access', function () {
      // TC_STATE_SESSION_004: Session remains "Logged-In" after page refresh
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/dashboard')
      cy.contains('h4', /Welcome back/i).should('be.visible')

      cy.reload()
      cy.contains('h4', /Welcome back/i).should('be.visible')

      // TC_STATE_SESSION_003: Accessing protected page when "Logged-Out"
      cy.performLogout()
      cy.visit('/dashboard', { failOnStatusCode: false })
      cy.url().should('include', '/login')
    })
  })
})
