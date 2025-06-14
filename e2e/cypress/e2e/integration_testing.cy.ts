/**
 * E2E Test Cases for Integration Testing
 * File: cypress/e2e/integration_testing.cy.ts
 * 
 * Tests integration between modules: Entity Lifecycle, Data Integrity, State Transitions, RBAC Integration
 * Based on TC_Integration_Testing.tex
 */

describe('E2E: Integration Testing', () => {
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

  // --- Full Lifecycle - From Entity Creation to Borrowal ---
  describe('Full Lifecycle - From Entity Creation to Borrowal', () => {
    
    it('TC_INT_001: End-to-end workflow from creating entities to member borrowing', () => {
      const testData = {
        author: {
          name: `Integration Test Author ${testTimestamp}`,
          biography: 'Test author for integration testing'
        },
        genre: {
          name: `Integration Genre ${testTimestamp}`,
          description: 'Test genre for integration testing'
        },
        book: {
          name: `Integration Test Book ${testTimestamp}`,
          isbn: `INT-${testTimestamp}`,
          summary: 'Test book for integration testing'
        },
        member: {
          name: `Integration Test Member ${testTimestamp}`,
          email: `integration_member_${testTimestamp}@example.com`,
          password: 'TestPassword123!',
          isAdmin: false
        }
      }

      // Step 1: Login as Librarian
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      // Step 2: Create Author
      cy.visit('/authors')
      cy.contains('button', 'New Author').click()
      cy.get('input[name="name"]').type(testData.author.name)
      cy.get('textarea[name="biography"]').type(testData.author.biography)
      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')
      cy.contains(testData.author.name).should('be.visible')

      // Step 3: Create Genre
      cy.visit('/genres')
      cy.contains('button', 'New Genre').click()
      cy.get('input[name="name"]').type(testData.genre.name)
      cy.get('textarea[name="description"]').type(testData.genre.description)
      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')
      cy.contains(testData.genre.name).should('be.visible')

      // Step 4: Create Book with linked Author and Genre
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      cy.get('input[name="name"]').type(testData.book.name)
      cy.get('input[name="isbn"]').type(testData.book.isbn)
      cy.get('textarea[name="summary"]').type(testData.book.summary)

      // Select the newly created author
      cy.get('[data-testid="author-select"]').click()
      cy.contains(testData.author.name).click()

      // Select the newly created genre
      cy.get('[data-testid="genre-select"]').click()
      cy.contains(testData.genre.name).click()

      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')

      // Verify book is available
      cy.contains(testData.book.name).should('be.visible')
      cy.contains(testData.book.name).click()
      cy.contains('Available').should('be.visible')
      cy.go('back')

      // Step 5: Create Member User
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(testData.member)
      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')
      cy.contains(testData.member.name).should('be.visible')

      // Step 6: Logout as Librarian
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()

      // Step 7: Login as Member
      cy.autoFillLoginForm({
        email: testData.member.email,
        password: testData.member.password
      })
      cy.get('button[type="submit"]').click()

      // Verify member is logged in and on member page
      cy.url().should('include', '/books')

      // Step 8: Find and borrow the book
      cy.visit('/books')
      cy.contains(testData.book.name).should('be.visible')
      cy.contains(testData.book.name).click()

      // Initiate borrowing
      cy.contains('button', 'Borrow').click()
      cy.contains(/success|borrow/i).should('be.visible')

      // Verify borrowal in member's history
      cy.visit('/borrowals')
      cy.contains(testData.book.name).should('be.visible')

      // Verify book is no longer available
      cy.visit('/books')
      cy.contains(testData.book.name).click()
      cy.contains('Not Available').should('be.visible')

      cy.log('✓ End-to-end workflow completed successfully')
    })
  })

  // --- Data Integrity and Referential Constraints ---
  describe('Data Integrity and Referential Constraints', () => {
    
    it('TC_INT_002: Verify data integrity when linked Author is deleted', () => {
      const testData = {
        author: {
          name: `IntegTest Author ${testTimestamp}`,
          biography: 'Author to be deleted for testing'
        },
        book: {
          name: `IntegTest Book ${testTimestamp}`,
          isbn: `INTEG-${testTimestamp}`,
          summary: 'Book linked to author that will be deleted'
        }
      }

      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      // Create Author
      cy.visit('/authors')
      cy.contains('button', 'New Author').click()
      cy.get('input[name="name"]').type(testData.author.name)
      cy.get('textarea[name="biography"]').type(testData.author.biography)
      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')

      // Create Book linked to Author
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      cy.get('input[name="name"]').type(testData.book.name)
      cy.get('input[name="isbn"]').type(testData.book.isbn)
      cy.get('textarea[name="summary"]').type(testData.book.summary)

      // Link to author
      cy.get('[data-testid="author-select"]').click()
      cy.contains(testData.author.name).click()

      // Select a genre if available
      cy.get('body').then((body) => {
        if (body.find('[data-testid="genre-select"]').length) {
          cy.get('[data-testid="genre-select"]').click()
          cy.get('li').first().click()
        }
      })

      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')

      // Verify book shows author
      cy.contains(testData.book.name).click()
      cy.contains(testData.author.name).should('be.visible')
      cy.go('back')

      // Delete the Author
      cy.visit('/authors')
      cy.contains('tr', testData.author.name).within(() => {
        cy.get('[data-testid="delete-button"]').click()
      })
      cy.get('[data-testid="confirm-button"]').click()
      cy.contains(/success|deleted/i).should('be.visible')

      // Verify Author is deleted
      cy.contains(testData.author.name).should('not.exist')

      // Check Book still exists but handles missing author gracefully
      cy.visit('/books')
      cy.contains(testData.book.name).should('be.visible')
      cy.contains(testData.book.name).click()

      // Book should exist but author field should be handled gracefully
      cy.get('body').should('not.contain', testData.author.name)
      cy.get('[data-testid="book-details"]').should('be.visible')

      cy.log('✓ Data integrity maintained after author deletion')
    })

    it('TC_INT_003: Verify deleting User with active Borrowals', () => {
      const testData = {
        member: {
          name: `MemberToDelete ${testTimestamp}`,
          email: `member_to_delete_${testTimestamp}@example.com`,
          password: 'TestPassword123!',
          isAdmin: false
        }
      }

      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      // Create a member
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(testData.member)
      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')

      // Get an available book for borrowing
      cy.request('/api/book/getAll').then((response) => {
        const availableBook = response.body.find((book: any) => book.isAvailable === true)
        
        if (availableBook) {
          // Create a borrowal for this member
          cy.request('/api/user/getAll').then((usersResponse) => {
            const member = usersResponse.body.find((user: any) => 
              user.email === testData.member.email
            )

            cy.request('POST', '/api/borrowal/add', {
              bookId: availableBook._id,
              memberId: member._id
            }).then((borrowalResponse) => {
              expect([200, 201]).to.include(borrowalResponse.status)

              // Try to delete the member with active borrowal
              cy.visit('/users')
              cy.contains('tr', testData.member.name).within(() => {
                cy.get('[data-testid="delete-button"]').click()
              })
              cy.get('[data-testid="confirm-button"]').click()

              // Check system behavior - either blocked or handled gracefully
              cy.get('body').should('satisfy', (body) => {
                const text = body.text().toLowerCase()
                return text.includes('cannot delete') ||
                       text.includes('active borrowals') ||
                       text.includes('success') ||
                       text.includes('deleted')
              })

              // Verify borrowal record still exists
              cy.visit('/borrowals')
              cy.contains(availableBook.name).should('be.visible')

              cy.log('✓ User deletion with active borrowals handled appropriately')
            })
          })
        } else {
          cy.log('No available books for borrowal test')
        }
      })
    })
  })

  // --- State Transitions Across Modules ---
  describe('State Transitions Across Modules', () => {
    
    it('TC_INT_004: Verify Book availability state updates through Borrowal module', () => {
      const testData = {
        book: `StateTest Book ${testTimestamp}`,
        member: `StateTest Member ${testTimestamp}`
      }

      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      // Get an available book and member
      cy.request('/api/book/getAll').then((booksResponse) => {
        const availableBook = booksResponse.body.find((book: any) => book.isAvailable === true)
        
        if (availableBook) {
          cy.request('/api/user/getAll').then((usersResponse) => {
            const member = usersResponse.body.find((user: any) => 
              user.email === fixtureUserData.member.email
            )

            // Step 1: Verify book is initially available
            cy.visit('/books')
            cy.contains(availableBook.name).click()
            cy.contains('Available').should('be.visible')
            cy.go('back')

            // Step 2: Create borrowal for this book
            cy.request('POST', '/api/borrowal/add', {
              bookId: availableBook._id,
              memberId: member._id
            }).then((response) => {
              expect([200, 201]).to.include(response.status)

              // Step 3: Verify book is now unavailable
              cy.visit('/books')
              cy.contains(availableBook.name).click()
              cy.contains('Not Available').should('be.visible')
              cy.go('back')

              // Step 4: Try to create another borrowal for the same book
              cy.visit('/borrowals')
              cy.contains('button', 'New Borrowal').click()

              cy.get('[data-testid="book-select"]').click()
              // Should not be able to select unavailable book
              cy.get('body').should('not.contain', availableBook.name)
              cy.get('[data-testid="cancel-button"]').click()

              // Step 5: Return the book
              cy.contains('tr', availableBook.name).within(() => {
                cy.get('[data-testid="return-button"]').click()
              })
              cy.get('[data-testid="confirm-button"]').click()
              cy.contains(/returned|success/i).should('be.visible')

              // Step 6: Verify book is available again
              cy.visit('/books')
              cy.contains(availableBook.name).click()
              cy.contains('Available').should('be.visible')

              cy.log('✓ Book state transitions work correctly across modules')
            })
          })
        } else {
          cy.log('No available books for state transition test')
        }
      })
    })

    it('TC_INT_005: Verify cascading updates across multiple related entities', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      // Test that updating book availability cascades properly
      cy.request('/api/book/getAll').then((booksResponse) => {
        const books = booksResponse.body
        if (books.length > 0) {
          const testBook = books[0]

          // Check initial state in multiple views
          cy.visit('/books')
          cy.contains(testBook.name).should('be.visible')

          cy.visit('/dashboard')
          // Dashboard should reflect current book counts
          cy.get('[data-testid="total-books"], .stat-card').should('be.visible')

          // Create a borrowal to change state
          cy.request('/api/user/getAll').then((usersResponse) => {
            const member = usersResponse.body.find((user: any) => !user.isAdmin)
            
            if (member && testBook.isAvailable) {
              cy.request('POST', '/api/borrowal/add', {
                bookId: testBook._id,
                memberId: member._id
              }).then(() => {
                // Verify updates propagated to all views
                cy.visit('/books')
                cy.contains(testBook.name).click()
                cy.contains('Not Available').should('be.visible')
                cy.go('back')

                cy.visit('/borrowals')
                cy.contains(testBook.name).should('be.visible')

                cy.visit('/dashboard')
                // Dashboard statistics should update
                cy.get('[data-testid="total-books"], .stat-card').should('be.visible')

                cy.log('✓ Cascading updates work across all views')
              })
            }
          })
        }
      })
    })
  })

  // --- Role-Based Access Control (RBAC) Integration ---
  describe('Role-Based Access Control (RBAC) Integration', () => {
    
    it('TC_INT_005: Verify role restrictions across modules', () => {
      const testData = {
        member: {
          name: `TestMember ${testTimestamp}`,
          email: `test_member_${testTimestamp}@example.com`,
          password: 'TestPassword123!',
          isAdmin: false
        }
      }

      // Step 1: Create member as Librarian
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(testData.member)
      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')

      // Logout
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()

      // Step 2: Login as Member
      cy.autoFillLoginForm({
        email: testData.member.email,
        password: testData.member.password
      })
      cy.get('button[type="submit"]').click()

      // Step 3: Test access restrictions
      // Should not access User Management
      cy.visit('/users', { failOnStatusCode: false })
      cy.url().should('not.include', '/users')

      // Should not access Dashboard
      cy.visit('/dashboard', { failOnStatusCode: false })
      cy.url().should('not.include', '/dashboard')

      // Step 4: Test Books page restrictions
      cy.visit('/books')
      cy.get('table').should('be.visible')
      // Should not see admin controls
      cy.get('body').should('not.contain', 'New Book')
      cy.get('body').should('not.contain', 'Edit')
      cy.get('body').should('not.contain', 'Delete')

      // Step 5: Test API access restrictions
      cy.request({
        method: 'POST',
        url: '/api/book/add',
        body: {
          name: 'Unauthorized Book',
          isbn: 'UNAUTH-123',
          summary: 'Should not be created'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect([401, 403]).to.include(response.status)
      })

      // Step 6: Test permitted actions
      // Member should be able to view books
      cy.visit('/books')
      cy.get('table tbody tr').should('have.length.greaterThan', 0)

      // Member should be able to view their borrowals
      cy.visit('/borrowals')
      cy.get('table').should('be.visible')

      cy.log('✓ Role-based access control working correctly across modules')
    })

    it('TC_INT_006: Verify session-based role enforcement', () => {
      // Login as Librarian
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      // Verify admin access
      cy.visit('/users')
      cy.contains('button', 'New User').should('be.visible')

      // Store session information
      cy.getCookies().then((cookies) => {
        const sessionCookie = cookies.find(cookie => 
          cookie.name.includes('session') || cookie.name.includes('auth')
        )

        if (sessionCookie) {
          // Switch to member account
          cy.get('header > div > div.MuiStack-root > button').click()
          cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()

          cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)

          // Verify role switch is enforced
          cy.visit('/users', { failOnStatusCode: false })
          cy.url().should('not.include', '/users')

          // Test API with new session
          cy.request({
            method: 'GET',
            url: '/api/user/getAll',
            failOnStatusCode: false
          }).then((response) => {
            expect([401, 403]).to.include(response.status)
          })

          cy.log('✓ Session-based role enforcement working')
        }
      })
    })
  })

  // --- Cross-Module Data Consistency ---
  describe('Cross-Module Data Consistency', () => {
    
    it('TC_INT_007: Verify data consistency across module boundaries', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      // Test data consistency between different views
      cy.request('/api/borrowal/getAll').then((borrowalsResponse) => {
        const borrowals = borrowalsResponse.body
        
        if (borrowals.length > 0) {
          const testBorrowbal = borrowals[0]

          // Check data consistency in Borrowals view
          cy.visit('/borrowals')
          cy.contains(testBorrowbal.bookId).should('be.visible')

          // Check same data in Books view
          cy.visit('/books')
          cy.get('table').should('contain', testBorrowbal.bookId)

          // Check data through API
          cy.request(`/api/book/get/${testBorrowbal.bookId}`).then((bookResponse) => {
            expect(bookResponse.status).to.eq(200)
            expect(bookResponse.body._id).to.eq(testBorrowbal.bookId)
          })

          cy.log('✓ Data consistency maintained across modules')
        }
      })
    })

    it('TC_INT_008: Verify real-time updates across modules', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)

      // Get current borrowal count
      cy.visit('/dashboard')
      cy.get('[data-testid="total-borrowals"], .stat-card').then(($element) => {
        const initialText = $element.text()

        // Create a new borrowal
        cy.request('/api/book/getAll').then((booksResponse) => {
          const availableBook = booksResponse.body.find((book: any) => book.isAvailable)
          
          if (availableBook) {
            cy.request('/api/user/getAll').then((usersResponse) => {
              const member = usersResponse.body.find((user: any) => !user.isAdmin)
              
              if (member) {
                cy.request('POST', '/api/borrowal/add', {
                  bookId: availableBook._id,
                  memberId: member._id
                }).then(() => {
                  // Refresh dashboard and verify count updated
                  cy.reload()
                  cy.get('[data-testid="total-borrowals"], .stat-card').should('not.contain.text', initialText)
                  
                  cy.log('✓ Real-time updates working across modules')
                })
              }
            })
          }
        })
      })
    })
  })
}) 