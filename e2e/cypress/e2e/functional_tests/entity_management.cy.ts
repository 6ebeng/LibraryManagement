/**
 * E2E Test Cases for Entity Management (CRUD Operations)
 * File: cypress/e2e/entity_management.cy.ts
 * * Tests CRUD operations for Books, Authors, Genres, Users, and Borrowals.
 * Refactored to use custom commands and API interceptions for robustness.
 */
describe('E2E: Entity Management (CRUD Operations)', () => {
  const testTimestamp = Date.now()

  before(function () {
    cy.fixture('user-data.json').as('userData')
  })

  beforeEach(function () {
    // Set up all potential API intercepts for this test suite
    cy.intercept('POST', '/api/books').as('createBook')
    cy.intercept('PUT', '/api/books/*').as('updateBook')
    cy.intercept('DELETE', '/api/books/*').as('deleteBook')
    cy.intercept('POST', '/api/authors').as('createAuthor')
    cy.intercept('DELETE', '/api/authors/*').as('deleteAuthor')
    cy.intercept('POST', '/api/genres').as('createGenre')
    cy.intercept('DELETE', '/api/genres/*').as('deleteGenre')
    cy.intercept('POST', '/api/users').as('createUser')
    cy.intercept('DELETE', '/api/users/*').as('deleteUser')
    cy.intercept('POST', '/api/borrowals').as('createBorrowal')
    cy.intercept('PUT', '/api/borrowals/*').as('updateBorrowal')
    cy.intercept('POST', '/api/reviews').as('createReview')
    cy.intercept('DELETE', '/api/reviews/*').as('deleteReview')

    cy.loginAsLibrarian(
      this.userData.librarian.email,
      this.userData.librarian.password
    )
  })

  // --- Book Management Tests ---
  describe('Book Management (CRUD)', () => {
    it('TC_BOOK_CREATE_001 & TC_BOOK_DELETE_001: Successfully creates and deletes a book', () => {
      cy.visit('/books')
      cy.contains('button', 'New Book').click()

      const newBook = {
        name: `Test Book ${testTimestamp}`,
        isbn: `ISBN-${testTimestamp}`,
        author: 'Agatha Christie', // Assuming this author exists
        genre: 'Mystery', // Assuming this genre exists
        summary: 'A test book for automated testing',
      }

      cy.fillBookForm(newBook)
      cy.contains('button', 'Submit').click()

      cy.wait('@createBook').its('response.statusCode').should('eq', 201)
      cy.contains(newBook.name).should('be.visible')

      // Now delete the book
      cy.deleteFromTable(newBook.name)
      cy.wait('@deleteBook').its('response.statusCode').should('eq', 204)
      cy.contains(newBook.name).should('not.exist')
    })

    it('TC_BOOK_CREATE_002: Attempt to create a book with missing required fields', () => {
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      cy.contains('button', 'Submit').click()
      cy.contains('Name is required').should('be.visible')
      cy.contains('ISBN is required').should('be.visible')
    })
  })

  // --- Author Management Tests ---
  describe('Author Management (CRUD)', () => {
    it('TC_AUTHOR_CREATE_001: Successfully creates a new author', () => {
      cy.visit('/authors')
      cy.contains('button', 'New Author').click()

      const newAuthor = {
        name: `Test Author ${testTimestamp}`,
        biography: `Biography for test author ${testTimestamp}`,
      }

      cy.fillAuthorForm(newAuthor)
      cy.contains('button', 'Submit').click()

      cy.wait('@createAuthor')
      cy.contains('td', newAuthor.name).should('be.visible')
    })

    it('TC_AUTHOR_DELETE_001: Attempt to delete an author linked to a book', () => {
      cy.visit('/authors')
      cy.contains('td', 'Agatha Christie')
        .parent()
        .within(() => {
          cy.get('td:last-child button').click()
        })
      cy.get('.MuiPopover-root').contains('li', 'Delete').click()
      cy.get('.MuiDialog-container')
        .should('be.visible')
        .and('contain.text', 'Cannot delete author')
    })
  })

  // --- Genre Management Tests ---
  describe('Genre Management (CRUD)', () => {
    it('TC_GENRE_CREATE_001: Successfully creates a new genre', () => {
      cy.visit('/genres')
      cy.contains('button', 'New Genre').click()

      const newGenre = {
        name: `Test Genre ${testTimestamp}`,
        description: `Description for test genre ${testTimestamp}`,
      }

      cy.fillGenreForm(newGenre)
      cy.contains('button', 'Submit').click()

      cy.wait('@createGenre')
      cy.contains('td', newGenre.name).should('be.visible')
    })
  })

  // --- User Management Tests ---
  describe('User Management (CRUD)', () => {
    it('TC_USER_CREATE_001: Successfully creates a new user', () => {
      cy.visit('/users')
      cy.contains('button', 'New User').click()

      const newMember = {
        name: `Test Member ${testTimestamp}`,
        email: `test_member_${testTimestamp}@example.com`,
        password: 'TestPassword123!',
        isAdmin: false,
      }

      cy.fillRegistrationForm(newMember)
      cy.contains('button', 'Submit').click()

      cy.wait('@createUser')
      cy.contains('td', newMember.email).should('be.visible')
    })
  })

  // --- Review Management Tests ---
  describe('Review Management', () => {
    it('TC_REVIEW_CREATE_001: Member can create a review', function () {
      cy.loginAsMember(
        this.userData.member.email,
        this.userData.member.password
      )
      cy.visit('/books')

      cy.contains('.MuiCard-root', 'Murder on the Orient Express').within(
        () => {
          cy.contains('button', 'View Details & Reviews').click()
        }
      )

      const review = {
        rating: 4,
        comment: `A fantastic read! ${testTimestamp}`,
      }
      cy.fillReviewForm(review)

      cy.wait('@createReview')
        .its('response.statusCode')
        .should('be.oneOf', [200, 201])
      cy.get('div[role="dialog"]').contains(review.comment).should('be.visible')
    })

    it('TC_REVIEW_DELETE_001: Librarian can delete a review', function () {
      // Assumes a review exists to be deleted.
      // A more robust test would first create a review as a member.
      cy.visit('/reviews')
      cy.get('tbody tr')
        .first()
        .within(() => {
          const reviewText = cy.get('td').eq(2) // Get comment text to verify later
          cy.get('td:last-child button').click()
        })
      cy.get('.MuiPopover-root').contains('li', 'Delete').click()
      cy.get('.MuiDialog-container').contains('button', 'Delete').click()
      cy.wait('@deleteReview')
      // Add assertion here that the review is gone
    })
  })
})
