/**
 * E2E Test Cases for Use Case Testing
 * File: cypress/e2e/use_case_testing.cy.ts
 * * Tests key use cases: Add New Book (UC-002), Borrow a Book (UC-003), View Borrowal History (UC-005)
 * Based on TC_Use_Case_Testing
 */

describe('E2E: Use Case Testing', () => {
  const testTimestamp: number = Date.now()
  let fixtureUserData: any

  before(function () {
    cy.fixture('user-data.json')
      .as('userData')
      .then((data) => {
        fixtureUserData = data
      })
    // API intercepts for all tests in this suite
    cy.intercept('POST', '/api/books/add').as('createBook')
    cy.intercept('POST', '/api/users/add').as('createUser')
    cy.intercept('POST', '/api/borrowals/add').as('createBorrowal')
  })

  // --- UC-002: Add New Book (Librarian) ---
  describe('UC-002: Add New Book (Librarian)', () => {
    beforeEach(function () {
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
    })

    it('TC_UC_BOOK_001: Successful addition of a new book (Main Flow)', () => {
      cy.visit('/books')
      cy.contains('button', 'New Book').click()

      const newBook = {
        name: `UC Test Book ${testTimestamp}`,
        isbn: `UC-${testTimestamp}`,
        author: 'Agatha Christie',
        genre: 'Mystery',
        summary: 'A book for use case testing',
      }

      cy.fillBookForm(newBook)
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createBook')

      cy.contains('.MuiCard-root', newBook.name).should('be.visible')
    })

    it('TC_UC_BOOK_002: Attempt to add a book with missing required fields (Alternative Flow A1)', () => {
      cy.visit('/books')
      cy.contains('button', 'New Book').click()

      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.contains('Name is required').should('be.visible')
      cy.get('div[role="dialog"]').should('be.visible')
      cy.get('div[role="dialog"]').contains('button', 'Cancel').click()
    })
  })

  // --- UC-003: Borrow a Book (Member) ---
  describe('UC-003: Borrow a Book (Member)', () => {
    beforeEach(function () {
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
    })

    it('TC_UC_BORROW_001: Successful borrowing of an available book (Main Flow)', function () {
      cy.visit('/books')
      cy.contains('.MuiCard-root', '1984')
        .contains('button', 'View Details & Reviews')
        .click()

      cy.get('div[role="dialog"]').contains('button', 'Borrow Book').click()

      // Verify Member field is auto-populated and dates are correct
      cy.get('div[role="dialog"]')
        .find('#member')
        .should('contain', fixtureUserData.member.name)
      const today = new Date().toISOString().split('T')[0]
      cy.get('input[name="borrowedDate"]').should('have.value', today)

      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createBorrowal')

      cy.visit('/reviews')
      cy.contains('tr', '1984').should('be.visible')
    })

    it('TC_UC_BORROW_002: Attempt to borrow an unavailable book (Alternative Flow A1)', () => {
      // This test assumes a book named 'Foundation' is already borrowed and thus unavailable.
      cy.visit('/books')
      cy.contains('.MuiCard-root', 'Foundation')
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]').within(() => {
        cy.get('span').contains('Not Available').should('be.visible')
        cy.get('button').contains('Borrow Book').should('not.exist')
      })
    })
  })

  // --- UC-005: View Borrowal History (Member) ---
  describe('UC-005: View Borrowal History (Member)', () => {
    it('TC_UC_HISTORY_001: View non-empty borrowal history (Main Flow)', function () {
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.visit('/reviews')

      cy.get('table tbody tr').should('have.length.greaterThan', 0)
      cy.get('thead tr')
        .should('contain', 'Book')
        .and('contain', 'Borrower')
        .and('contain', 'Status')
    })

    it('TC_UC_HISTORY_002: View empty borrowal history (Alternative Flow A1)', function () {
      const newUser = {
        name: `NoHistory Member ${testTimestamp}`,
        email: `no_history_${testTimestamp}@example.com`,
        password: 'password123',
        isAdmin: false,
      }
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(newUser)
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createUser')

      cy.loginAsMember(newUser.email, newUser.password)
      cy.visit('/reviews')
      cy.contains('p', 'No reviews found').should('be.visible')
    })
  })
})
