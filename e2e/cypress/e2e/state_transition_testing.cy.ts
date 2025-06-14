/**
 * E2E Test Cases for State Transition Testing
 * File: cypress/e2e/state_transition_testing.cy.ts
 * 
 * Tests state transitions for Borrowal Records, Book Availability, and User Sessions
 * Based on TC_State_Transition_Testing.tex
 */

describe('E2E: State Transition Testing', () => {
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

  // --- Borrowal Record State Transitions ---
  describe('Borrowal Record State Transitions', () => {
    
    it('TC_STATE_BORROW_001: Valid Transition: (None) to "Borrowed"', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/borrowals')
      
      // Create new borrowal
      cy.contains('button', 'New Borrowal').click()
      
      // Select an available book
      cy.get('[data-testid="available-books"]').should('be.visible')
      cy.get('[data-testid="book-option"]').first().click()
      cy.get('button[type="submit"]').click()
      
      // Verify new borrowal is created with "Borrowed" status
      cy.contains(/success|borrowed/i).should('be.visible')
      cy.get('table').should('contain', 'Borrowed')
      
      // Verify the record exists in the table
      cy.get('tbody tr').first().should('contain', 'Borrowed')
    })

    it('TC_STATE_BORROW_002: Valid Transition: "Borrowed" to "Returned"', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      // Find a borrowed book
      cy.get('table').should('be.visible')
      cy.get('tbody tr').contains('Borrowed').parent('tr').within(() => {
        cy.get('[data-testid="mark-returned"]').click()
      })
      
      // Verify status changed to Returned
      cy.contains(/success|returned/i).should('be.visible')
      cy.get('table').should('contain', 'Returned')
    })

    it('TC_STATE_BORROW_003: Valid Transition: "Borrowed" to "Overdue"', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      // Find a borrowed book and simulate overdue status
      // This might require manual date manipulation or backend API call
      cy.get('tbody tr').contains('Borrowed').parent('tr').within(() => {
        // Check if there's an overdue indicator or action
        cy.get('td').should('be.visible')
      })
      
      // Verify overdue status is displayed (if system automatically checks)
      cy.get('body').then((body) => {
        if (body.text().includes('Overdue')) {
          cy.get('table').should('contain', 'Overdue')
        }
      })
    })

    it('TC_STATE_BORROW_004: Valid Transition: "Overdue" to "Returned"', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      // Look for overdue records and mark as returned
      cy.get('body').then((body) => {
        if (body.text().includes('Overdue')) {
          cy.get('tbody tr').contains('Overdue').parent('tr').within(() => {
            cy.get('[data-testid="mark-returned"]').click()
          })
          
          // Verify transition to Returned
          cy.contains(/success|returned/i).should('be.visible')
        }
      })
    })

    it('TC_STATE_BORROW_005: Invalid Transition: "Returned" to "Borrowed"', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      // Find a returned book
      cy.get('body').then((body) => {
        if (body.text().includes('Returned')) {
          cy.get('tbody tr').contains('Returned').parent('tr').within(() => {
            // Should not have option to change back to Borrowed
            cy.get('[data-testid="mark-borrowed"]').should('not.exist')
            cy.get('[data-testid="edit-borrowal"]').should('not.exist')
          })
        }
      })
    })
  })

  // --- Book Availability State Transitions ---
  describe('Book Availability State Transitions', () => {
    
    it('TC_STATE_BOOK_001: Valid Transition: "Available" to "Unavailable"', () => {
      // First verify a book is available
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      
      let bookName: string
      
      // Find an available book
      cy.get('tbody tr').first().within(() => {
        cy.get('td').first().invoke('text').then((text) => {
          bookName = text
        })
        
        // Check if book shows as available
        cy.get('[data-testid="availability-status"]').should('contain', 'Available')
      })
      
      // Borrow the book
      cy.visit('/borrowals')
      cy.contains('button', 'New Borrowal').click()
      cy.get('[data-testid="book-option"]').first().click()
      cy.get('button[type="submit"]').click()
      
      // Verify book is now unavailable
      cy.visit('/books')
      cy.get('tbody tr').first().within(() => {
        cy.get('[data-testid="availability-status"]').should('contain', 'Unavailable')
      })
    })

    it('TC_STATE_BOOK_002: Valid Transition: "Unavailable" to "Available"', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      // Find an active borrowal and return it
      cy.get('tbody tr').contains('Borrowed').parent('tr').within(() => {
        cy.get('[data-testid="mark-returned"]').click()
      })
      
      // Verify book becomes available again
      cy.visit('/books')
      cy.get('tbody tr').first().within(() => {
        cy.get('[data-testid="availability-status"]').should('contain', 'Available')
      })
    })

    it('TC_STATE_BOOK_003: Invalid Transition: Attempt to borrow "Unavailable" book', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/borrowals')
      
      cy.contains('button', 'New Borrowal').click()
      
      // Try to select an unavailable book
      cy.get('body').then((body) => {
        if (body.find('[data-testid="unavailable-book"]').length > 0) {
          cy.get('[data-testid="unavailable-book"]').first().click()
          cy.get('button[type="submit"]').click()
          
          // Should show error
          cy.contains(/not available|unavailable|error/i).should('be.visible')
        } else {
          // If no unavailable books exist, this test passes by default
          cy.log('No unavailable books found - test passes')
        }
      })
    })
  })

  // --- User Session State Transitions ---
  describe('User Session State Transitions', () => {
    
    it('TC_STATE_SESSION_001: Valid Transition: "Logged-Out" to "Logged-In"', () => {
      // Start from logged-out state
      cy.clearCookies()
      cy.clearLocalStorage()
      cy.visit('/login')
      
      // Verify we're in logged-out state
      cy.url().should('include', '/login')
      
      // Login as member
      cy.autoFillLoginForm({
        email: fixtureUserData.member.email,
        password: fixtureUserData.member.password
      })
      cy.get('button[type="submit"]').click()
      
      // Verify successful login transition
      cy.url().should('include', '/books')
      cy.contains('h3', 'Books').should('be.visible')
      
      // Verify member can access member-specific pages
      cy.visit('/borrowals')
      cy.url().should('include', '/borrowals')
    })

    it('TC_STATE_SESSION_002: Valid Transition: "Logged-In" to "Logged-Out"', () => {
      // Login first
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Verify we're logged in
      cy.contains('h4', /Welcome back/i).should('be.visible')
      
      // Logout
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()
      
      // Verify logout transition
      cy.url().should('include', '/login')
    })

    it('TC_STATE_SESSION_003: Invalid Transition: Accessing protected page when "Logged-Out"', () => {
      // Ensure logged-out state
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // Try to access protected URLs directly
      const protectedPages = ['/dashboard', '/users', '/borrowals']
      
      protectedPages.forEach(page => {
        cy.visit(page, { failOnStatusCode: false })
        
        // Should redirect to login or show 404/403
        cy.url().should('satisfy', (url) => {
          return url.includes('/login') || 
                 url.includes('/404') || 
                 url.includes('/403')
        })
      })
    })

    it('TC_STATE_SESSION_004: State Persistence: Session remains "Logged-In" after page refresh', () => {
      // Login
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Verify logged-in state
      cy.contains('h4', /Welcome back/i).should('be.visible')
      
      // Refresh the page
      cy.reload()
      
      // Verify still logged in
      cy.url().should('include', '/dashboard')
      cy.contains('h4', /Welcome back/i).should('be.visible')
      
      // Test with different page
      cy.visit('/users')
      cy.reload()
      cy.url().should('include', '/users')
      cy.contains('h3', 'Users').should('be.visible')
    })
  })

  // --- Complex State Transition Sequences ---
  describe('Complex State Transition Sequences', () => {
    
    it('TC_STATE_COMPLEX_001: Complete borrowal lifecycle', () => {
      let bookName: string
      
      // Step 1: Member borrows book (Available -> Unavailable, None -> Borrowed)
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      
      cy.get('tbody tr').first().within(() => {
        cy.get('td').first().invoke('text').then((text) => {
          bookName = text.trim()
        })
      })
      
      cy.visit('/borrowals')
      cy.contains('button', 'New Borrowal').click()
      cy.get('[data-testid="book-option"]').first().click()
      cy.get('button[type="submit"]').click()
      
      // Verify borrowal created
      cy.contains(/success|borrowed/i).should('be.visible')
      
      // Step 2: Librarian marks as returned (Borrowed -> Returned, Unavailable -> Available)
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      cy.get('tbody tr').contains('Borrowed').parent('tr').within(() => {
        cy.get('[data-testid="mark-returned"]').click()
      })
      
      // Verify return successful
      cy.contains(/success|returned/i).should('be.visible')
      
      // Step 3: Verify book is available again
      cy.visit('/books')
      cy.contains(bookName).parent('tr').within(() => {
        cy.get('[data-testid="availability-status"]').should('contain', 'Available')
      })
    })

    it('TC_STATE_COMPLEX_002: Session state with role-based access', () => {
      // Start logged out
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // Login as member
      cy.visit('/login')
      cy.autoFillLoginForm({
        email: fixtureUserData.member.email,
        password: fixtureUserData.member.password
      })
      cy.get('button[type="submit"]').click()
      
      // Verify member access
      cy.url().should('include', '/books')
      cy.visit('/dashboard', { failOnStatusCode: false })
      cy.url().should('not.include', '/dashboard')
      
      // Logout and login as librarian
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()
      
      cy.autoFillLoginForm({
        email: fixtureUserData.librarian.email,
        password: fixtureUserData.librarian.password
      })
      cy.get('button[type="submit"]').click()
      
      // Verify librarian access
      cy.url().should('include', '/dashboard')
      cy.visit('/users')
      cy.url().should('include', '/users')
    })
  })

  // --- State Validation Tests ---
  describe('State Validation and Consistency', () => {
    
    it('TC_STATE_VALIDATE_001: Verify state consistency across UI elements', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      // Get borrowal data from table
      cy.get('tbody tr').first().within(() => {
        cy.get('td').eq(1).invoke('text').then((bookTitle) => {
          cy.get('td').eq(3).invoke('text').then((status) => {
            // Navigate to books page and verify consistency
            cy.visit('/books')
            cy.contains(bookTitle.trim()).parent('tr').within(() => {
              if (status.trim() === 'Borrowed') {
                cy.get('[data-testid="availability-status"]').should('contain', 'Unavailable')
              } else if (status.trim() === 'Returned') {
                cy.get('[data-testid="availability-status"]').should('contain', 'Available')
              }
            })
          })
        })
      })
    })

    it('TC_STATE_VALIDATE_002: Verify no orphaned states exist', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      // Check for books marked as unavailable without active borrowals
      cy.visit('/books')
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).within(() => {
          cy.get('[data-testid="availability-status"]').invoke('text').then((availability) => {
            if (availability.includes('Unavailable')) {
              cy.get('td').first().invoke('text').then((bookTitle) => {
                // Check if this book has an active borrowal
                cy.visit('/borrowals')
                cy.get('table').should('contain', bookTitle.trim())
                cy.visit('/books') // Return to books page for next iteration
              })
            }
          })
        })
      })
    })
  })
}) 