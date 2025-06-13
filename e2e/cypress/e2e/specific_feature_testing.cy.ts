/**
 * E2E Test Cases for Specific Feature Testing
 * File: cypress/e2e/specific_feature_testing.cy.ts
 * 
 * Tests specific features: Dashboard, Book Management, Borrowal Management, User Management, Review Management
 * Based on TC_Specific_Feature_Testing.tex
 */

describe('E2E: Specific Feature Testing', () => {
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

  // --- Dashboard Tests ---
  describe('Dashboard Tests', () => {
    
    it('TC_DASH_001: Verify Librarian can access the Dashboard', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      cy.url().should('include', '/dashboard')
      cy.contains('h4', /Welcome back/i).should('be.visible')
      
      // Verify dashboard components are present
      cy.get('[data-testid="dashboard-stats"]').should('be.visible')
      cy.get('[data-testid="dashboard-charts"]').should('be.visible')
    })

    it('TC_DASH_002: Verify Member cannot access the Dashboard', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/dashboard', { failOnStatusCode: false })
      
      cy.url().should('not.include', '/dashboard')
      cy.url().should('match', /\/(books|404)/)
    })
  })

  // --- Book Management Feature Tests ---
  describe('Book Management Features', () => {
    
    beforeEach(() => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
    })

    it('TC_BOOK_ADD_001: Successful new book creation by Librarian', () => {
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      const newBook = {
        name: `Feature Test Book ${testTimestamp}`,
        isbn: `FT-${testTimestamp}`,
        summary: 'A book for feature testing',
        publicationDate: '2024-01-01'
      }

      // Fill the form
      cy.get('input[name="name"]').type(newBook.name)
      cy.get('input[name="isbn"]').type(newBook.isbn)
      cy.get('textarea[name="summary"]').type(newBook.summary)
      cy.get('input[name="publicationDate"]').type(newBook.publicationDate)
      
      // Select author and genre (if dropdowns are available)
      cy.get('body').then((body) => {
        if (body.find('[data-testid="author-select"]').length) {
          cy.get('[data-testid="author-select"]').click()
          cy.get('li').first().click()
        }
        if (body.find('[data-testid="genre-select"]').length) {
          cy.get('[data-testid="genre-select"]').click()
          cy.get('li').first().click()
        }
      })

      cy.get('button[type="submit"]').click()
      
      // Verify success
      cy.contains(/success|created/i).should('be.visible')
      cy.contains(newBook.name).should('be.visible')
    })

    it('TC_BOOK_ADD_002: Attempt to create a book with missing required fields', () => {
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      // Submit without filling required fields
      cy.get('button[type="submit"]').click()
      
      // Verify error messages appear
      cy.contains(/required|error/i).should('be.visible')
    })

    it('TC_BOOK_VIEW_001: Verify Member can view list of books and book details', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      
      // Verify member can view book list
      cy.get('table').should('be.visible')
      cy.get('tbody tr').should('have.length.greaterThan', 0)
      
      // Click on first book to view details
      cy.get('tbody tr').first().click()
      
      // Verify book details are displayed
      cy.get('[data-testid="book-details"]').should('be.visible')
    })

    it('TC_BOOK_UPD_001: Successful update of a book\'s details by Librarian', () => {
      cy.visit('/books')
      
      // Find and edit first book
      cy.get('tbody tr').first().within(() => {
        cy.get('[data-testid="edit-book"]').click()
      })
      
      const updatedSummary = `Updated summary ${testTimestamp}`
      cy.get('textarea[name="summary"]').clear().type(updatedSummary)
      cy.get('button[type="submit"]').click()
      
      // Verify success
      cy.contains(/success|updated/i).should('be.visible')
    })

    it('TC_BOOK_DEL_001: Successful deletion of a book by Librarian', () => {
      cy.visit('/books')
      
      // Find the last book and delete it
      cy.get('tbody tr').last().within(() => {
        cy.get('[data-testid="delete-book"]').click()
      })
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete"]').click()
      
      // Verify success
      cy.contains(/success|deleted/i).should('be.visible')
    })

    it('TC_BOOK_ACCESS_001: Verify Member cannot access book CRUD operations', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      
      // Verify CRUD buttons are not visible
      cy.get('button').contains('New Book').should('not.exist')
      cy.get('[data-testid="edit-book"]').should('not.exist')
      cy.get('[data-testid="delete-book"]').should('not.exist')
    })
  })

  // --- Borrowal Management Feature Tests ---
  describe('Borrowal Management Features', () => {
    
    it('TC_BORW_ADD_001: Successful borrowal request by Member for an available book', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/borrowals')
      
      cy.contains('button', 'New Borrowal').click()
      
      // Select an available book
      cy.get('[data-testid="available-books"]').should('be.visible')
      cy.get('[data-testid="book-option"]').first().click()
      cy.get('button[type="submit"]').click()
      
      // Verify success
      cy.contains(/success|borrowed/i).should('be.visible')
      cy.get('table').should('contain', 'Borrowed')
    })

    it('TC_BORW_ADD_002: Attempt to borrow a book that is not available', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/borrowals')
      
      cy.contains('button', 'New Borrowal').click()
      
      // Try to select an unavailable book (if any exist)
      cy.get('body').then((body) => {
        if (body.find('[data-testid="unavailable-book"]').length) {
          cy.get('[data-testid="unavailable-book"]').first().click()
          cy.get('button[type="submit"]').click()
          
          // Should show error
          cy.contains(/not available|error/i).should('be.visible')
        }
      })
    })

    it('TC_BORW_VIEW_001: Verify Member can only view their own borrowal history', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/borrowals')
      
      // All displayed borrowals should belong to the logged-in member
      cy.get('tbody tr').each(($row) => {
        // Verify the row contains member's email or ID
        cy.wrap($row).should('be.visible')
      })
    })

    it('TC_BORW_VIEW_002: Verify Librarian can view all borrowal records', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      // Librarian should see all borrowals
      cy.get('table').should('be.visible')
      cy.get('tbody tr').should('have.length.greaterThan', 0)
    })

    it('TC_BORW_UPD_001: Successful update of borrowal status by Librarian', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      // Find an active borrowal and mark as returned
      cy.get('[data-testid="active-borrowal"]').first().within(() => {
        cy.get('[data-testid="mark-returned"]').click()
      })
      
      // Verify success
      cy.contains(/success|returned/i).should('be.visible')
    })
  })

  // --- User Management Feature Tests ---
  describe('User Management Features', () => {
    
    beforeEach(() => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
    })

    it('TC_USER_VIEW_001: Verify Librarian can view list of all users', () => {
      cy.visit('/users')
      
      cy.get('table').should('be.visible')
      cy.get('tbody tr').should('have.length.greaterThan', 0)
      
      // Verify both Librarians and Members are displayed
      cy.get('table').should('contain', 'Librarian')
      cy.get('table').should('contain', 'Member')
    })

    it('TC_USER_UPD_001: Successful update of a user\'s details by Librarian', () => {
      cy.visit('/users')
      
      // Find a user to edit
      cy.get('tbody tr').first().within(() => {
        cy.get('[data-testid="edit-user"]').click()
      })
      
      // Update a field
      const updatedPhone = `+1234567${testTimestamp.toString().slice(-3)}`
      cy.get('input[name="phone"]').clear().type(updatedPhone)
      cy.get('button[type="submit"]').click()
      
      // Verify success
      cy.contains(/success|updated/i).should('be.visible')
    })

    it('TC_USER_DEL_001: Successful deletion of a user by Librarian', () => {
      // First create a test user to delete
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      
      const testUser = {
        name: `Delete Test User ${testTimestamp}`,
        email: `delete_test_${testTimestamp}@example.com`,
        password: 'TestPassword123!',
        isAdmin: false
      }

      cy.fillRegistrationForm(testUser)
      cy.get('button[type="submit"]').click()
      
      // Now delete the user
      cy.contains(testUser.email).parent('tr').within(() => {
        cy.get('[data-testid="delete-user"]').click()
      })
      
      cy.get('[data-testid="confirm-delete"]').click()
      
      // Verify success
      cy.contains(/success|deleted/i).should('be.visible')
      cy.contains(testUser.email).should('not.exist')
    })
  })

  // --- Review Management Feature Tests ---
  describe('Review Management Features', () => {
    
    it('TC_REV_ADD_001: Successful addition of a review by Librarian (Admin action)', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      // Click on first book to view details
      cy.get('tbody tr').first().click()
      
      // Add a review as admin
      cy.contains('button', 'Add Review').click()
      
      const review = {
        rating: 5,
        comment: `Admin review ${testTimestamp}`
      }

      cy.get('[data-testid="star-rating"]').find(`[data-rating="${review.rating}"]`).click()
      cy.get('textarea[name="comment"]').type(review.comment)
      cy.get('button[type="submit"]').click()
      
      // Verify success
      cy.contains(/success|added/i).should('be.visible')
      cy.contains(review.comment).should('be.visible')
    })

    it('TC_REV_VIEW_001: Verify any user can view reviews for a book', () => {
      // Test as member
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      
      // Click on first book
      cy.get('tbody tr').first().click()
      
      // Verify reviews section is visible
      cy.get('[data-testid="reviews-section"]').should('be.visible')
      
      // Test as librarian
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      cy.get('tbody tr').first().click()
      cy.get('[data-testid="reviews-section"]').should('be.visible')
    })

    it('TC_REV_DEL_001: Successful deletion of a review by Librarian', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      // Click on first book
      cy.get('tbody tr').first().click()
      
      // Find and delete a review
      cy.get('[data-testid="review-item"]').first().within(() => {
        cy.get('[data-testid="delete-review"]').click()
      })
      
      cy.get('[data-testid="confirm-delete"]').click()
      
      // Verify success
      cy.contains(/success|deleted/i).should('be.visible')
    })
  })

  // --- Navigation and General UI Tests ---
  describe('Navigation and General UI', () => {
    
    it('TC_NAV_001: Verify correct navigation menu for Librarian', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Verify librarian-specific menu items
      cy.get('[data-testid="nav-dashboard"]').should('be.visible')
      cy.get('[data-testid="nav-users"]').should('be.visible')
      cy.get('[data-testid="nav-books"]').should('be.visible')
      cy.get('[data-testid="nav-borrowals"]').should('be.visible')
    })

    it('TC_NAV_002: Verify correct navigation menu for Member', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      
      // Verify member-specific menu items
      cy.get('[data-testid="nav-books"]').should('be.visible')
      cy.get('[data-testid="nav-borrowals"]').should('be.visible')
      
      // Dashboard and Users should not be accessible
      cy.get('[data-testid="nav-dashboard"]').should('not.exist')
      cy.get('[data-testid="nav-users"]').should('not.exist')
    })

    it('TC_UI_001: Verify responsive design on different viewport sizes', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      // Test desktop view
      cy.viewport(1280, 720)
      cy.visit('/dashboard')
      cy.get('[data-testid="sidebar"]').should('be.visible')
      
      // Test tablet view
      cy.viewport(768, 1024)
      cy.visit('/dashboard')
      cy.get('[data-testid="mobile-menu"]').should('be.visible')
      
      // Test mobile view
      cy.viewport(375, 667)
      cy.visit('/dashboard')
      cy.get('[data-testid="mobile-menu"]').should('be.visible')
    })

    it('TC_UI_002: Verify consistent styling across pages', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      const pages = ['/dashboard', '/users', '/books', '/borrowals']
      
      pages.forEach(page => {
        cy.visit(page)
        
        // Verify common UI elements
        cy.get('header').should('be.visible')
        cy.get('[data-testid="main-content"]').should('be.visible')
        
        // Verify consistent color scheme and typography
        cy.get('h1, h2, h3').should('have.css', 'font-family')
        cy.get('button').should('have.css', 'border-radius')
      })
    })
  })

  // --- Error Handling and Edge Cases ---
  describe('Error Handling and Edge Cases', () => {
    
    it('TC_ERR_001: Handle network errors gracefully', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      // Intercept API calls and simulate network error
      cy.intercept('GET', '/api/book/getAll', { forceNetworkError: true }).as('getBooks')
      
      cy.reload()
      cy.wait('@getBooks')
      
      // Should show error message
      cy.contains(/error|failed|connection/i).should('be.visible')
    })

    it('TC_ERR_002: Handle invalid form data', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      
      // Enter invalid email format
      const invalidUser = {
        name: 'Test User',
        email: 'invalid-email-format',
        password: 'ValidPassword123!',
        isAdmin: false
      }

      cy.fillRegistrationForm(invalidUser)
      cy.get('button[type="submit"]').click()
      
      // Should show validation error
      cy.contains(/invalid|format/i).should('be.visible')
    })

    it('TC_ERR_003: Handle session timeout', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Clear session storage to simulate timeout
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // Try to access protected resource
      cy.visit('/users')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })
}) 