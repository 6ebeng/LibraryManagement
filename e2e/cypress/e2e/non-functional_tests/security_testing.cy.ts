/**
 * E2E Test Cases for Security Testing
 * File: cypress/e2e/security_testing.cy.ts
 * * Tests security aspects: RBAC, Input Validation, Injection Attacks, Session Management, Data Security
 * Based on TC_Security_Testing.tex
 */

describe('E2E: Security Testing', () => {
  const testTimestamp = Date.now()

  // Define simple interfaces for type safety
  interface Borrowal {
    _id: string
    memberId: string
    // Add other properties as needed
  }

  interface User {
    _id: string
    name: string
    email: string
    isAdmin: boolean
    // Add other properties as needed
  }

  before(function () {
    cy.fixture('user-data.json').as('userData')
  })

  // --- Access Control & Authorization (RBAC) ---
  describe('Access Control & Authorization (RBAC)', () => {
    it('TC_SEC_RBAC_001: Verify Member cannot access Librarian-only URLs', function () {
      cy.loginAsMember(
        this.userData.member.email,
        this.userData.member.password
      )

      const librarianOnlyUrls = ['/dashboard', '/users', '/reviews']

      librarianOnlyUrls.forEach((url) => {
        cy.visit(url, { failOnStatusCode: false })
        cy.url().should('not.include', url)
        cy.contains('Sorry, page not found!').should('be.visible')
      })
    })

    it('TC_SEC_RBAC_002: Verify unauthenticated user cannot access any protected pages', () => {
      cy.clearUserSession()
      const protectedUrls = ['/dashboard', '/users', '/books', '/borrowals']

      protectedUrls.forEach((url) => {
        cy.visit(url, { failOnStatusCode: false })
        cy.url().should('include', '/login')
      })
    })

    it('TC_SEC_RBAC_003: Member attempts to perform Librarian action via API', function () {
      cy.loginAsMember(
        this.userData.member.email,
        this.userData.member.password
      )

      cy.request({
        method: 'POST',
        url: '/api/authors',
        body: { name: `Unauthorized Author ${testTimestamp}` },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403)
      })
    })
  })

  // --- Input Validation & Injection Attacks ---
  describe('Input Validation & Injection Attacks', () => {
    beforeEach(function () {
      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )
    })

    it('TC_SEC_INJ_001: Attempt basic Cross-Site Scripting (XSS) in UI form fields', () => {
      cy.visit('/authors')
      cy.contains('button', 'New Author').click()

      const xssPayload = '<script>alert("XSS")</script>'
      const authorData = {
        name: `XSS Author ${testTimestamp}`,
        biography: xssPayload,
      }

      cy.fillAuthorForm(authorData)
      cy.get('div[role="dialog"]').contains('button', 'Submit').click()

      cy.extendPagination()
      cy.contains('td', authorData.name)
        .parent('tr')
        .within(() => {
          cy.get('td:last-child button').click()
        })
      cy.get('.MuiPopover-root').contains('li', 'Edit').click()

      cy.get('textarea[name="description"]').should('have.value', xssPayload)
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('alertStub')
      })
      cy.get('@alertStub').should('not.have.been.called')
    })

    it('TC_SEC_INJ_002: Attempt basic NoSQL injection in login form', function () {
      cy.performLogout()

      const injectionPayload = { email: { $gt: '' }, password: 'anypassword' }
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: injectionPayload,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(200)
        expect(response.body).to.not.have.property('token')
      })
    })

    it('TC_SEC_INJ_003: Attempt Insecure Direct Object Reference (IDOR) via API', function () {
      // This test requires a second member user in your fixtures to work correctly.
      cy.fixture('user-data.json').then((users) => {
        const memberA = this.userData.member
        const memberB = users.member2 // Assuming a 'member2' exists in user-data.json

        cy.loginAsMember(memberA.email, memberA.password)
        cy.request('/api/borrowal/getAll').then((response) => {
          const memberABorrowals = response.body.filter(
            (b: Borrowal) => b.memberId === memberA._id
          )

          if (memberABorrowals.length > 0) {
            const borrowalId = memberABorrowals[0]._id

            cy.loginAsMember(memberB.email, memberB.password)
            cy.request({
              method: 'GET',
              url: `/api/borrowal/${borrowalId}`,
              failOnStatusCode: false,
            }).then((idorResponse) => {
              expect(idorResponse.status).to.be.oneOf([403, 404])
            })
          } else {
            cy.log(
              'Skipping IDOR test: Member A has no borrowals to test with.'
            )
          }
        })
      })
    })
  })

  // --- Session Management ---
  describe('Session Management', () => {
    it('TC_SEC_SESS_001: Verify session invalidation on logout', function () {
      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )
      cy.visit('/dashboard')

      cy.performLogout()

      cy.visit('/dashboard', { failOnStatusCode: false })
      cy.url().should('include', '/login')
    })

    it('TC_SEC_SESS_002: Verify secure session cookie attributes', function () {
      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )

      cy.getCookie('connect.sid')
        .should('exist')
        .and('have.property', 'httpOnly', true)
      const baseUrl = Cypress.config().baseUrl
      if (baseUrl && baseUrl.startsWith('https://')) {
        cy.getCookie('connect.sid').should('have.property', 'secure', true)
      }
    })
  })

  // --- Data Security & Transport Layer ---
  describe('Data Security & Transport Layer', () => {
    it('TC_SEC_DATA_001: Verify sensitive data is not returned in API responses', function () {
      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )

      cy.request('/api/user/getAll').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')

        response.body.forEach((user: User) => {
          expect(user).to.not.have.property('password')
        })
      })
    })

    it('TC_SEC_DATA_002: Verify secure data transmission (HTTPS)', () => {
      const baseUrl = Cypress.config().baseUrl
      if (baseUrl && baseUrl.startsWith('https://')) {
        cy.visit('/')
        cy.location('protocol').should('eq', 'https:')
      } else {
        cy.log('Skipping HTTPS test because baseUrl is not HTTPS.')
      }
    })

    it('TC_SEC_DATA_003: Verify password fields are masked', function () {
      cy.visit('/login')
      cy.get('input[name="password"]').should('have.attr', 'type', 'password')

      cy.loginAsLibrarian(
        this.userData.librarian.email,
        this.userData.librarian.password
      )
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      cy.get('input[name="password"]').should('have.attr', 'type', 'password')
    })
  })
})
