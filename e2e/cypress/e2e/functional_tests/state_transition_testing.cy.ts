/**
 * E2E Test Cases for State Transition Testing
 * File: cypress/e2e/state_transition_testing.cy.ts
 *
 * Tests state transitions for Borrowal Records, Book Availability, and User Sessions.
 * This file has been refactored for correctness and robustness by ensuring tests
 * create their own data and leverage custom commands for efficiency.
 * Based on TC_State_Transition_Testing
 */

describe('E2E: State Transition Testing', () => {
  const testTimestamp: number = Date.now()
  let fixtureUserData: any

  before(function () {
    // Load user data from fixture once for all tests
    cy.fixture('user-data.json')
      .as('userData')
      .then((data) => {
        fixtureUserData = data
      })
  })

  beforeEach(() => {
    // Intercept API calls for borrowals and books before each test
    cy.intercept('POST', '/api/borrowals/add').as('createBorrowal')
    cy.intercept('PUT', '/api/borrowals/update/*').as('updateBorrowal')
    cy.intercept('POST', '/api/books/add').as('createBook')
  })

  // --- Borrowal Record State Transitions ---
  describe('Borrowal Record State Transitions', () => {
    it('TC_STATE_BORROW_001 & TC_STATE_BORROW_002: (None) -> Borrowed -> Returned', function () {
      const newBook = {
        name: `State Test Book ${testTimestamp}`,
        isbn: `STB-${testTimestamp}`,
        author: 'Agatha Christie',
        genre: 'Mystery',
      }

      // SETUP: As a librarian, create a new book to ensure it's available.
      // Uses the loginAsLibrarian and fillBookForm custom commands
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      cy.fillBookForm(newBook)
      cy.get('div[role="presentation"]').contains('button', 'Submit').click()
      cy.wait('@createBook')

      // TC_STATE_BORROW_001: Transition from (None) to "Borrowed"
      // Uses the loginAsMember custom command
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.visit('/borrowals')
      cy.contains('button', 'New Borrowal').click()

      // Fill and submit the borrowal form
      cy.get('div.MuiModal-root').within(() => {
        cy.get('#book').parent().click()
        cy.get('li[role="option"]').contains(newBook.name).click()
        cy.contains('button', 'Submit').click()
      })
      cy.wait('@createBorrowal').its('response.statusCode').should('eq', 201)

      // VERIFY: The new borrowal record has the "Borrowed" status
      cy.extendPagination()
      cy.contains('tr', newBook.name)
        .should('be.visible')
        .within(() => {
          cy.contains('td', 'Borrowed').should('be.visible')
        })

      // TC_STATE_BORROW_002: Transition from "Borrowed" to "Returned"
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/borrowals')
      cy.extendPagination()

      // Find the record and mark it as returned
      cy.contains('tr', newBook.name).within(() => {
        cy.get('td:last-child button').click()
      })
      cy.get('.MuiPopover-root').contains('li', 'Edit').click()

      cy.get('div.MuiModal-root')
        .first()
        .within(() => {
          cy.get('input[name="status"]').clear().type('Returned')
          cy.contains('button', 'Submit').click()
        })
      cy.wait('@updateBorrowal').its('response.statusCode').should('eq', 200)

      // VERIFY: The record now has the "Returned" status
      cy.extendPagination()
      cy.contains('tr', newBook.name).within(() => {
        cy.contains('td', 'Returned').should('be.visible')
      })
    })
  })

  // --- Book Availability State Transitions ---
  describe('Book Availability State Transitions', () => {
    it('TC_STATE_BOOK_001 & TC_STATE_BOOK_002: Available -> Unavailable -> Available', function () {
      const bookToBorrow = {
        name: `Book Availability Test ${testTimestamp}`,
        isbn: `BAT-${testTimestamp}`,
        author: 'Isaac Asimov',
        genre: 'Science Fiction',
      }
      // SETUP: Create a new book to guarantee its 'Available' state.
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      cy.fillBookForm(bookToBorrow)
      // FIX: Using corrected selector for modal interaction
      cy.get('div[role="presentation"]').contains('button', 'Submit').click()
      cy.wait('@createBook')

      // TC_STATE_BOOK_001: Transition from 'Available' to 'Unavailable'
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.visit('/borrowals')
      cy.contains('button', 'New Borrowal').click()
      cy.get('div.MuiModal-root').within(() => {
        cy.get('#book').parent().click()
        cy.get('li[role="option"]').contains(bookToBorrow.name).click()
        cy.contains('button', 'Submit').click()
      })
      cy.wait('@createBorrowal')

      // VERIFY: Book is now 'Not Available'
      cy.visit('/books')
      cy.contains('.MuiCard-root', bookToBorrow.name)
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]')
        .contains('span', 'Not available')
        .should('be.visible')
      cy.get('div[role="dialog"]').contains('button', 'Close').click()

      // TC_STATE_BOOK_002: Transition from 'Unavailable' to 'Available'
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/borrowals')
      cy.extendPagination()

      cy.contains('tr', bookToBorrow.name).find('td:last-child button').click()
      cy.get('.MuiPopover-root').contains('li', 'Edit').click()

      // FIX: Using corrected selector for modal interaction
      cy.get('div.MuiModal-root')
        .first()
        .within(() => {
          cy.get('input[name="status"]').clear().type('Returned')
          cy.contains('button', 'Submit').click()
        })
      cy.wait('@updateBorrowal')

      // VERIFY: Book is 'Available' again
      cy.visit('/books')
      cy.contains('.MuiCard-root', bookToBorrow.name)
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
      // Start in a "Logged-Out" state
      cy.visit('/login')
      cy.url().should('include', '/login')

      // TC_STATE_SESSION_001: Transition to "Logged-In"
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.url().should('not.include', '/login')
      cy.url().should('include', '/books')
      cy.contains('h3', 'Books').should('be.visible')

      // TC_STATE_SESSION_002: Transition to "Logged-Out"
      cy.performLogout()
      cy.url().should('include', '/login')
    })

    it('TC_STATE_SESSION_004: State should persist on page refresh when Logged-In', function () {
      // Log in and navigate to a page
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/dashboard')
      cy.contains('h4', /Welcome back/i).should('be.visible')

      // VERIFY: Session remains after a page reload
      cy.reload()
      cy.contains('h4', /Welcome back/i).should('be.visible')
      cy.url().should('include', '/dashboard')
    })

    it('TC_STATE_SESSION_003: Should deny access to protected page when Logged-Out', function () {
      // Ensure user is logged out
      cy.clearUserSession()

      // VERIFY: Attempting to access a protected page redirects to login
      cy.visit('/dashboard', { failOnStatusCode: false })
      cy.url().should('include', '/login')
      cy.contains('h3', 'Sign in').should('be.visible')
    })
  })
})
