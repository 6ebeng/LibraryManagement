/**
 * E2E Test Cases for Regression Testing
 * File: cypress/e2e/regression_testing.cy.ts
 * * Tests core functionality to ensure no regressions: Authentication, CRUD Operations, User Workflows
 * Based on TC_Regression_Testing
 */
describe('E2E: Regression Testing', () => {
  const testTimestamp = Date.now()
  let fixtureUserData: any

  before(function () {
    cy.fixture('user-data.json')
      .as('userData')
      .then((data) => {
        fixtureUserData = data
      })
  })

  beforeEach(function () {
    cy.clearUserSession()
    cy.intercept('POST', '/api/books/add').as('createBook')
    cy.intercept('PUT', '/api/books/update/*').as('updateBook')
    cy.intercept('POST', '/api/users/add').as('createUser')
    cy.intercept('POST', '/api/borrowals/add').as('createBorrowal')
    cy.intercept('PUT', '/api/borrowals/update/*').as('updateBorrowal')
    cy.intercept('POST', '/api/reviews/add').as('createReview')
    cy.intercept('DELETE', '/api/reviews/delete/*').as('deleteReview')
    cy.intercept('GET', '/api/reviews/getAll').as('getReviews')
    cy.intercept('GET', '/api/books/getAll').as('getBooks')
  })

  // --- Authentication & Core Access (Smoke Tests) ---
  describe('Authentication & Core Access (Smoke Tests)', () => {
    it('TC_REG_AUTH_001: Successful login with valid Librarian credentials', function () {
      cy.visit('/login')
      cy.autoFillLoginForm({
        email: this.userData.librarian.email,
        password: this.userData.librarian.password,
      })
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/dashboard')
      cy.contains('h4', /Welcome back/i).should('be.visible')

      cy.visit('/users')
      cy.contains('button', 'New User').should('be.visible')
    })

    it('TC_REG_AUTH_002: Successful login with valid Member credentials', function () {
      cy.visit('/login')
      cy.autoFillLoginForm({
        email: this.userData.member.email,
        password: this.userData.member.password,
      })
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/books')
      cy.contains('h3', 'Books').should('be.visible')
      cy.contains('button', 'New Book').should('not.exist')
    })

    it('TC_REG_AUTH_003: Verify Member cannot access Librarian-specific URLs', function () {
      cy.loginAsMember(
        this.userData.member.email,
        this.userData.member.password
      )
      cy.visit('/users', { failOnStatusCode: false })
      cy.url().should('not.include', '/users')
      cy.contains('Sorry, page not found!').should('be.visible')
    })

    it('TC_REG_AUTH_004: Successful logout for a logged-in user', function () {
      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )
      cy.visit('/dashboard')
      cy.performLogout()
      cy.url().should('include', '/login')

      // Attempt to go back to a protected page
      cy.visit('/dashboard', { failOnStatusCode: false })
      cy.url().should('include', '/login')
    })
  })

  // --- Core CRUD Functionality (Librarian) ---
  describe('Core CRUD Functionality (Librarian)', () => {
    beforeEach(function () {
      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )
    })

    it('TC_REG_CRUD_001 & TC_REG_CRUD_002: Librarian can create and update a book', function () {
      const bookData = {
        name: `Regression Book ${testTimestamp}`,
        isbn: `REG-${testTimestamp}`,
        author: 'Agatha Christie',
        genre: 'Mystery',
        summary: 'A book for regression testing',
      }

      // Create
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      cy.fillBookForm(bookData)
      cy.get('div[role="presentation"]').contains('button', 'Submit').click()
      cy.wait('@createBook')
      cy.contains('.MuiCard-root', bookData.name).should('be.visible')

      // Update
      // Click the menu on the card to reveal the 'Edit' option
      cy.contains('.MuiCard-root', bookData.name).within(() => {
        cy.get('button').first().click()
      })
      // Click 'Edit' from the popover menu
      cy.get('.MuiPopover-root').contains('li', 'Edit').click()

      const updatedSummary = `Updated summary at ${new Date().toLocaleTimeString()}`
      cy.get('div[role="presentation"]')
        .find('textarea[name="summary"]')
        .clear()
        .type(updatedSummary)
      cy.get('div[role="presentation"]').contains('button', 'Submit').click()
      cy.wait('@updateBook')

      cy.contains('.MuiCard-root', bookData.name)
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="presentation"]')
        .contains(updatedSummary)
        .should('be.visible')
    })

    it('TC_REG_CRUD_003: Librarian can register a new user who can then log in', function () {
      cy.visit('/users')
      const userData = {
        name: `Regression User ${testTimestamp}`,
        email: `regression_${testTimestamp}@example.com`,
        password: 'TestPassword123!',
        isAdmin: false,
      }

      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(userData)
      cy.get('div[role="presentation"]').contains('button', 'Submit').click()
      cy.wait('@createUser')
      cy.extendPagination()
      cy.contains('td', userData.email).should('be.visible')

      // Test that newly created user can log in
      cy.performLogout()
      cy.loginAsMember(userData.email, userData.password)
      cy.contains('h3', 'Books').should('be.visible')
    })
  })

  // --- Core Use Cases / User Workflows ---
  describe('Core Use Cases / User Workflows', () => {
    const bookData = {
      name: `Regression Book ${testTimestamp}`,
      isbn: `REG-${testTimestamp}`,
      author: 'Agatha Christie',
      genre: 'Mystery',
      summary: 'A book for regression testing',
    }

    it('TC_REG_FLOW_001 & TC_REG_FLOW_003: Member borrows a book and Librarian returns it', function () {
      // Librarian adds a book
      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )

      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      cy.fillBookForm(bookData)
      cy.get('div[role="presentation"]').contains('button', 'Submit').click()
      cy.wait('@createBook')
      cy.wait('@getBooks')
      cy.contains('.MuiCard-root', bookData.name).should('be.visible')

      cy.performLogout()

      // Member borrows book
      cy.loginAsMember(
        this.userData.member.email,
        this.userData.member.password
      )

      cy.visit('/borrowals')
      cy.contains('button', 'New Borrowal').click()

      // The 'Add borrowal' modal should be visible.
      // We target the modal root and check for the heading.
      cy.get('div.MuiModal-root')
        .contains('h4', 'Add borrowal')
        .should('be.visible')

      // Interact with the 'Book' dropdown within the modal.
      cy.get('div.MuiModal-root').within(() => {
        cy.get('#book').parent().click() // Click the combobox to open the dropdown.
        // Select the book from the options list that appears.
        cy.get('li[role="option"]').contains(bookData.name).click()

        // Click the submit button.
        cy.contains('button', 'Submit').click()
      })
      cy.wait('@createBorrowal')

      // Verify book is unavailable
      cy.visit('/books')
      cy.contains('.MuiCard-root', bookData.name)
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="presentation"]')
        .contains('span', 'Not available')
        .should('be.visible')

      // Add review for the borrowed book
      const review = {
        rating: 4,
        comment: `A fantastic read! ${testTimestamp}`,
      }
      cy.fillReviewForm(review)

      cy.wait('@createReview')
        .its('response.statusCode')
        .should('be.oneOf', [200, 201])
      cy.xpath(
        '//div[contains(@class, "MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation0 MuiCard-root")]/p[text()]'
      ).should('be.visible', review.comment)

      cy.get('div[role="presentation"]').contains('button', 'Close').click()

      cy.performLogout()

      // Librarian returns the book

      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )

      cy.visit('/borrowals')

      cy.extendPagination()

      // Find the record and mark it as returned
      cy.contains('tr', bookData.name).within(() => {
        cy.get('td:last-child button').click()
      })
      cy.get('.MuiPopover-root').contains('li', 'Edit').click()

      cy.get('div.MuiModal-root')
        .first()
        .within(() => {
          cy.get('input[name="status"]').clear().type('Returned')
          cy.contains('button', 'Submit').click()
        })
      cy.wait('@updateBorrowal').its('response.statusCode').should('eq', 200)

      // Verify book is available again
      cy.visit('/books')
      cy.contains('.MuiCard-root', bookData.name)
        .contains('button', 'View Details & Reviews')
        .click()
      cy.get('div[role="presentation"]')
        .contains('span', 'Available')
        .should('be.visible')
    })

    it('TC_REG_FLOW_002: Member can view their own borrowal history', function () {
      cy.loginAsMember(
        this.userData.member.email,
        this.userData.member.password
      )
      cy.visit('/reviews') // Member's borrowal history is on the reviews page

      cy.wait('@getReviews')
      cy.get('table tbody tr')
        .should('have.length.greaterThan', 0)
        .last()
        .within(() => {
          cy.get('th').contains(bookData.name).should('be.visible')
        })
    })
  })
})
