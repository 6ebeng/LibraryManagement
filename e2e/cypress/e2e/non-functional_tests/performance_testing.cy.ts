/**
 * E2E Test Cases for Performance Testing
 * File: cypress/e2e/performance_testing.cy.ts
 * * Tests performance aspects: UI Load & Responsiveness, API Response Times, Volume Testing
 * Based on TC_Performance_Testing.tex
 */

describe('E2E: Performance Testing', () => {
  let fixtureUserData: any

  before(function () {
    cy.fixture('user-data.json')
      .as('userData')
      .then((data) => {
        fixtureUserData = data
      })
  })

  // --- UI Load & Responsiveness Testing ---
  describe('UI Load & Responsiveness Testing', () => {
    it('TC_PERF_UI_001: Page load time for book list with few records', function () {
      // Assuming a small dataset is the default
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )

      const startTime = performance.now()
      cy.visit('/books')
      cy.contains('h3', 'Books').should('be.visible')

      cy.get('.MuiCard-root')
        .should('have.length.gt', 0)
        .then(() => {
          const loadTime = performance.now() - startTime
          cy.log(`Page load time (few records): ${loadTime.toFixed(2)}ms`)
          expect(loadTime).to.be.lessThan(2000)
        })
    })

    it('TC_PERF_UI_002: Page load time for book list with many records (Volume)', function () {
      // This test requires a pre-seeded large dataset to run effectively.
      // cy.exec('npm run seed:large --prefix ../server');
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )

      const startTime = performance.now()
      cy.visit('/books')
      cy.contains('h3', 'Books').should('be.visible')

      cy.get('.MuiCard-root')
        .should('have.length.gt', 5)
        .then(() => {
          const loadTime = performance.now() - startTime
          cy.log(`Page load time (many records): ${loadTime.toFixed(2)}ms`)
          expect(loadTime).to.be.lessThan(5000)
        })
    })

    it('TC_PERF_UI_003: UI responsiveness during data entry on a high-load page', function () {
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.visit('/dashboard')
      cy.contains('h4', /Welcome back/i).should('be.visible')

      const startTime = performance.now()
      cy.get('header .MuiStack-root button').click()
      const responseTime = performance.now() - startTime

      expect(responseTime).to.be.lessThan(500)
      cy.get('.MuiPopover-root').should('be.visible')
    })
  })

  // --- API Response Time Testing ---
  describe('API Response Time Testing', () => {
    it('TC_PERF_API_001: API response time for fetching all books (Normal Load)', function () {
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      const startTime = performance.now()

      cy.request('/api/book/getAll').then((response) => {
        const responseTime = performance.now() - startTime
        expect(response.status).to.eq(200)
        expect(responseTime).to.be.lessThan(300)
        cy.log(
          `API response time for fetching books: ${responseTime.toFixed(2)}ms`
        )
      })
    })

    it('TC_PERF_API_002: API response time for creating a new entity (Borrowal)', function () {
      cy.loginAsLibrarian(
        fixtureUserData.librarian.email,
        fixtureUserData.librarian.password
      )
      cy.request('/api/book/getAll').then((booksResponse) => {
        const availableBook = booksResponse.body.find(
          (book: any) => book.isAvailable
        )
        expect(availableBook, 'An available book must exist for this test').to
          .not.be.undefined

        const borrowalData = {
          bookId: availableBook._id,
          memberId: this.userData.member._id, // Assuming member fixture has _id
          dueDate: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }

        const startTime = performance.now()
        cy.request('POST', '/api/borrowal/add', borrowalData).then(
          (response) => {
            const responseTime = performance.now() - startTime
            expect(response.status).to.eq(201)
            expect(responseTime).to.be.lessThan(400)
            cy.log(
              `Borrowal creation API response time: ${responseTime.toFixed(2)}ms`
            )
          }
        )
      })
    })

    it('TC_PERF_API_003: API response time for user authentication', function () {
      const startTime = performance.now()

      cy.request('POST', '/api/auth/login', {
        email: fixtureUserData.librarian.email,
        password: fixtureUserData.librarian.password,
      }).then((response) => {
        const responseTime = performance.now() - startTime
        expect(response.status).to.eq(200)
        expect(responseTime).to.be.lessThan(250)
        cy.log(`Authentication API response time: ${responseTime.toFixed(2)}ms`)
      })
    })
  })
})
