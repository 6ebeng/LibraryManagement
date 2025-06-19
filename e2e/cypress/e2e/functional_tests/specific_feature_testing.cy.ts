/**
 * E2E Test Cases for Specific Feature Testing
 * File: cypress/e2e/specific_feature_testing.cy.ts
 *
 * Tests specific features: Dashboard, Book Management, Borrowal Management, User Management, Review Management.
 * This file has been refactored for correctness, robustness, and clarity. It now uses consistent API interceptions,
 * proper context for user roles, and leverages custom commands effectively.
 * Based on TC_Specific_Feature_Testing.tex
 */

describe('E2E: Specific Feature Testing', () => {
  const testTimestamp: number = Date.now()
  let fixtureUserData: any

  before(function () {
    // Load user data from fixture once for all tests in this spec
    cy.fixture('user-data.json')
      .as('userData')
      .then((data) => {
        fixtureUserData = data
      })
  })

  // // --- Dashboard Feature Tests (Librarian vs. Member) ---
  // describe('Dashboard Access Control', () => {
  //   it('TC_DASH_001: Verify Librarian can access the Dashboard', function () {
  //     // Log in as a librarian
  //     cy.loginAsLibrarian(
  //       fixtureUserData.librarian.email,
  //       fixtureUserData.librarian.password
  //     )
  //     cy.visit('/dashboard')

  //     // Verify the URL and key components of the dashboard
  //     cy.url().should('include', '/dashboard')
  //     cy.contains('h4', /Welcome back/i).should('be.visible')
  //     cy.get('.MuiGrid-container .MuiPaper-root').should(
  //       'have.length.at.least',
  //       4 // Stat cards for books, authors, etc.
  //     )
  //     // Ensure charts are rendered
  //     cy.get('.apexcharts-canvas', { timeout: 10000 }).should('be.visible')
  //   })

  //   it('TC_DASH_002: Verify Member cannot access the Dashboard', function () {
  //     // Log in as a member
  //     cy.loginAsMember(
  //       fixtureUserData.member.email,
  //       fixtureUserData.member.password
  //     )
  //     // Attempt to visit the dashboard URL, expecting it to fail (404)
  //     cy.visit('/dashboard', { failOnStatusCode: false })

  //     // Verify redirection to a "Not Found" page
  //     cy.url().should('not.include', '/dashboard')
  //     cy.contains('p', 'Sorry, page not found!').should('be.visible')
  //   })
  // })

  // // --- Book Management Feature Tests (Librarian Actions) ---
  // describe('Book Management by Librarian', () => {
  //   beforeEach(function () {
  //     // Log in as a librarian before each test in this block
  //     cy.loginAsLibrarian(
  //       fixtureUserData.librarian.email,
  //       fixtureUserData.librarian.password
  //     )

  //     // Set up API intercepts for all book-related actions
  //     cy.intercept('POST', '/api/books/add').as('createBook')
  //     cy.intercept('PUT', '/api/books/update/*').as('updateBook')
  //     cy.intercept('DELETE', '/api/books/delete/*').as('deleteBook')
  //   })

  //   it('TC_BOOK_ADD_001 & TC_BOOK_ADD_002: Successful new book creation and validation', () => {
  //     cy.visit('/books')
  //     cy.contains('button', 'New Book').click()

  //     TC_BOOK_ADD_002: Attempt to submit with missing required fields
  //     cy.get('body > div.MuiModal-root> div.MuiBox-root')
  //       .contains('button', 'Submit')
  //       .click()
  //     cy.contains('Name is required').should('be.visible')
  //     cy.contains('ISBN is required').should('be.visible')

  //     TC_BOOK_ADD_001: Fill the form with valid data for successful creation
  //     const newBook = {
  //       name: `Feature Test Book ${testTimestamp}`,
  //       isbn: `FT-${testTimestamp}`,
  //       author: 'Agatha Christie', // Assumes this author exists in seed data
  //       genre: 'Mystery', // Assumes this genre exists in seed data
  //       summary: 'A book for specific feature testing.',
  //     }

  //     cy.fillBookForm(newBook)
  //     cy.get('div[role="dialog"]').contains('button', 'Submit').click()

  //     Wait for the API call to complete and verify the outcome
  //     cy.wait('@createBook').its('response.statusCode').should('eq', 201)
  //     cy.contains(newBook.name).should('be.visible')
  //   })

  //   it('TC_BOOK_UPD_001 & TC_BOOK_DEL_001: Librarian can update and delete a book', function () {
  //     const bookToManage = {
  //       name: `Manageable Book ${testTimestamp}`,
  //       isbn: `MNG-${testTimestamp}`,
  //       author: 'Jane Austen', // Assumes this author exists for the UI dropdown
  //       genre: 'Romance', // Assumes this genre exists for the UI dropdown
  //       summary: 'A book created for update/delete testing.',
  //     }

  //     // --- Create the book via UI to ensure it exists for the test ---
  //     cy.visit('/books')
  //     cy.contains('button', 'New Book').click()
  //     cy.fillBookForm(bookToManage)
  //     cy.get('body > div.MuiModal-root> div.MuiBox-root')
  //       .contains('button', 'Submit')
  //       .click()
  //     cy.wait('@createBook').its('response.statusCode').should('eq', 201)
  //     cy.contains(bookToManage.name).should('be.visible')

  //     // --- Update the book (TC_BOOK_UPD_001) ---
  //     // Click the menu on the card to reveal the 'Edit' option
  //     cy.contains('.MuiCard-root', bookToManage.name).within(() => {
  //       cy.get('button').first().click()
  //     })

  //     // Click 'Edit' from the popover menu
  //     cy.get('.MuiPopover-root').contains('li', 'Edit').click()

  //     const updatedSummary = `This summary was updated at ${new Date().toLocaleTimeString()}`

  //     // The 'Edit Book' dialog is now open. Use the custom command to fill it.
  //     cy.fillBookForm({ summary: updatedSummary })

  //     cy.get('body > div.MuiModal-root> div.MuiBox-root')
  //       .contains('button', 'Submit')
  //       .click()
  //     cy.wait('@updateBook')

  //     // To robustly verify the update, we view the details to check the new content.
  //     cy.contains('.MuiCard-root', bookToManage.name)
  //       .contains('button', 'View Details & Reviews')
  //       .click()

  //     cy.get('div[role="dialog"]').contains(updatedSummary).should('be.visible')
  //     cy.get('div[role="dialog"]').contains('button', 'Close').click()

  //     // --- Delete the book (TC_BOOK_DEL_001) ---
  //     // Use the custom command for deletion from the card view
  //     cy.deleteFromCards(bookToManage.name)
  //     cy.wait('@deleteBook').its('response.statusCode').should('eq', 200)

  //     // Verify the book is no longer in the list
  //     cy.contains(bookToManage.name).should('not.exist')
  //   })
  // })

  // // --- Member-Facing Features (Viewing Books, Borrowing, Reviewing) ---
  // describe('Member Actions: Viewing, Borrowing, and Reviewing Books', () => {
  //   beforeEach(function () {
  //     // Log in as a member before each test in this block
  //     cy.loginAsMember(
  //       fixtureUserData.member.email,
  //       fixtureUserData.member.password
  //     )
  //     // Intercept APIs relevant to member actions
  //     cy.intercept('POST', '/api/borrowals/add').as('createBorrowal')
  //     cy.intercept('POST', '/api/reviews/add').as('createReview')
  //   })

  //   it('TC_BOOK_VIEW_001: Verify any user can view list of books and book details', function () {
  //     cy.visit('/books')

  //     // Verify that book cards are rendered on the page
  //     cy.get('.MuiGrid-container .MuiCard-root').should(
  //       'have.length.greaterThan',
  //       0
  //     )

  //     // Click to view details and verify the dialog opens with content
  //     cy.get('.MuiCard-root')
  //       .first()
  //       .contains('button', 'View Details & Reviews')
  //       .click()

  //     cy.get('div[role="dialog"]').should('be.visible')
  //     cy.get('div[role="dialog"]').contains('h2', /.+/).should('be.visible') // Check for book title
  //   })

  //   it('TC_BORW_ADD_001: Member can borrow a book', function () {
  //     // This test follows the user flow starting from the Borrowals page.
  //     cy.visit('/borrowals')

  //     // Click the 'New Borrowal' button to open the modal.
  //     cy.contains('button', 'New Borrowal').click()

  //     // The 'Add borrowal' modal should be visible.
  //     // We target the modal root and check for the heading.
  //     cy.get('div.MuiModal-root')
  //       .contains('h4', 'Add borrowal')
  //       .should('be.visible')

  //     // Interact with the 'Book' dropdown within the modal.
  //     cy.get('div.MuiModal-root').within(() => {
  //       cy.get('#book').parent().click() // Click the combobox to open the dropdown.
  //       // Select the book '1984' from the options list that appears.
  //       cy.get('li[role="option"]').contains('Manageable').click()

  //       // Click the submit button.
  //       cy.contains('button', 'Submit').click()
  //     })

  //     // Wait for the API call and assert its success.
  //     cy.wait('@createBorrowal').its('response.statusCode').should('eq', 201)

  //     // Check for a success message toast.
  //     cy.contains(/Borrowal added/i).should('be.visible')

  //     // Also verify the borrowal now appears in the table.
  //     cy.contains('td', '1984').should('be.visible')
  //   })

  //   it('TC_REV_ADD_001: Member can submit a review for a book', function () {
  //     // NOTE: This test assumes the book "Pride and Prejudice" exists.
  //     cy.visit('/books')
  //     cy.contains('.MuiCard-root', 'Pride and Prejudice')
  //       .contains('button', 'View Details & Reviews')
  //       .click()

  //     const review = {
  //       rating: 5,
  //       comment: `Excellent classic novel. A must-read! - ${testTimestamp}`,
  //     }

  //     // Use the custom command to fill and submit the review form
  //     cy.fillReviewForm(review)
  //     cy.wait('@createReview').its('response.statusCode').should('eq', 201)
  //     // Verify the new review is visible in the dialog
  //     cy.xpath('//div[@role="dialog"]/div[1]/div/div/div/p').should(
  //       'contain',
  //       review.comment
  //     )
  //   })
  // })

  // --- User Management ---
  describe('User Management by Librarian', () => {
    beforeEach(function () {
      // Log in as a librarian before each test
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )

      // Intercept all user-related API calls
      cy.intercept('POST', '/api/users/add').as('createUser')
      cy.intercept('PUT', '/api/users/update/*').as('updateUser')
      cy.intercept('DELETE', '/api/users/delete/*').as('deleteUser')
    })

    // it('TC_USER_VIEW_001: Librarian can view the list of all users', () => {
    //   cy.visit('/users');
    //   cy.get('table').should('be.visible');
    //   cy.get('tbody tr').should('have.length.gt', 0);

    //   // Check that different user roles are visible in the table
    //   cy.contains('td', 'Librarian').should('be.visible');
    //   cy.contains('td', 'Member').should('be.visible');
    // });

    it('TC_USER_UPD_001 & TC_USER_DEL_001: Librarian can create, update, and delete a user', function () {
      const newUser = {
        name: `Temp User ${testTimestamp}`,
        email: `temp_user_${testTimestamp}@example.com`,
        password: 'password123',
        isAdmin: false,
      }

      // --- Create User ---
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      cy.fillRegistrationForm(newUser)
      cy.get('body > div.MuiModal-root> div.MuiBox-root')
        .contains('button', 'Submit')
        .click()
      cy.wait('@createUser')
      cy.extendPagination() // Ensure all table rows are visible
      cy.contains('td', newUser.email).should('be.visible')

      // --- Update User (TC_USER_UPD_001) ---
      cy.contains('tr', newUser.email).find('button').click()
      cy.get('.MuiPopover-root').contains('li', 'Edit').click()
      const updatedName = `Updated ${newUser.name}`

      // Use the custom command to fill only the updated field
      cy.fillRegistrationForm({ name: updatedName })

      cy.get('body > div.MuiModal-root> div.MuiBox-root')
        .contains('button', 'Submit')
        .click()
      cy.wait('@updateUser')
      cy.contains('td', updatedName).should('be.visible')

      // --- Delete User (TC_USER_DEL_001) ---
      // Use the custom command for a clean deletion process
      cy.deleteFromTable(updatedName)
      cy.wait('@deleteUser').its('response.statusCode').should('eq', 204)
      cy.contains(updatedName).should('not.exist')
    })
  })
})
