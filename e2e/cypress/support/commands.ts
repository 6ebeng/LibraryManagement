/**
 * E2E Test Commands
 * File: cypress/support/commands.ts
 *
 * This file contains custom Cypress commands to streamline test authoring.
 * Refactored to include helpers for filling forms and to use session caching
 * for both UI and programmatic logins, improving test speed and reliability.
 */

// Extend the Cypress.Chainable namespace to include your custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsLibrarian(email: string, password?: string): Chainable<void>
      loginAsMember(email: string, password?: string): Chainable<void>
      fillRegistrationForm(user: {
        name?: string
        dob?: string
        email?: string
        phone?: string
        password?: string
        isAdmin?: boolean
      }): Chainable<void>
      fillBookForm(book: {
        name?: string
        isbn?: string
        author?: string
        genre?: string
        summary?: string
      }): Chainable<void>
      fillAuthorForm(author: {
        name: string
        biography?: string
      }): Chainable<void>
      fillGenreForm(genre: {
        name: string
        description?: string
      }): Chainable<void>
      fillReviewForm(review: {
        rating: number
        comment: string
      }): Chainable<void>
      autoFillLoginForm(credentials: {
        email?: string
        password?: string
      }): Chainable<void>
      performLogout(): Chainable<void>
      deleteFromTable(name: string): Chainable<void>
      deleteFromCards(name: string): Chainable<void>
      waitForApi(url: string, timeout?: number): Chainable<void>
      clearUserSession(): Chainable<void>
      saveTestData(data: any, filename: string): Chainable<void>
      verifyDataSaved(filename: string): Chainable<void>
      listDownloads(): Chainable<void>
      extendPagination(): Chainable<void>
    }
  }
}

Cypress.Commands.add('autoFillLoginForm', ({ email, password }) => {
  cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible')
  if (email) {
    cy.get('input[name="email"]').clear().type(email)
  } else {
    cy.get('input[name="email"]').clear()
  }
  if (password) {
    cy.get('input[name="password"]').clear().type(password)
  } else {
    cy.get('input[name="password"]').clear()
  }
})

Cypress.Commands.add('loginAsLibrarian', (email, password) => {
  cy.session(
    [email, password, 'librarian'],
    () => {
      cy.visit('/login')
      cy.autoFillLoginForm({ email, password })
      cy.get('button[type="submit"]').click()
      cy.url({ timeout: 15000 }).should('include', '/dashboard')
      cy.contains('h4', /welcome back/i, { timeout: 15000 }).should(
        'be.visible'
      )
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.visit('/dashboard')
        cy.get('.apexcharts-canvas').should('be.visible')
      },
    }
  )
})

Cypress.Commands.add('loginAsMember', (email, password) => {
  cy.session(
    [email, password, 'member'],
    () => {
      cy.visit('/login')
      cy.autoFillLoginForm({ email, password })
      cy.get('button[type="submit"]').click()
      cy.url({ timeout: 15000 }).should('include', '/books')
      cy.contains('h3', 'Books', { timeout: 15000 }).should('be.visible')
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.visit('/books')
        cy.contains('h3', 'Books').should('be.visible')
      },
    }
  )
})

Cypress.Commands.add('fillRegistrationForm', (user) => {
  cy.contains('h4', /Add user|Update user/i)
    .parents('.MuiBox-root')
    .first()
    .should('be.visible')
    .within(() => {
      if (user.name) cy.get('input[name="name"]').clear().type(user.name)
      if (user.dob) cy.get('input[name="dob"]').clear().type(user.dob)
      if (user.email) cy.get('input[name="email"]').clear().type(user.email)
      if (user.phone) cy.get('input[name="phone"]').clear().type(user.phone)
      if (user.password)
        cy.get('input[name="password"]').clear().type(user.password)
      if (user.isAdmin !== undefined) {
        const role = user.isAdmin ? 'Librarian' : 'Member'
        cy.contains('label', role).find('input[type="radio"]').click()
      }
    })
})

