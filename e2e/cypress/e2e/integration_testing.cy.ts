/**
 * E2E Test Cases for Integration Testing
 * File: cypress/e2e/integration_testing.cy.ts
 * * Tests integration between modules: Entity Lifecycle, Data Integrity, State Transitions, RBAC Integration
 * Based on TC_Integration_Testing.tex
 */

describe('E2E: Integration Testing', () => {
  const testTimestamp = Date.now()

  before(function () {
    cy.fixture('user-data.json').as('userData')
  })

  beforeEach(() => {
    // Set up all potential API intercepts for this test suite
    cy.intercept('POST', '/api/books/add').as('createBook')
    cy.intercept('DELETE', '/api/books/delete/*').as('deleteBook')
    cy.intercept('POST', '/api/authors/add').as('createAuthor')
    cy.intercept('DELETE', '/api/authors/delete/*').as('deleteAuthor')
    cy.intercept('POST', '/api/genres/add').as('createGenre')
    cy.intercept('POST', '/api/users/add').as('createUser')
    cy.intercept('DELETE', '/api/users/delete/*').as('deleteUser')
    cy.intercept('POST', '/api/borrowals/add').as('createBorrowal')
  })

  // --- Full Lifecycle - From Entity Creation to Borrowal ---
  describe('Full Lifecycle - From Entity Creation to Borrowal', () => {
    it('TC_INT_001: End-to-end workflow from creating entities to member borrowing', function () {
      const testData = {
        author: {
          name: `Integ Author ${testTimestamp}`,
          biography: 'Integration author',
        },
        genre: {
          name: `Integ Genre ${testTimestamp}`,
          description: 'Integration genre',
        },
        book: {
          name: `Integ Book ${testTimestamp}`,
          isbn: `INT-${testTimestamp}`,
          summary: 'Integration book',
        },
        member: {
          name: `Integ Member ${testTimestamp}`,
          email: `integ_member_${testTimestamp}@example.com`,
          password: 'TestPassword123!',
          isAdmin: false,
        },
      }

      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )

      // Create Author
      cy.visit('/authors')
      cy.contains('button', 'New Author').click()
      cy.fillAuthorForm(testData.author)
      cy.get('.MuiDialog-container').contains('button', 'Submit').click()
      cy.wait('@createAuthor')

      // Create Genre
      cy.visit('/genres')
      cy.contains('button', 'New Genre').click()
      cy.fillGenreForm(testData.genre)
      cy.get('.MuiDialog-container').contains('button', 'Submit').click()
      cy.wait('@createGenre')

      // Create Book with linked entities
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      cy.fillBookForm({
        ...testData.book,
        author: testData.author.name,
        genre: testData.genre.name,
      })
      cy.get('.MuiDialog-container').contains('button', 'Submit').click()
      cy.wait('@createBook')
      cy.contains(testData.book.name).should('be.visible')

      // Create Member
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(testData.member)
      cy.get('.MuiDialog-container').contains('button', 'Submit').click()
      cy.wait('@createUser')
      cy.extendPagination()
      cy.contains(testData.member.name).should('be.visible')

      // Logout and Login as new Member
      cy.performLogout()
      cy.loginAsMember(testData.member.email, testData.member.password)

      // Find and borrow the book
      cy.visit('/books')
      cy.contains('.MuiCard-root', testData.book.name)
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]').contains('button', 'Borrow Book').click()
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createBorrowal')

      // Verify borrowal and book status change
      cy.visit('/reviews')
      cy.extendPagination()
      cy.contains(testData.book.name).should('be.visible')

      cy.visit('/books')
      cy.contains('.MuiCard-root', testData.book.name)
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]')
        .contains('span', 'Not Available')
        .should('be.visible')
    })
  })

  // --- Data Integrity and Referential Constraints ---
  describe('Data Integrity and Referential Constraints', () => {
    it('TC_INT_002: Verify deleting an Author with linked Books is prevented', function () {
      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )
      cy.visit('/authors')
      cy.extendPagination()

      cy.contains('td', 'Agatha Christie').parent().as('authorRow')
      cy.get('@authorRow').find('td:last-child button').click()
      cy.get('ul[role="menu"]').contains('li', 'Delete').click()
      cy.get('div[role="dialog"]')
        .should('be.visible')
        .and('contain.text', 'Cannot delete author with associated books')
    })

    it('TC_INT_003: Verify deleting a User with active Borrowals is prevented', function () {
      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )

      // Setup: Ensure a member has an active borrowal
      cy.visit('/books')
      cy.contains('.MuiCard-root', '1984')
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="dialog"]')
        .contains('button', 'Borrow Book')
        .click({ force: true })
      cy.get('div[role="dialog"]').find('#member-label').parent().click()
      cy.get('li[role="option"]').contains(this.userData.member.email).click()
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()
      cy.wait('@createBorrowal')

      // Test: Attempt to delete the user
      cy.visit('/users')
      cy.extendPagination()
      cy.deleteFromTable(this.userData.member.name)

      // Verification
      cy.get('div[role="dialog"]').should(
        'contain.text',
        'Cannot delete user with active borrowals'
      )
    })
  })

  // --- Role-Based Access Control (RBAC) Integration ---
  describe('Role-Based Access Control (RBAC) Integration', () => {
    it('TC_INT_005: Verify role restrictions across modules for Members', function () {
      cy.loginAsMember(
        this.userData.member.email,
        this.userData.member.password
      )

      // Attempt to access Librarian-only pages
      cy.visit('/users', { failOnStatusCode: false })
      cy.url().should('not.include', '/users')
      cy.contains('Sorry, page not found!').should('be.visible')

      cy.visit('/dashboard', { failOnStatusCode: false })
      cy.url().should('not.include', '/dashboard')

      // Verify lack of admin controls on allowed pages
      cy.visit('/books')
      cy.contains('button', 'New Book').should('not.exist')
    })
  })
})
