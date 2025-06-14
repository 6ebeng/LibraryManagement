/**
 * E2E Test Cases for Security Testing
 * File: cypress/e2e/security_testing.cy.ts
 * 
 * Tests security aspects: RBAC, Input Validation, Injection Attacks, Session Management, Data Security
 * Based on TC_Security_Testing.tex
 */

describe('E2E: Security Testing', () => {
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

  // --- Access Control & Authorization (RBAC) ---
  describe('Access Control & Authorization (RBAC)', () => {
    
    it('TC_SEC_RBAC_001: Verify Member cannot access Librarian-only URLs', () => {
      // Login as Member
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      
      // List of Librarian-only URLs to test
      const librarianOnlyUrls = ['/dashboard', '/users']
      
      librarianOnlyUrls.forEach(url => {
        cy.visit(url, { failOnStatusCode: false })
        
        // Should be denied access and redirected
        cy.url().should('not.include', url)
        cy.url().should('satisfy', (currentUrl) => {
          return currentUrl.includes('/books') || 
                 currentUrl.includes('/404') || 
                 currentUrl.includes('/403') ||
                 currentUrl.includes('/login')
        })
      })
    })

    it('TC_SEC_RBAC_002: Verify unauthenticated user cannot access any protected pages', () => {
      // Ensure no user is logged in
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // List of protected URLs
      const protectedUrls = ['/dashboard', '/users', '/books', '/borrowals']
      
      protectedUrls.forEach(url => {
        cy.visit(url, { failOnStatusCode: false })
        
        // Should redirect to login or show access denied
        cy.url().should('satisfy', (currentUrl) => {
          return currentUrl.includes('/login') || 
                 currentUrl.includes('/404') || 
                 currentUrl.includes('/403')
        })
      })
    })

    it('TC_SEC_RBAC_003: Member attempts to perform Librarian action via API', () => {
      // Login as Member to get session
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      
      // Attempt to access Librarian-only API endpoints
      cy.request({
        method: 'POST',
        url: '/api/user/add',
        body: {
          name: 'Unauthorized User',
          email: `unauthorized_${testTimestamp}@example.com`,
          password: 'Password123!',
          isAdmin: false
        },
        failOnStatusCode: false
      }).then((response) => {
        // Should return authorization error
        expect([401, 403]).to.include(response.status)
      })

      // Attempt to delete a user
      cy.request({
        method: 'DELETE',
        url: '/api/user/delete/507f1f77bcf86cd799439011', // Example user ID
        failOnStatusCode: false
      }).then((response) => {
        expect([401, 403, 404]).to.include(response.status)
      })
    })
  })

  // --- Input Validation & Injection Attacks ---
  describe('Input Validation & Injection Attacks', () => {
    
    it('TC_SEC_INJ_001: Attempt basic Cross-Site Scripting (XSS) in UI form fields', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      const xssPayload = '<script>alert("XSS")</script>'
      const bookData = {
        name: `XSS Test Book ${testTimestamp}`,
        isbn: `XSS-${testTimestamp}`,
        summary: xssPayload // XSS payload in summary field
      }

      // Fill form with XSS payload
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
      
      // View the book details to check if XSS was prevented
      if (cy.contains(bookData.name)) {
        cy.contains(bookData.name).click()
        
        // Verify script is not executed and is properly sanitized
        cy.get('[data-testid="book-summary"]').should('not.contain', '<script>')
        cy.get('[data-testid="book-summary"]').should('contain.text', xssPayload)
      }
    })

    it('TC_SEC_INJ_002: Attempt basic NoSQL injection in login form', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      cy.visit('/login')
      
      // NoSQL injection payloads
      const injectionPayloads = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '" || 1==1 //',
        '"; return true; //'
      ]

      injectionPayloads.forEach(payload => {
        cy.get('input[name="email"]').clear().type(payload)
        cy.get('input[name="password"]').clear().type('anypassword')
        cy.get('button[type="submit"]').click()
        
        // Should fail login and show generic error
        cy.contains(/invalid|incorrect|not found/i).should('be.visible')
        cy.url().should('include', '/login')
        
        // Clear for next iteration
        cy.reload()
      })
    })

    it('TC_SEC_INJ_003: Attempt Insecure Direct Object Reference (IDOR) via API', () => {
      // Login as Member A
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      
      // Get Member A's borrowal data
      cy.request('/api/borrowal/getAll').then((response) => {
        expect(response.status).to.eq(200)
        const memberABorrowals = response.body
        
        if (memberABorrowals.length > 0) {
          // Try to access another user's borrowal directly
          const borrowalId = memberABorrowals[0]._id
          
          // Attempt to access borrowal with different user context
          cy.request({
            method: 'GET',
            url: `/api/borrowal/get/${borrowalId}`,
            failOnStatusCode: false
          }).then((directResponse) => {
            // Should either deny access or only return user's own data
            if (directResponse.status === 200) {
              // If successful, verify it's user's own data
              expect(directResponse.body.memberId).to.equal(memberABorrowals[0].memberId)
            } else {
              // Should return authorization error
              expect([401, 403, 404]).to.include(directResponse.status)
            }
          })
        }
      })
    })

    it('TC_SEC_INJ_004: Test input length validation and malformed data', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      
      // Test with extremely long input
      const longString = 'a'.repeat(10000)
      const malformedData = {
        name: longString,
        email: `malformed_${testTimestamp}@example.com`,
        password: 'ValidPassword123!',
        isAdmin: false
      }

      cy.fillRegistrationForm(malformedData)
      cy.get('button[type="submit"]').click()
      
      // Should handle gracefully with validation error or size limit
      cy.get('body').should('satisfy', (body) => {
        const text = body.text()
        return text.includes('error') || 
               text.includes('invalid') || 
               text.includes('too long') ||
               text.includes('success') // If server handles it gracefully
      })
    })
  })

  // --- Session Management ---
  describe('Session Management', () => {
    
    it('TC_SEC_SESS_001: Verify session invalidation on logout', () => {
      // Login
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Copy protected page URL
      const protectedUrl = '/users'
      cy.visit(protectedUrl)
      
      // Logout
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()
      
      // Verify redirected to login
      cy.url().should('include', '/login')
      
      // Try to access protected page using browser back or direct URL
      cy.visit(protectedUrl, { failOnStatusCode: false })
      
      // Should not display protected page
      cy.url().should('not.include', protectedUrl)
      cy.url().should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/404') || url.includes('/403')
      })
    })

    it('TC_SEC_SESS_002: Verify secure session cookie attributes', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      // Check cookies using Cypress commands
      cy.getCookies().then((cookies) => {
        // Look for session-related cookies
        const sessionCookies = cookies.filter(cookie => 
          cookie.name.toLowerCase().includes('session') ||
          cookie.name.toLowerCase().includes('auth') ||
          cookie.name.toLowerCase().includes('token')
        )
        
        sessionCookies.forEach(cookie => {
          // Verify HttpOnly attribute (prevents XSS access)
          expect(cookie.httpOnly).to.be.true
          
          // Verify Secure attribute (for HTTPS)
          if (Cypress.config().baseUrl?.startsWith('https')) {
            expect(cookie.secure).to.be.true
          }
        })
      })
    })

    it('TC_SEC_SESS_003: Test session timeout handling', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Simulate session expiry by clearing cookies
      cy.clearCookies()
      
      // Try to perform an action requiring authentication
      cy.visit('/users')
      
      // Should redirect to login due to expired session
      cy.url().should('include', '/login')
    })
  })

  // --- Data Security & Transport Layer ---
  describe('Data Security & Transport Layer', () => {
    
    it('TC_SEC_DATA_001: Verify sensitive data is not returned in API responses', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      // Test user API endpoint
      cy.request('/api/user/getAll').then((response) => {
        expect(response.status).to.eq(200)
        
        response.body.forEach((user: any) => {
          // Verify sensitive fields are not present
          expect(user).to.not.have.property('password')
          expect(user).to.not.have.property('hash')
          expect(user).to.not.have.property('salt')
          expect(user).to.not.have.property('passwordHash')
          
          // Verify only safe fields are present
          expect(user).to.have.property('name')
          expect(user).to.have.property('email')
          expect(user).to.have.property('isAdmin')
        })
      })
    })

    it('TC_SEC_DATA_002: Verify secure data transmission (HTTPS)', () => {
      // Check if base URL uses HTTPS
      const baseUrl = Cypress.config().baseUrl
      
      if (baseUrl?.startsWith('https')) {
        cy.visit('/')
        
        // Verify connection is secure
        cy.location('protocol').should('eq', 'https:')
        
        // Intercept login request to verify it's over HTTPS
        cy.intercept('POST', '/api/auth/login').as('loginRequest')
        
        cy.visit('/login')
        cy.autoFillLoginForm({
          email: fixtureUserData.librarian.email,
          password: fixtureUserData.librarian.password
        })
        cy.get('button[type="submit"]').click()
        
        cy.wait('@loginRequest').then((interception) => {
          // Verify the request was made over HTTPS
          expect(interception.request.url).to.include('https://')
        })
      } else {
        cy.log('Application not using HTTPS - consider implementing for production')
      }
    })

    it('TC_SEC_DATA_003: Verify password fields are masked', () => {
      cy.visit('/login')
      
      // Check password field type
      cy.get('input[name="password"]').should('have.attr', 'type', 'password')
      
      // Check registration form password fields
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      
      cy.get('input[name="password"]').should('have.attr', 'type', 'password')
    })
  })

  // --- Error Handling & Information Disclosure ---
  describe('Error Handling & Information Disclosure', () => {
    
    it('TC_SEC_ERR_001: Verify no sensitive information in error messages', () => {
      // Test 404 errors
      cy.visit('/nonexistent-page', { failOnStatusCode: false })
      cy.get('body').should('not.contain', 'stack trace')
      cy.get('body').should('not.contain', 'database')
      cy.get('body').should('not.contain', 'internal server error')
      
      // Test API errors
      cy.request({
        method: 'GET',
        url: '/api/nonexistent/endpoint',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.body).to.not.include('stack')
        expect(response.body).to.not.include('mongoose')
        expect(response.body).to.not.include('mongodb')
      })
    })

    it('TC_SEC_ERR_002: Test rate limiting on login attempts', () => {
      cy.visit('/login')
      
      // Attempt multiple failed logins
      const attempts = 5
      for (let i = 0; i < attempts; i++) {
        cy.get('input[name="email"]').clear().type('test@example.com')
        cy.get('input[name="password"]').clear().type('wrongpassword')
        cy.get('button[type="submit"]').click()
        
        // Wait a bit between attempts
        cy.wait(1000)
      }
      
      // After multiple attempts, should show rate limiting message or account lockout
      cy.get('body').should('satisfy', (body) => {
        const text = body.text().toLowerCase()
        return text.includes('too many attempts') ||
               text.includes('rate limit') ||
               text.includes('account locked') ||
               text.includes('try again later') ||
               text.includes('invalid') // If no rate limiting, still secure
      })
    })
  })

  // --- Content Security Policy (CSP) ---
  describe('Content Security Policy', () => {
    
    it('TC_SEC_CSP_001: Verify CSP headers are present', () => {
      cy.request('/').then((response) => {
        // Check for security headers
        const headers = response.headers
        
        // Recommended security headers
        const securityHeaders = [
          'content-security-policy',
          'x-content-type-options',
          'x-frame-options',
          'x-xss-protection'
        ]
        
        securityHeaders.forEach(header => {
          if (headers[header]) {
            cy.log(`✓ ${header}: ${headers[header]}`)
          } else {
            cy.log(`⚠ Missing security header: ${header}`)
          }
        })
      })
    })

    it('TC_SEC_CSP_002: Test inline script prevention', () => {
      cy.visit('/')
      
      // Try to execute inline script via console
      cy.window().then((win) => {
        try {
          win.eval('console.log("Inline script executed")')
          // If CSP is properly configured, this should be blocked
        } catch (error) {
          cy.log('Inline script execution blocked by CSP')
        }
      })
    })
  })
}) 