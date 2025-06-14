/**
 * E2E Test Cases for Entity Management (CRUD Operations)
 * File: cypress/e2e/entity_management.cy.ts
 * 
 * Tests CRUD operations for Books, Authors, Genres, Users, and Borrowals
 * Based on TC_Entity_Management.tex
 */

describe('E2E: Entity Management (CRUD Operations)', () => {
  const testTimestamp: number = Date.now()

  interface UserCredentials {
    email: string
    password: string
  }
  interface FixtureData {
    librarian: UserCredentials
    member: UserCredentials
  }

  let fixtureUserData: FixtureData

  before(() => {
    cy.fixture('user-data.json').then((data) => {
      fixtureUserData = data
    })
  })

  // --- Book Management Tests ---
  describe('Book Management (CRUD)', () => {
    beforeEach(() => {
      if (!fixtureUserData?.librarian?.email || !fixtureUserData?.librarian?.password) {
        throw new Error('Librarian credentials not found in fixture.')
      }
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
    })

    it('TC_BOOK_CREATE_001: Successful new book creation by Librarian', () => {
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      const newBook = {
        name: `Test Book ${testTimestamp}`,
        isbn: `ISBN-${testTimestamp}`,
        summary: 'A test book for automated testing',
        publicationDate: '2024-01-01'
      }

      // Fill the book form
      cy.get('input[name="name"]').type(newBook.name)
      cy.get('input[name="isbn"]').type(newBook.isbn)
      cy.get('textarea[name="summary"]').type(newBook.summary)
      cy.get('input[name="publicationDate"]').type(newBook.publicationDate)
      
      // Select author and genre (assuming dropdowns exist)
      cy.get('[data-testid="author-select"]').click()
      cy.get('li').first().click() // Select first available author
      
      cy.get('[data-testid="genre-select"]').click() 
      cy.get('li').first().click() // Select first available genre

      cy.get('button[type="submit"]').click()
      
      // Verify success
      cy.contains('Book created successfully').should('be.visible')
      cy.contains(newBook.name).should('be.visible')
    })

    it('TC_BOOK_CREATE_002: Attempt to create a book with missing required fields', () => {
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      // Submit form without filling required fields
      cy.get('button[type="submit"]').click()
      
      // Verify error messages
      cy.contains(/required/i).should('be.visible')
    })

    it('TC_BOOK_CREATE_003: Verify Member cannot create a book', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      
      // New Book button should not be visible for members
      cy.get('button').contains('New Book').should('not.exist')
    })

    it('TC_BOOK_READ_001: Verify all users can view the list of books', () => {
      // Test as Librarian
      cy.visit('/books')
      cy.get('table').should('be.visible')
      
      // Test as Member
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      cy.get('table').should('be.visible')
    })

    it('TC_BOOK_UPDATE_001: Successful book update by Librarian', () => {
      cy.visit('/books')
      
      // Find first book and edit it
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-testid="edit-book"]').click()
      })
      
      const updatedSummary = `Updated summary ${testTimestamp}`
      cy.get('textarea[name="summary"]').clear().type(updatedSummary)
      cy.get('button[type="submit"]').click()
      
      // Verify success
      cy.contains('Book updated successfully').should('be.visible')
    })

    it('TC_BOOK_DELETE_001: Successful book deletion by Librarian', () => {
      // First create a book to delete
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      const bookToDelete = {
        name: `Delete Test Book ${testTimestamp}`,
        isbn: `DELETE-${testTimestamp}`,
        summary: 'Book to be deleted'
      }

      cy.get('input[name="name"]').type(bookToDelete.name)
      cy.get('input[name="isbn"]').type(bookToDelete.isbn)
      cy.get('textarea[name="summary"]').type(bookToDelete.summary)
      
      cy.get('[data-testid="author-select"]').click()
      cy.get('li').first().click()
      cy.get('[data-testid="genre-select"]').click()
      cy.get('li').first().click()
      
      cy.get('button[type="submit"]').click()
      
      // Now delete the book
      cy.contains(bookToDelete.name).parent('tr').within(() => {
        cy.get('[data-testid="delete-book"]').click()
      })
      
      cy.get('[data-testid="confirm-delete"]').click()
      
      // Verify deletion
      cy.contains('Book deleted successfully').should('be.visible')
      cy.contains(bookToDelete.name).should('not.exist')
    })

    it('TC_BOOK_DELETE_002: Attempt to delete a book that is currently borrowed', () => {
      // This test would require a borrowed book setup
      // Implementation depends on how borrowed books are marked in the UI
      cy.visit('/books')
      
      // Find a borrowed book (assuming there's a visual indicator)
      cy.get('[data-testid="borrowed-book"]').first().within(() => {
        cy.get('[data-testid="delete-book"]').click()
      })
      
      // Should show error message
      cy.contains(/cannot delete.*borrowed/i).should('be.visible')
    })
  })

  // --- Author Management Tests ---
  describe('Author Management (CRUD)', () => {
    beforeEach(() => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
    })

    it('TC_AUTHOR_CREATE_001: Successful new author creation by Librarian', () => {
      cy.visit('/authors')
      cy.contains('button', 'New Author').click()
      
      const newAuthor = {
        name: `Test Author ${testTimestamp}`,
        biography: `Biography for test author ${testTimestamp}`
      }

      cy.get('input[name="name"]').type(newAuthor.name)
      cy.get('textarea[name="biography"]').type(newAuthor.biography)
      cy.get('button[type="submit"]').click()
      
      cy.contains('Author created successfully').should('be.visible')
      cy.contains(newAuthor.name).should('be.visible')
    })

    it('TC_AUTHOR_DELETE_001: Attempt to delete an author linked to a book', () => {
      cy.visit('/authors')
      
      // Find an author with books (assuming there's an indicator)
      cy.get('[data-testid="author-with-books"]').first().within(() => {
        cy.get('[data-testid="delete-author"]').click()
      })
      
      cy.contains(/cannot delete.*assigned to books/i).should('be.visible')
    })
  })

  // --- Genre Management Tests ---
  describe('Genre Management (CRUD)', () => {
    beforeEach(() => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
    })

    it('TC_GENRE_CREATE_001: Successful new genre creation by Librarian', () => {
      cy.visit('/genres')
      cy.contains('button', 'New Genre').click()
      
      const newGenre = {
        name: `Test Genre ${testTimestamp}`,
        description: `Description for test genre ${testTimestamp}`
      }

      cy.get('input[name="name"]').type(newGenre.name)
      cy.get('textarea[name="description"]').type(newGenre.description)
      cy.get('button[type="submit"]').click()
      
      cy.contains('Genre created successfully').should('be.visible')
      cy.contains(newGenre.name).should('be.visible')
    })

    it('TC_GENRE_DELETE_001: Attempt to delete a genre linked to a book', () => {
      cy.visit('/genres')
      
      cy.get('[data-testid="genre-with-books"]').first().within(() => {
        cy.get('[data-testid="delete-genre"]').click()
      })
      
      cy.contains(/cannot delete.*assigned to books/i).should('be.visible')
    })
  })

  // --- User Management Tests ---
  describe('User Management (CRUD)', () => {
    beforeEach(() => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
    })

    it('TC_USER_CREATE_001: Successful new user (Member) creation by Librarian', () => {
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      
      const newMember = {
        name: `Test Member ${testTimestamp}`,
        email: `test_member_${testTimestamp}@example.com`,
        password: 'TestPassword123!',
        isAdmin: false
      }

      cy.fillRegistrationForm(newMember)
      cy.get('button[type="submit"]').click()
      
      cy.contains('User created successfully').should('be.visible')
      cy.contains(newMember.email).should('be.visible')
    })

    it('TC_USER_CREATE_002: Attempt to create a user with an existing email', () => {
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      
      // Use existing user email
      const duplicateUser = {
        name: `Duplicate User ${testTimestamp}`,
        email: fixtureUserData.member.email, // Existing email
        password: 'TestPassword123!',
        isAdmin: false
      }

      cy.fillRegistrationForm(duplicateUser)
      cy.get('button[type="submit"]').click()
      
      cy.contains(/user already exists/i).should('be.visible')
    })

    it('TC_USER_READ_001: Verify Member cannot access User Management', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/users', { failOnStatusCode: false })
      
      cy.url().should('not.include', '/users')
      cy.url().should('include', '/404')
    })

    it('TC_USER_DELETE_001: Attempt to delete a member with active borrowals', () => {
      cy.visit('/users')
      
      // Find a user with active borrowals
      cy.get('[data-testid="user-with-borrowals"]').first().within(() => {
        cy.get('[data-testid="delete-user"]').click()
      })
      
      cy.contains(/cannot delete.*active borrowals/i).should('be.visible')
    })
  })

  // --- Borrowal Management Tests ---
  describe('Borrowal Management (CRUD)', () => {
    it('TC_BORROW_CREATE_001: Successful borrowal creation by Member', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/borrowals')
      
      cy.contains('button', 'New Borrowal').click()
      
      // Select an available book
      cy.get('[data-testid="available-book"]').first().click()
      cy.get('button[type="submit"]').click()
      
      cy.contains('Book borrowed successfully').should('be.visible')
    })

    it('TC_BORROW_CREATE_002: Attempt to borrow an unavailable book', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/borrowals')
      
      cy.contains('button', 'New Borrowal').click()
      
      // Try to select an unavailable book
      cy.get('[data-testid="unavailable-book"]').first().click()
      cy.get('button[type="submit"]').click()
      
      cy.contains(/book is not available/i).should('be.visible')
    })

    it('TC_BORROW_READ_001: Verify Member can only see their own borrowal history', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/borrowals')
      
      // All displayed borrowals should belong to the logged-in member
      cy.get('table tbody tr').each(($row) => {
        cy.wrap($row).should('contain', fixtureUserData.member.email)
      })
    })

    it('TC_BORROW_UPDATE_001: Successful borrowal update by Librarian (mark as returned)', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      // Find an active borrowal and mark as returned
      cy.get('[data-testid="active-borrowal"]').first().within(() => {
        cy.get('[data-testid="mark-returned"]').click()
      })
      
      cy.contains('Borrowal updated successfully').should('be.visible')
    })
  })

  // --- Review Management Tests ---
  describe('Review Management (CRUD)', () => {
    it('TC_REVIEW_CREATE_001: Successful review creation by Member', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      
      // Click on a book to view details
      cy.get('table tbody tr').first().click()
      
      cy.contains('button', 'Add Review').click()
      
      const review = {
        rating: 4,
        comment: `Test review ${testTimestamp}`
      }

      cy.get('[data-testid="star-rating"]').find(`[data-rating="${review.rating}"]`).click()
      cy.get('textarea[name="comment"]').type(review.comment)
      cy.get('button[type="submit"]').click()
      
      cy.contains('Review added successfully').should('be.visible')
      cy.contains(review.comment).should('be.visible')
    })

    it('TC_REVIEW_CREATE_002: Attempt to create a review with invalid data', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      
      cy.get('table tbody tr').first().click()
      cy.contains('button', 'Add Review').click()
      
      // Submit without rating
      cy.get('button[type="submit"]').click()
      
      cy.contains(/rating is required/i).should('be.visible')
    })

    it('TC_REVIEW_DELETE_001: Successful review deletion by Librarian', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      cy.get('table tbody tr').first().click()
      
      // Find a review and delete it
      cy.get('[data-testid="review-item"]').first().within(() => {
        cy.get('[data-testid="delete-review"]').click()
      })
      
      cy.get('[data-testid="confirm-delete"]').click()
      
      cy.contains('Review deleted successfully').should('be.visible')
    })
  })
}) 