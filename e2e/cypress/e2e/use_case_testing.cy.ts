/**
 * E2E Test Cases for Use Case Testing
 * File: cypress/e2e/use_case_testing.cy.ts
 * 
 * Tests key use cases: Add New Book (UC-002), Borrow a Book (UC-003), View Borrowal History (UC-005)
 * Based on TC_Use_Case_Testing.tex
 */

describe('E2E: Use Case Testing', () => {
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

  // --- UC-002: Add New Book (Librarian) ---
  describe('UC-002: Add New Book (Librarian)', () => {
    
    beforeEach(() => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
    })

    it('TC_UC_BOOK_001: Successful addition of a new book (Main Flow)', () => {
      // Step 1: Navigate to Book Management page
      cy.visit('/books')
      cy.url().should('include', '/books')
      
      // Step 2: Click "New Book" button
      cy.contains('button', 'New Book').click()
      
      // Step 3: Fill in all required fields with valid data
      const newBook = {
        name: `UC Test Book ${testTimestamp}`,
        isbn: `UC-${testTimestamp}`,
        summary: 'A book for use case testing',
        publicationDate: '2024-01-01'
      }

      cy.get('input[name="name"]').type(newBook.name)
      cy.get('input[name="isbn"]').type(newBook.isbn)
      cy.get('textarea[name="summary"]').type(newBook.summary)
      cy.get('input[name="publicationDate"]').type(newBook.publicationDate)
      
      // Step 4: Select valid Author and Genre
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

      // Step 5: Ensure "Is Available" is set to true (should be default)
      cy.get('[data-testid="availability-checkbox"]').should('be.checked')
      
      // Step 6: Submit the form
      cy.get('button[type="submit"]').click()
      
      // Expected Results:
      // - Success message is displayed
      cy.contains(/success|book added|created/i).should('be.visible')
      
      // - Form closes (check if dialog/modal closes)
      cy.get('[data-testid="book-form-dialog"]').should('not.exist')
      
      // - New book appears in the list
      cy.get('table').should('contain', newBook.name)
      cy.get('table').should('contain', newBook.isbn)
    })

    it('TC_UC_BOOK_002: Attempt to add a book with missing required fields (Alternative Flow A1)', () => {
      // Step 1: Navigate to "Add Book" form
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      // Step 2: Fill form but leave required field (Name) blank
      cy.get('input[name="isbn"]').type(`MISSING-NAME-${testTimestamp}`)
      cy.get('textarea[name="summary"]').type('Book without a name')
      
      // Step 3: Submit the form
      cy.get('button[type="submit"]').click()
      
      // Expected Results:
      // - System rejects due to validation error
      cy.contains(/required|name.*required/i).should('be.visible')
      
      // - Form remains open for correction
      cy.get('[data-testid="book-form-dialog"]').should('be.visible')
      
      // - Book is not added to database (verify by checking table)
      cy.get('[data-testid="cancel-button"]').click() // Close form
      cy.get('table').should('not.contain', `MISSING-NAME-${testTimestamp}`)
    })

    it('TC_UC_BOOK_003: Attempt to add a book that fails backend validation (Alternative Flow A2)', () => {
      // Step 1: Navigate to "Add Book" form
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      // Step 2: Use existing book's ISBN to trigger duplicate error
      cy.get('tbody tr').first().within(() => {
        cy.get('td').eq(1).invoke('text').then((existingISBN) => {
          // Fill form with duplicate ISBN
          cy.get('input[name="name"]').type(`Duplicate ISBN Book ${testTimestamp}`)
          cy.get('input[name="isbn"]').type(existingISBN.trim())
          cy.get('textarea[name="summary"]').type('Book with duplicate ISBN')
          
          // Step 3: Submit the form
          cy.get('button[type="submit"]').click()
          
          // Expected Results:
          // - Generic error message from API
          cy.contains(/error|already exists|duplicate|something went wrong/i).should('be.visible')
          
          // - Book is not added to database
          cy.get('[data-testid="cancel-button"]').click() // Close form if still open
          cy.get('table').should('not.contain', `Duplicate ISBN Book ${testTimestamp}`)
        })
      })
    })
  })

  // --- UC-003: Borrow a Book (Member) ---
  describe('UC-003: Borrow a Book (Member)', () => {
    
    beforeEach(() => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
    })

    it('TC_UC_BORROW_001: Successful borrowing of an available book (Main Flow)', () => {
      // Step 1: Navigate to Borrowal Management page
      cy.visit('/borrowals')
      cy.url().should('include', '/borrowals')
      
      // Step 2: Click "New Borrowal" button
      cy.contains('button', 'New Borrowal').click()
      
      // Step 3: Select a book marked as available
      cy.get('[data-testid="available-books"]').should('be.visible')
      cy.get('[data-testid="book-option"]').first().click()
      
      // Step 4: Verify Member field is auto-populated
      cy.get('[data-testid="member-field"]').should('contain', fixtureUserData.member.email)
      
      // Step 5: Submit the form
      cy.get('button[type="submit"]').click()
      
      // Expected Results:
      // - New borrowal record created with "Borrowed" status
      cy.contains(/success|borrowed|borrowal created/i).should('be.visible')
      
      // - Success message displayed
      cy.get('table').should('contain', 'Borrowed')
      
      // - Member's borrowal list updated
      cy.get('tbody tr').first().should('contain', 'Borrowed')
      
      // - Book availability updated (verify by going to books page)
      cy.visit('/books')
      cy.get('tbody tr').first().within(() => {
        cy.get('[data-testid="availability-status"]').should('contain', 'Unavailable')
      })
    })

    it('TC_UC_BORROW_002: Attempt to borrow an unavailable book (Alternative Flow A1)', () => {
      // Step 1: Navigate to "Add Borrowal" form
      cy.visit('/borrowals')
      cy.contains('button', 'New Borrowal').click()
      
      // Step 2: Attempt to select unavailable book
      cy.get('body').then((body) => {
        if (body.find('[data-testid="unavailable-book"]').length > 0) {
          cy.get('[data-testid="unavailable-book"]').first().click()
          cy.get('button[type="submit"]').click()
          
          // Expected Results:
          // - Error message displayed
          cy.contains(/not available|unavailable|error/i).should('be.visible')
          
          // - No borrowal record created
          cy.get('[data-testid="cancel-button"]').click() // Close form
          cy.get('table tbody tr').should('not.contain', 'Borrowed') // Check last entry
        } else {
          // If no unavailable books, UI should prevent selection
          cy.get('[data-testid="book-select"]').should('not.contain', 'Unavailable')
          cy.log('No unavailable books - UI correctly prevents selection')
        }
      })
    })

    it('TC_UC_BORROW_003: Verify correct data population in borrowal form', () => {
      // Step 1: Open "Add Borrowal" form
      cy.visit('/borrowals')
      cy.contains('button', 'New Borrowal').click()
      
      // Step 2: Observe the date fields
      // Expected Results:
      
      // - Member field auto-populated with current user's ID
      cy.get('[data-testid="member-field"]').should('contain', fixtureUserData.member.email)
      
      // - Borrowed Date auto-populated to current date
      const today = new Date().toISOString().split('T')[0]
      cy.get('[data-testid="borrow-date"]').should('have.value', today)
      
      // - Due Date auto-populated to future date (14 days)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 14)
      const expectedDueDate = futureDate.toISOString().split('T')[0]
      cy.get('[data-testid="due-date"]').should('have.value', expectedDueDate)
      
      // - Initial status correctly set to "Borrowed"
      cy.get('[data-testid="status-field"]').should('contain', 'Borrowed')
    })
  })

  // --- UC-005: View Borrowal History (Member) ---
  describe('UC-005: View Borrowal History (Member)', () => {
    
    it('TC_UC_HISTORY_001: View non-empty borrowal history (Main Flow)', () => {
      // Prerequisite: Member has borrowal records
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      
      // Create a borrowal first if none exist
      cy.visit('/borrowals')
      cy.get('table tbody tr').then(($rows) => {
        if ($rows.length === 0) {
          // Create a borrowal
          cy.contains('button', 'New Borrowal').click()
          cy.get('[data-testid="book-option"]').first().click()
          cy.get('button[type="submit"]').click()
        }
      })
      
      // Step 1: Navigate to Borrowal Management page
      cy.visit('/borrowals')
      cy.url().should('include', '/borrowals')
      
      // Expected Results:
      // - List/table showing only records for logged-in member
      cy.get('table').should('be.visible')
      cy.get('tbody tr').should('have.length.greaterThan', 0)
      
      // - Verify all displayed records belong to current member
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).should('contain', fixtureUserData.member.email)
      })
      
      // - Accurate data displayed (Book Name, Borrowed Date, Due Date, Status)
      cy.get('thead tr').should('contain', 'Book')
      cy.get('thead tr').should('contain', 'Borrowed Date')
      cy.get('thead tr').should('contain', 'Due Date')
      cy.get('thead tr').should('contain', 'Status')
    })

    it('TC_UC_HISTORY_002: View empty borrowal history (Alternative Flow A1)', () => {
      // Use a member with no borrowal records (create new member)
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      
      const newMember = {
        name: `Test Member No History ${testTimestamp}`,
        email: `no_history_${testTimestamp}@example.com`,
        password: 'TestPassword123!',
        isAdmin: false
      }

      cy.fillRegistrationForm(newMember)
      cy.get('button[type="submit"]').click()
      
      // Login as the new member
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()
      
      cy.autoFillLoginForm({
        email: newMember.email,
        password: newMember.password
      })
      cy.get('button[type="submit"]').click()
      
      // Step 1: Navigate to Borrowal Management page
      cy.visit('/borrowals')
      
      // Expected Results:
      // - Message indicating no borrowal history
      cy.contains(/no borrowals|no history|empty/i).should('be.visible')
    })

    it('TC_UC_HISTORY_003: Verify role-based view of borrowal history', () => {
      // Prerequisite: Multiple members with borrowals
      
      // Step 1: Login as Librarian and view all borrowals
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      
      // Count total borrowals visible to librarian
      cy.get('tbody tr').then(($librarianRows) => {
        const librarianCount = $librarianRows.length
        
        // Step 2: Logout and login as Member
        cy.get('header > div > div.MuiStack-root > button').click()
        cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()
        
        cy.autoFillLoginForm({
          email: fixtureUserData.member.email,
          password: fixtureUserData.member.password
        })
        cy.get('button[type="submit"]').click()
        
        cy.visit('/borrowals')
        
        // Count borrowals visible to member
        cy.get('tbody tr').then(($memberRows) => {
          const memberCount = $memberRows.length
          
          // Expected Results:
          // - Librarian sees all records (more than or equal to member's records)
          expect(librarianCount).to.be.at.least(memberCount)
          
          // - Member sees only their own records
          cy.get('tbody tr').each(($row) => {
            cy.wrap($row).should('contain', fixtureUserData.member.email)
          })
        })
      })
    })
  })

  // --- Integrated Use Case Scenarios ---
  describe('Integrated Use Case Scenarios', () => {
    
    it('TC_UC_INTEGRATED_001: Complete book lifecycle - Add, Borrow, Return', () => {
      // UC-002: Librarian adds new book
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      const testBook = {
        name: `Integrated Test Book ${testTimestamp}`,
        isbn: `INT-${testTimestamp}`,
        summary: 'Book for integrated testing'
      }

      cy.get('input[name="name"]').type(testBook.name)
      cy.get('input[name="isbn"]').type(testBook.isbn)
      cy.get('textarea[name="summary"]').type(testBook.summary)
      
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
      cy.contains(/success/i).should('be.visible')
      
      // UC-003: Member borrows the book
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/borrowals')
      cy.contains('button', 'New Borrowal').click()
      
      // Select the newly created book
      cy.contains(testBook.name).click()
      cy.get('button[type="submit"]').click()
      cy.contains(/success/i).should('be.visible')
      
      // UC-005: Verify in borrowal history
      cy.visit('/borrowals')
      cy.get('table').should('contain', testBook.name)
      cy.get('table').should('contain', 'Borrowed')
      
      // Librarian returns the book
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/borrowals')
      cy.contains(testBook.name).parent('tr').within(() => {
        cy.get('[data-testid="mark-returned"]').click()
      })
      
      // Verify book is available again
      cy.visit('/books')
      cy.contains(testBook.name).parent('tr').within(() => {
        cy.get('[data-testid="availability-status"]').should('contain', 'Available')
      })
    })

    it('TC_UC_INTEGRATED_002: Member workflow - Browse, Borrow, View History', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      
      // Browse books
      cy.visit('/books')
      cy.get('table').should('be.visible')
      
      let selectedBook: string
      cy.get('tbody tr').first().within(() => {
        cy.get('td').first().invoke('text').then((text) => {
          selectedBook = text.trim()
        })
      })
      
      // Borrow a book
      cy.visit('/borrowals')
      cy.contains('button', 'New Borrowal').click()
      cy.get('[data-testid="book-option"]').first().click()
      cy.get('button[type="submit"]').click()
      
      // View updated history
      cy.visit('/borrowals')
      cy.get('table').should('contain', 'Borrowed')
      
      // Verify only member's own records are visible
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).should('contain', fixtureUserData.member.email)
      })
    })
  })
}) 