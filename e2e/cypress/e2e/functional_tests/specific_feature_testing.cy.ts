/**
 * E2E Test Cases for Specific Feature Testing
 * File: cypress/e2e/specific_feature_testing.cy.ts
 * * Tests specific features: Dashboard, Book Management, Borrowal Management, User Management, Review Management
 * Based on TC_Specific_Feature_Testing.tex
 */

describe('E2E: Specific Feature Testing', () => {
  const testTimestamp: number = Date.now()
  let fixtureUserData: any

  before(function () {
    cy.fixture('user-data.json')
      .as('userData')
      .then((data) => {
        fixtureUserData = data
      })
  })

  // --- Dashboard Tests ---
  describe('Dashboard Features', () => {
    it('TC_DASH_001: Verify Librarian can access the Dashboard', function () {
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/dashboard')

      cy.url().should('include', '/dashboard')
      cy.contains('h4', /Welcome back/i).should('be.visible')

      // Verify dashboard components are present
      cy.get('.MuiGrid-container .MuiPaper-root').should(
        'have.length.at.least',
        4
      ) // For stat cards
      cy.get('.apexcharts-canvas').should('be.visible')
    })

    it('TC_DASH_002: Verify Member cannot access the Dashboard', function () {
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.visit('/dashboard', { failOnStatusCode: false })

      cy.url().should('not.include', '/dashboard')
      cy.contains('Sorry, page not found!').should('be.visible')
    })
  })

  // --- Book Management Feature Tests ---
  describe('Book Management Features', () => {
    beforeEach(function () {
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.intercept('POST', '/api/books').as('createBook')
      cy.intercept('PUT', '/api/books/*').as('updateBook')
      cy.intercept('DELETE', '/api/books/*').as('deleteBook')
    })

    it('TC_BOOK_ADD_001 & TC_BOOK_ADD_002: Successful new book creation and validation', () => {
      cy.visit('/books')
      cy.contains('button', 'New Book').click()

      // TC_BOOK_ADD_002: Attempt to create a book with missing required fields
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.contains('Name is required').should('be.visible')

      // TC_BOOK_ADD_001: Successful creation
      const newBook = {
        name: `Feature Test Book ${testTimestamp}`,
        isbn: `FT-${testTimestamp}`,
        author: 'Agatha Christie',
        genre: 'Mystery',
        summary: 'A book for specific feature testing',
      }

      cy.fillBookForm(newBook)
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createBook')

      cy.contains(newBook.name).should('be.visible')
    })

    it('TC_BOOK_VIEW_001: Verify any user can view list of books and book details', function () {
      cy.loginAsMember(
        fixtureUserData.member.email,
        fixtureUserData.member.password
      )
      cy.visit('/books')

      cy.get('.MuiGrid-container .MuiCard-root').should(
        'have.length.greaterThan',
        0
      )

      cy.get('.MuiCard-root')
        .first()
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]').should('be.visible')
      cy.get('div[role="dialog"]').contains('h2', /.+/).should('be.visible') // Check for book title in dialog
    })

    it('TC_BOOK_DEL_001 & TC_BOOK_UPD_001: Librarian can update and delete a book', function () {
      // First, create a book to safely update and delete
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      const bookData = {
        name: `Updatable Book ${testTimestamp}`,
        isbn: `UPD-${testTimestamp}`,
        author: 'Jane Austen',
        genre: 'Romance',
      }
      cy.fillBookForm(bookData)
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createBook')

      // Update the book (TC_BOOK_UPD_001)
      cy.contains('.MuiCard-root', bookData.name)
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]').contains('button', 'Edit').click()
      const updatedSummary = `This summary was updated at ${new Date().toLocaleTimeString()}`
      cy.get('div[role="dialog"]')
        .find('textarea[name="summary"]')
        .clear()
        .type(updatedSummary)
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@updateBook')
      cy.get('div[role="dialog"]').contains(updatedSummary).should('be.visible')
      cy.get('div[role="dialog"]').contains('button', 'Close').click()

      // Delete the book (TC_BOOK_DEL_001)
      cy.contains('.MuiCard-root', bookData.name)
        .find('button[aria-label="menu"]')
        .click()
      cy.get('.MuiPopover-root').contains('li', 'Delete').click()
      cy.get('div[role="dialog"]').contains('button', 'Delete').click()
      cy.wait('@deleteBook')
      cy.contains(bookData.name).should('not.exist')
    })
  })

  // --- Borrowal and Review Management ---
  describe('Borrowal and Review Features', () => {
    it('TC_BORW_ADD_001 & TC_REV_ADD_001: Member can borrow a book and then submit a review', function () {
      cy.loginAsMember(
        this.userData.member.email,
        this.userData.member.password
      )
      cy.intercept('POST', '/api/borrowals').as('createBorrowal')
      cy.intercept('POST', '/api/reviews').as('createReview')

      // Borrow a book
      cy.visit('/books')
      cy.contains('.MuiCard-root', '1984')
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]').contains('button', 'Borrow Book').click()
      cy.get('div[role="dialog"]').find('#member-label').parent().click()
      cy.get('li[role="option"]').contains(this.userData.member.email).click()
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createBorrowal')

      // Add a review for the borrowed book
      cy.visit('/reviews')
      cy.extendPagination()
      cy.contains('tr', '1984').within(() => {
        cy.contains('button', 'Add Review').click()
      })

      const review = {
        rating: 5,
        comment: `Excellent dystopian novel. A must-read! - ${testTimestamp}`,
      }
      cy.fillReviewForm(review)
      cy.wait('@createReview')

      // Verify review appears on book details page
      cy.visit('/books')
      cy.contains('.MuiCard-root', '1984')
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]').contains(review.comment).should('be.visible')
    })
  })

  // --- User Management ---
  describe('User Management by Librarian', () => {
    beforeEach(function () {
      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )
    })

    it('TC_USER_VIEW_001: Librarian can view the list of all users', () => {
      cy.visit('/users')
      cy.get('table').should('be.visible')
      cy.get('tbody tr').should('have.length.gt', 0)
      cy.contains('td', 'Librarian').should('be.visible')
      cy.contains('td', 'Member').should('be.visible')
    })

    it('TC_USER_DEL_001 & TC_USER_UPD_001: Librarian can create, update, and delete a user', function () {
      const newUser = {
        name: `Temp User ${testTimestamp}`,
        email: `temp_user_${testTimestamp}@example.com`,
        password: 'password123',
        isAdmin: false,
      }

      // Create
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(newUser)
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createUser')
      cy.extendPagination()
      cy.contains('td', newUser.email).should('be.visible')

      // Update
      cy.contains('tr', newUser.email).find('td:last-child button').click()
      cy.get('.MuiPopover-root').contains('li', 'Edit').click()
      const updatedName = `Updated ${newUser.name}`
      cy.get('div[role="dialog"]')
        .find('input[name="name"]')
        .clear()
        .type(updatedName)
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.contains('td', updatedName).should('be.visible')

      // Delete
      cy.deleteFromTable(updatedName)
      cy.wait('@deleteUser')
      cy.contains(updatedName).should('not.exist')
    })
  })
})
