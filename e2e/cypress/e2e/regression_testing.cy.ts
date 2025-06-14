/**
 * E2E Test Cases for Regression Testing
 * File: cypress/e2e/regression_testing.cy.ts
 * 
 * Tests core functionality to ensure no regressions: Authentication, CRUD Operations, User Workflows
 * Based on TC_Regression_Testing.tex
 */

describe('E2E: Regression Testing', () => {
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

  beforeEach(() => {
    // Clear state before each test for clean regression testing
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  // --- Authentication & Core Access (Smoke Tests) ---
  describe('Authentication & Core Access (Smoke Tests)', () => {
    
    it('TC_REG_AUTH_001: Successful login with valid Librarian credentials', () => {
      cy.visit('/login')
      
      // Perform login
      cy.autoFillLoginForm({
        email: fixtureUserData.librarian.email,
        password: fixtureUserData.librarian.password
      })
      cy.get('button[type="submit"]').click()

      // Verify successful authentication
      cy.url().should('not.include', '/login')
      cy.url().should('include', '/dashboard')

      // Verify Librarian dashboard is accessible
      cy.contains('h4', /Welcome back/i).should('be.visible')

      // Verify Librarian-specific functionalities are visible
      cy.visit('/users')
      cy.get('table').should('be.visible')
      cy.contains('button', 'New User').should('be.visible')

      cy.log('✓ Librarian login and access verification successful')
    })

    it('TC_REG_AUTH_002: Successful login with valid Member credentials', () => {
      cy.visit('/login')
      
      // Perform login
      cy.autoFillLoginForm({
        email: fixtureUserData.member.email,
        password: fixtureUserData.member.password
      })
      cy.get('button[type="submit"]').click()

      // Verify successful authentication
      cy.url().should('not.include', '/login')
      cy.url().should('include', '/books')

      // Verify member view
      cy.get('table').should('be.visible')
      
      // Verify Librarian-specific functionalities are NOT visible
      cy.get('body').should('not.contain', 'New Book')
      cy.get('body').should('not.contain', 'New User')

      cy.log('✓ Member login and access verification successful')
    })

    it('TC_REG_AUTH_003: Verify Member cannot access Librarian-specific URLs', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)

      // Attempt to access User Management URL
      cy.visit('/users', { failOnStatusCode: false })
      
      // Should be denied access
      cy.url().should('not.include', '/users')
      cy.url().should('satisfy', (url) => {
        return url.includes('/books') || 
               url.includes('/404') || 
               url.includes('/403') ||
               url.includes('/login')
      })

      // Attempt to access Dashboard URL
      cy.visit('/dashboard', { failOnStatusCode: false })
      cy.url().should('not.include', '/dashboard')

      cy.log('✓ Member access restrictions working correctly')
    })

    it('TC_REG_AUTH_004: Successful logout for a logged-in user', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Perform logout
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()

      // Verify redirect to login page
      cy.url().should('include', '/login')

      // Attempt to use browser back button to access protected page
      cy.visit('/dashboard', { failOnStatusCode: false })
      
      // Should be denied access
      cy.url().should('not.include', '/dashboard')
      cy.url().should('satisfy', (url) => {
        return url.includes('/login') || 
               url.includes('/404') || 
               url.includes('/403')
      })

      cy.log('✓ Logout and session termination successful')
    })
  })

  // --- Core CRUD Functionality (Librarian) ---
  describe('Core CRUD Functionality (Librarian)', () => {
    
    it('TC_REG_CRUD_001: Librarian can add a new book', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')

      const bookData = {
        name: `Regression Test Book ${testTimestamp}`,
        isbn: `REG-${testTimestamp}`,
        summary: 'A book created during regression testing'
      }

      // Add new book
      cy.contains('button', 'New Book').click()
      cy.get('input[name="name"]').type(bookData.name)
      cy.get('input[name="isbn"]').type(bookData.isbn)
      cy.get('textarea[name="summary"]').type(bookData.summary)

      // Select author and genre if available
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
      cy.contains(/success/i).should('be.visible')
      cy.contains(bookData.name).should('be.visible')

      cy.log('✓ Book creation functionality working correctly')
    })

    it('TC_REG_CRUD_002: Librarian can view and update an existing book', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')

      // Find the first book and edit it
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-testid="edit-button"]').click()
      })

      // Verify form is populated with existing data
      cy.get('input[name="name"]').should('have.value').and('not.be.empty')
      cy.get('input[name="isbn"]').should('have.value').and('not.be.empty')

      // Update summary field
      const updatedSummary = `Updated summary ${testTimestamp}`
      cy.get('textarea[name="summary"]').clear().type(updatedSummary)

      cy.get('button[type="submit"]').click()

      // Verify success
      cy.contains(/success|updated/i).should('be.visible')

      // Verify the update is reflected
      cy.contains(updatedSummary).should('be.visible')

      cy.log('✓ Book update functionality working correctly')
    })

    it('TC_REG_CRUD_003: Librarian can register a new user', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/users')

      const userData = {
        name: `Regression Test User ${testTimestamp}`,
        email: `regression_user_${testTimestamp}@example.com`,
        password: 'TestPassword123!',
        isAdmin: false
      }

      // Add new user
      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(userData)
      cy.get('button[type="submit"]').click()

      // Verify success message
      cy.contains(/success/i).should('be.visible')

      // Verify user appears in list
      cy.contains(userData.name).should('be.visible')
      cy.contains(userData.email).should('be.visible')

      // Test that newly created user can log in
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()

      cy.autoFillLoginForm({
        email: userData.email,
        password: userData.password
      })
      cy.get('button[type="submit"]').click()

      // Should successfully login as new user
      cy.url().should('not.include', '/login')
      cy.url().should('include', '/books')

      cy.log('✓ User registration functionality working correctly')
    })

    it('TC_REG_CRUD_004: Librarian can delete entities with proper confirmations', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      // Test deleting an author (if available)
      cy.visit('/authors')
      cy.get('table tbody tr').then(($rows) => {
        if ($rows.length > 0) {
          const authorName = $rows.first().find('td').first().text()
          
          cy.get('table tbody tr').first().within(() => {
            cy.get('[data-testid="delete-button"]').click()
          })

          // Confirm deletion
          cy.get('[data-testid="confirm-button"]').click()
          cy.contains(/success|deleted/i).should('be.visible')

          // Verify author is removed
          cy.get('table').should('not.contain', authorName)
        }
      })

      cy.log('✓ Entity deletion functionality working correctly')
    })
  })

  // --- Core Use Cases / User Workflows ---
  describe('Core Use Cases / User Workflows', () => {
    
    it('TC_REG_FLOW_001: Member can borrow an available book', () => {
      // First, ensure there's an available book
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      cy.request('/api/book/getAll').then((response) => {
        const availableBook = response.body.find((book: any) => book.isAvailable === true)
        
        if (availableBook) {
          // Logout and login as member
          cy.get('header > div > div.MuiStack-root > button').click()
          cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()

          cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
          cy.visit('/borrowals')

          // Create new borrowal
          cy.contains('button', 'New Borrowal').click()
          
          // Select the available book
          cy.get('[data-testid="book-select"]').click()
          cy.contains(availableBook.name).click()

          cy.get('button[type="submit"]').click()

          // Verify success
          cy.contains(/success/i).should('be.visible')

          // Verify borrowal record is created
          cy.contains(availableBook.name).should('be.visible')
          cy.contains('Borrowed').should('be.visible')

          // Verify book is no longer available
          cy.visit('/books')
          cy.contains(availableBook.name).click()
          cy.contains('Not Available').should('be.visible')

          cy.log('✓ Book borrowing workflow working correctly')
        } else {
          cy.log('No available books for borrowing test')
        }
      })
    })

    it('TC_REG_FLOW_002: Member can view their own borrowal history', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/borrowals')

      // Verify page displays borrowal records
      cy.get('table').should('be.visible')
      
      // Get member ID to verify only their records are shown
      cy.request('/api/user/getAll').then((usersResponse) => {
        const member = usersResponse.body.find((user: any) => 
          user.email === fixtureUserData.member.email
        )

        cy.request('/api/borrowal/getAll').then((borrowalsResponse) => {
          const memberBorrowals = borrowalsResponse.body.filter((borrowal: any) => 
            borrowal.memberId === member._id
          )

          // Verify only member's borrowals are displayed
          cy.get('table tbody tr').should('have.length', memberBorrowals.length)

          if (memberBorrowals.length > 0) {
            // Verify at least one borrowal is visible
            cy.get('table tbody tr').should('have.length.greaterThan', 0)
          }

          cy.log('✓ Member borrowal history viewing working correctly')
        })
      })
    })

    it('TC_REG_FLOW_003: Librarian can update borrowal status (return a book)', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      // Find an active borrowal
      cy.request('/api/borrowal/getAll').then((response) => {
        const activeBorrowal = response.body.find((borrowal: any) => 
          borrowal.status === 'Borrowed'
        )

        if (activeBorrowal) {
          cy.visit('/borrowals')

          // Find and edit the borrowal
          cy.contains('tr', activeBorrowal.bookId).within(() => {
            cy.get('[data-testid="return-button"]').click()
          })

          // Confirm return
          cy.get('[data-testid="confirm-button"]').click()

          // Verify success
          cy.contains(/success|returned/i).should('be.visible')

          // Verify status updated to Returned
          cy.contains('tr', activeBorrowal.bookId).should('contain', 'Returned')

          // Verify book is available again
          cy.request(`/api/book/get/${activeBorrowal.bookId}`).then((bookResponse) => {
            expect(bookResponse.body.isAvailable).to.be.true
          })

          cy.log('✓ Book return workflow working correctly')
        } else {
          cy.log('No active borrowals for return test')
        }
      })
    })

    it('TC_REG_FLOW_004: End-to-end workflow - Create author, book, user, and borrowal', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      const testData = {
        author: {
          name: `E2E Author ${testTimestamp}`,
          biography: 'End-to-end test author'
        },
        book: {
          name: `E2E Book ${testTimestamp}`,
          isbn: `E2E-${testTimestamp}`,
          summary: 'End-to-end test book'
        },
        member: {
          name: `E2E Member ${testTimestamp}`,
          email: `e2e_member_${testTimestamp}@example.com`,
          password: 'TestPassword123!',
          isAdmin: false
        }
      }

      // Create author
      cy.visit('/authors')
      cy.contains('button', 'New Author').click()
      cy.get('input[name="name"]').type(testData.author.name)
      cy.get('textarea[name="biography"]').type(testData.author.biography)
      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')

      // Create book
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      cy.get('input[name="name"]').type(testData.book.name)
      cy.get('input[name="isbn"]').type(testData.book.isbn)
      cy.get('textarea[name="summary"]').type(testData.book.summary)
      
      cy.get('[data-testid="author-select"]').click()
      cy.contains(testData.author.name).click()
      
      cy.get('body').then((body) => {
        if (body.find('[data-testid="genre-select"]').length) {
          cy.get('[data-testid="genre-select"]').click()
          cy.get('li').first().click()
        }
      })

      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')

      // Create member
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(testData.member)
      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')

      // Login as member and borrow book
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()

      cy.autoFillLoginForm({
        email: testData.member.email,
        password: testData.member.password
      })
      cy.get('button[type="submit"]').click()

      cy.visit('/borrowals')
      cy.contains('button', 'New Borrowal').click()
      cy.get('[data-testid="book-select"]').click()
      cy.contains(testData.book.name).click()
      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')

      // Verify the complete workflow
      cy.contains(testData.book.name).should('be.visible')
      cy.contains('Borrowed').should('be.visible')

      cy.log('✓ Complete end-to-end workflow successful')
    })
  })

  // --- Critical Path Validation ---
  describe('Critical Path Validation', () => {
    
    it('TC_REG_CRITICAL_001: Verify all main navigation links work', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      const navigationPaths = [
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/books', name: 'Books' },
        { path: '/authors', name: 'Authors' },
        { path: '/genres', name: 'Genres' },
        { path: '/users', name: 'Users' },
        { path: '/borrowals', name: 'Borrowals' }
      ]

      navigationPaths.forEach(nav => {
        cy.visit(nav.path)
        cy.get('body').should('be.visible')
        cy.url().should('include', nav.path)
        cy.log(`✓ ${nav.name} page accessible`)
      })
    })

    it('TC_REG_CRITICAL_002: Verify API endpoints are responsive', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      const apiEndpoints = [
        '/api/book/getAll',
        '/api/author/getAll',
        '/api/genre/getAll',
        '/api/user/getAll',
        '/api/borrowal/getAll'
      ]

      apiEndpoints.forEach(endpoint => {
        cy.request(endpoint).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.be.an('array')
          cy.log(`✓ ${endpoint} responding correctly`)
        })
      })
    })

    it('TC_REG_CRITICAL_003: Verify form validations are working', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      // Test book form validation
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      cy.get('button[type="submit"]').click()
      
      // Should show validation errors
      cy.get('body').should('contain.text', /required|error/i)
      cy.get('[data-testid="cancel-button"]').click()

      // Test user form validation
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      cy.get('button[type="submit"]').click()
      
      // Should show validation errors
      cy.get('body').should('contain.text', /required|error/i)
      cy.get('[data-testid="cancel-button"]').click()

      cy.log('✓ Form validations working correctly')
    })
  })
}) 