Cypress.Commands.add('fillBookForm', (book) => {
  cy.contains('h4', /Add book|Update book/i)
    .parents('.MuiBox-root')
    .first()
    .should('be.visible')
    .within(() => {
      if (book.name) cy.get('input[name="name"]').clear().type(book.name)
      if (book.isbn) cy.get('input[name="isbn"]').clear().type(book.isbn)
      if (book.summary)
        cy.get('textarea[name="summary"]').clear().type(book.summary)

      if (book.author) {
        cy.get('#author-label').parent().find('div[role="combobox"]').click()
        cy.wait(500) // Wait for dropdown to be ready
        cy.xpath('//ul[@role="listbox"][1]').should('be.visible')
        cy.xpath(`//li[@role="option" and contains(text(), "${book.author}")]`)
          .should('be.visible')
          .click()
      }
      if (book.genre) {
        cy.get('#genre-label').parent().find('div[role="combobox"]').click()
        cy.xpath('//ul[@role="listbox"][1]').should('be.visible')
        cy.xpath(
          `//li[@role="option" and contains(text(), "${book.genre}")]`
        ).click()
      }
    })
})

Cypress.Commands.add('fillAuthorForm', (author) => {
  cy.contains('h4', /Add author|Update author/i)
    .parents('.MuiBox-root')
    .first()
    .should('be.visible')
    .within(() => {
      cy.get('input[name="name"]').clear().type(author.name)
      if (author.biography) {
        cy.get('textarea[name="description"]').clear().type(author.biography)
      }
    })
})

Cypress.Commands.add('fillGenreForm', (genre) => {
  cy.contains('h4', /Add genre|Update genre/i)
    .parents('.MuiBox-root')
    .first()
    .should('be.visible')
    .within(() => {
      cy.get('input[name="name"]').clear().type(genre.name)
      if (genre.description) {
        cy.get('textarea[name="description"]').clear().type(genre.description)
      }
    })
})

Cypress.Commands.add('fillReviewForm', (review) => {
  cy.get('div[role="dialog"]').within(() => {
    cy.get(`input[class*="MuiRating"][value="${review.rating}"]`).prev().click()
    cy.get('textarea').first().clear().type(review.comment)
    cy.contains('button', 'Submit Review').click()
  })
})

Cypress.Commands.add('performLogout', () => {
  cy.log('Performing logout via UI')
  cy.get('header .MuiStack-root button').click()
  cy.get('.MuiPopover-root li').contains('Logout').click()
  cy.url().should('include', '/login')
})

Cypress.Commands.add('extendPagination', () => {
  cy.get('.MuiTablePagination-root').within(() => {
    cy.get('div[role="combobox"]').click()
  })
  cy.get('li[role="option"][data-value="25"]').click()
})

Cypress.Commands.add('deleteFromTable', (name) => {
  cy.log(`Deleting entity: ${name}`)
  cy.contains('tr', name).within(() => {
    cy.get('td:last-child button').click()
  })
  // Refined selector for better stability
  cy.get(
    'body > div.MuiPopover-root.MuiModal-root > div.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation8.MuiPopover-paper'
  )
    .contains('li', 'Delete')
    .click()
  // Refined selector for better stability
  cy.get('div[role="dialog"]').contains('button', 'Yes').click()
})

Cypress.Commands.add('deleteFromCards', (name) => {
  cy.contains('div.MuiGrid-root.MuiGrid-container', name).within(() => {
    cy.get('div:last-child> div > div> span> button').click()
  })

  // Refined selector for better stability
  cy.get(
    'body > div.MuiPopover-root.MuiModal-root > div.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation8.MuiPopover-paper'
  )
    .contains('li', 'Delete')
    .click()
  // Refined selector for better stability
  cy.get('div[role="dialog"]').contains('button', 'Yes').click()
})

Cypress.Commands.add('waitForApi', (url, timeout = 30000) => {
  cy.request({
    url: url,
    timeout: timeout,
    retryOnStatusCodeFailure: true,
    retryOnNetworkFailure: true,
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.be.lessThan(500)
  })
})

Cypress.Commands.add('clearUserSession', () => {
  Cypress.session.clearAllSavedSessions()
  cy.clearLocalStorage()
  cy.clearCookies()
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })
})

Cypress.Commands.add('saveTestData', (data: any, filename: string) => {
  cy.task('saveData', { filename, data }).then((savedPath) => {
    cy.log(`Data saved to: ${savedPath}`)
  })
})

Cypress.Commands.add('verifyDataSaved', (filename: string) => {
  const filepath = `cypress/data/downloads/${filename}`
  cy.task('fileExists', filepath).should('equal', true)
  cy.log(`Verified file exists: ${filename}`)
})

Cypress.Commands.add('listDownloads', () => {
  cy.task('listDownloads').then((files) => {
    cy.log(`Downloads directory contains: ${JSON.stringify(files)}`)
  })
})

export {}
