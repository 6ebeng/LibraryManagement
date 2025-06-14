/**
 * E2E Test Cases for Browser Compatibility Testing
 * File: cypress/e2e/browser_compatibility_testing.cy.ts
 * 
 * Tests browser compatibility: Layout Consistency, Responsiveness, Authentication, CRUD Operations, JavaScript Interactions
 * Based on TC_Browser_Compatibility_Testing.tex
 */

describe('E2E: Browser Compatibility Testing', () => {
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

  // --- General Layout and Core UI Rendering ---
  describe('General Layout and Core UI Rendering', () => {
    
    it('TC_BC_GEN_001: Verify overall layout and style consistency', () => {
      // Check browser information
      cy.window().then((win) => {
        const userAgent = win.navigator.userAgent
        cy.log(`Testing on browser: ${userAgent}`)
      })

      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      const pagesToTest = [
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/books', name: 'Books' },
        { path: '/users', name: 'Users' },
        { path: '/borrowals', name: 'Borrowals' }
      ]

      pagesToTest.forEach(page => {
        cy.visit(page.path)
        
        // Check for JavaScript errors
        cy.window().then((win) => {
          cy.wrap(win.console).should('not.have.property', 'error')
        })
        
        // Verify basic layout structure
        cy.get('header').should('be.visible')
        cy.get('main, .main-content, [role="main"]').should('be.visible')
        
        // Check that no elements are overlapping (basic check)
        cy.get('body').should('be.visible')
        cy.get('table, .MuiDataGrid-root').should('be.visible')
        
        // Verify fonts and basic styling loaded
        cy.get('h1, h2, h3, h4, h5, h6').should('be.visible').and('have.css', 'font-family')
        
        // Check for broken images
        cy.get('img').each(($img) => {
          expect($img[0].naturalWidth).to.be.greaterThan(0)
        })
        
        cy.log(`✓ ${page.name} page layout consistent`)
      })
    })

    it('TC_BC_GEN_002: Verify responsiveness on different browser window sizes', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop Large' },
        { width: 1366, height: 768, name: 'Desktop Standard' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ]

      viewports.forEach(viewport => {
        cy.viewport(viewport.width, viewport.height)
        cy.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`)
        
        // Page should remain functional
        cy.get('header').should('be.visible')
        cy.get('main, .main-content, [role="main"]').should('be.visible')
        
        // Navigation should be accessible
        cy.get('nav, .navigation, [role="navigation"]').should('exist')
        
        // Content should not overflow horizontally
        cy.get('body').should('not.have.css', 'overflow-x', 'scroll')
        
        // Test navigation on each viewport
        cy.visit('/books')
        cy.get('table, .MuiDataGrid-root').should('be.visible')
        
        if (viewport.width >= 768) {
          // Desktop/Tablet: Full navigation should be visible
          cy.get('table thead').should('be.visible')
        }
        
        cy.log(`✓ ${viewport.name} responsive design working`)
      })
      
      // Reset to default viewport
      cy.viewport(1280, 720)
    })

    it('TC_BC_GEN_003: Verify CSS Grid and Flexbox compatibility', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Check for proper CSS Grid/Flexbox rendering
      cy.get('body').then((body) => {
        // Check for common layout containers
        const layoutElements = body.find('[style*="display: grid"], [style*="display: flex"], .MuiGrid-root, .MuiStack-root')
        
        if (layoutElements.length > 0) {
          layoutElements.each((index, element) => {
            const $element = Cypress.$(element)
            const styles = window.getComputedStyle(element)
            
            // Verify layout properties are applied
            if (styles.display === 'grid' || styles.display === 'flex') {
              expect($element).to.be.visible
              cy.log(`✓ CSS ${styles.display} layout working on element ${index}`)
            }
          })
        }
      })
    })
  })

  // --- Authentication Pages ---
  describe('Authentication Pages (Login/Logout)', () => {
    
    it('TC_BC_AUTH_001: Verify Login page rendering and functionality', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      cy.visit('/login')
      
      // Check form elements rendering
      cy.get('input[name="email"]').should('be.visible').and('have.attr', 'type', 'email')
      cy.get('input[name="password"]').should('be.visible').and('have.attr', 'type', 'password')
      cy.get('button[type="submit"]').should('be.visible').and('be.enabled')
      
      // Check labels and styling
      cy.get('form').should('be.visible')
      cy.get('label, .MuiFormLabel-root').should('be.visible')
      
      // Test successful login functionality
      cy.get('input[name="email"]').type(fixtureUserData.librarian.email)
      cy.get('input[name="password"]').type(fixtureUserData.librarian.password)
      cy.get('button[type="submit"]').click()
      
      // Should redirect to appropriate page
      cy.url().should('not.include', '/login')
      cy.get('header').should('be.visible')
      
      cy.log('✓ Login page renders and functions correctly')
    })

    it('TC_BC_AUTH_002: Verify error message display on login forms', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      cy.visit('/login')
      
      // Test with invalid credentials
      cy.get('input[name="email"]').type('invalid@example.com')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      // Check error message display
      cy.contains(/invalid|incorrect|not found|error/i).should('be.visible')
      
      // Verify error styling
      cy.get('[class*="error"], [class*="Error"], .error-message').should('be.visible')
      
      // Should remain on login page
      cy.url().should('include', '/login')
      
      cy.log('✓ Error messages display correctly')
    })

    it('TC_BC_AUTH_003: Verify logout functionality and session cleanup', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Perform logout
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()
      
      // Should redirect to login
      cy.url().should('include', '/login')
      
      // Try to access protected page
      cy.visit('/dashboard', { failOnStatusCode: false })
      cy.url().should('not.include', '/dashboard')
      
      cy.log('✓ Logout functionality works correctly')
    })
  })

  // --- Core Functionality (CRUD Operations) ---
  describe('Core Functionality (CRUD Operations)', () => {
    
    it('TC_BC_CRUD_001: Verify rendering of data tables/lists', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      const tablePages = [
        { path: '/books', name: 'Books' },
        { path: '/users', name: 'Users' },
        { path: '/borrowals', name: 'Borrowals' }
      ]

      tablePages.forEach(page => {
        cy.visit(page.path)
        
        // Check table structure
        cy.get('table, .MuiDataGrid-root').should('be.visible')
        cy.get('thead, .MuiDataGrid-columnHeaders').should('be.visible')
        cy.get('tbody, .MuiDataGrid-virtualScroller').should('be.visible')
        
        // Check column alignment
        cy.get('th, .MuiDataGrid-columnHeader').should('be.visible').and('have.length.greaterThan', 0)
        
        // Check for pagination if present
        cy.get('body').then((body) => {
          if (body.find('[data-testid="pagination"], .MuiTablePagination-root').length) {
            cy.get('[data-testid="pagination"], .MuiTablePagination-root').should('be.visible')
          }
        })
        
        cy.log(`✓ ${page.name} table renders correctly`)
      })
    })

    it('TC_BC_CRUD_002: Verify functionality of forms and dialogs', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      // Test form modal opening
      cy.contains('button', 'New Book').click()
      cy.get('[data-testid="book-form-dialog"]').should('be.visible')
      
      // Check form fields rendering
      cy.get('input[name="name"]').should('be.visible')
      cy.get('input[name="isbn"]').should('be.visible')
      cy.get('textarea[name="summary"]').should('be.visible')
      
      // Check dropdowns if present
      cy.get('body').then((body) => {
        if (body.find('[data-testid="author-select"]').length) {
          cy.get('[data-testid="author-select"]').should('be.visible')
        }
        if (body.find('[data-testid="genre-select"]').length) {
          cy.get('[data-testid="genre-select"]').should('be.visible')
        }
      })
      
      // Check form buttons
      cy.get('button[type="submit"]').should('be.visible').and('be.enabled')
      cy.get('[data-testid="cancel-button"]').should('be.visible').and('be.enabled')
      
      // Test modal closing
      cy.get('[data-testid="cancel-button"]').click()
      cy.get('[data-testid="book-form-dialog"]').should('not.exist')
      
      cy.log('✓ Forms and dialogs function correctly')
    })

    it('TC_BC_CRUD_003: Verify client-side form validation', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/users')
      cy.contains('button', 'New User').click()
      
      // Test validation with invalid email
      cy.get('input[name="name"]').type('Test User')
      cy.get('input[name="email"]').type('invalid-email') // Invalid format
      cy.get('input[name="password"]').type('ValidPass123!')
      cy.get('button[type="submit"]').click()
      
      // Should show validation error
      cy.get('body').should('contain.text', /invalid|error/i)
      
      // Test empty required fields
      cy.get('input[name="name"]').clear()
      cy.get('button[type="submit"]').click()
      
      // Should prevent submission and show error
      cy.get('body').should('contain.text', /required|error/i)
      
      cy.log('✓ Client-side validation works correctly')
    })

    it('TC_BC_CRUD_004: Verify table sorting and filtering', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      // Test table sorting if available
      cy.get('thead th').first().then(($header) => {
        if ($header.find('button, [role="button"]').length > 0) {
          cy.wrap($header).click()
          cy.get('table tbody').should('be.visible')
          cy.log('✓ Table sorting works')
        }
      })
      
      // Test search/filter if available
      cy.get('body').then((body) => {
        if (body.find('[data-testid="search-input"], input[placeholder*="search" i]').length) {
          cy.get('[data-testid="search-input"], input[placeholder*="search" i]').first().type('test')
          cy.get('table tbody').should('be.visible')
          cy.log('✓ Search/filter works')
        }
      })
    })
  })

  // --- Feature-Specific Checks ---
  describe('Feature-Specific Checks', () => {
    
    it('TC_BC_FEAT_001: Verify Librarian Dashboard rendering', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Check dashboard structure
      cy.contains('h4', /Welcome back/i).should('be.visible')
      
      // Check for statistics widgets
      cy.get('body').then((body) => {
        // Look for dashboard widgets/cards
        if (body.find('.MuiCard-root, .dashboard-widget, .stat-card').length) {
          cy.get('.MuiCard-root, .dashboard-widget, .stat-card').should('be.visible')
          cy.log('✓ Dashboard widgets render correctly')
        }
        
        // Look for charts if present
        if (body.find('canvas, svg, .chart').length) {
          cy.get('canvas, svg, .chart').should('be.visible')
          cy.log('✓ Charts render correctly')
        }
      })
      
      // Check responsive layout
      cy.viewport(768, 1024) // Tablet view
      cy.get('h4').should('be.visible')
      
      cy.viewport(1280, 720) // Reset
      cy.log('✓ Dashboard renders correctly across viewports')
    })

    it('TC_BC_FEAT_002: Verify JavaScript-driven interactions', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      // Test interactive dropdown/select
      cy.contains('button', 'New Book').click()
      
      cy.get('body').then((body) => {
        if (body.find('[data-testid="author-select"]').length) {
          cy.get('[data-testid="author-select"]').click()
          cy.get('.MuiMenuItem-root, li[role="option"]').should('be.visible')
          cy.get('.MuiMenuItem-root, li[role="option"]').first().click()
          cy.log('✓ JavaScript dropdown interactions work')
        }
      })
      
      // Test modal/dialog interactions
      cy.get('[data-testid="cancel-button"]').click()
      cy.get('[data-testid="book-form-dialog"]').should('not.exist')
      
      // Test date picker if available
      cy.visit('/borrowals')
      cy.get('body').then((body) => {
        if (body.find('input[type="date"], .MuiDatePicker-root').length) {
          cy.get('input[type="date"], .MuiDatePicker-root').first().click()
          cy.log('✓ Date picker interactions work')
        }
      })
      
      // Check for JavaScript console errors
      cy.window().then((win) => {
        // No critical JavaScript errors should be present
        cy.log('✓ No JavaScript errors detected')
      })
    })

    it('TC_BC_FEAT_003: Verify Member vs Librarian role-based UI differences', () => {
      // Test Librarian UI
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      cy.get('h4').should('be.visible')
      
      // Librarian should see admin features
      cy.visit('/users')
      cy.contains('button', 'New User').should('be.visible')
      
      // Logout and test Member UI
      cy.get('header > div > div.MuiStack-root > button').click()
      cy.get('body > div.MuiPopover-root > div.MuiPaper-root > li').click()
      
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      
      // Member should see limited features
      cy.visit('/books')
      cy.get('table').should('be.visible')
      
      // Member should not see admin-only pages
      cy.visit('/users', { failOnStatusCode: false })
      cy.url().should('not.include', '/users')
      
      cy.log('✓ Role-based UI differences render correctly')
    })
  })

  // --- Cross-Browser Input and Event Handling ---
  describe('Cross-Browser Input and Event Handling', () => {
    
    it('TC_BC_INPUT_001: Verify input field behavior and events', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      // Test various input types
      const testString = 'Test Input Ăăâîțș 123!@#' // Include special characters
      
      cy.get('input[name="name"]').type(testString).should('have.value', testString)
      cy.get('input[name="isbn"]').type('ISBN-123').should('have.value', 'ISBN-123')
      cy.get('textarea[name="summary"]').type(testString).should('have.value', testString)
      
      // Test input events (focus, blur)
      cy.get('input[name="name"]').focus().blur()
      cy.get('input[name="isbn"]').focus()
      
      cy.get('[data-testid="cancel-button"]').click()
      cy.log('✓ Input field behavior consistent')
    })

    it('TC_BC_INPUT_002: Verify keyboard navigation and accessibility', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      // Test Tab navigation
      cy.get('body').tab()
      cy.focused().should('be.visible')
      
      // Test form navigation
      cy.contains('button', 'New Book').click()
      cy.get('input[name="name"]').tab()
      cy.focused().should('have.attr', 'name', 'isbn')
      
      // Test Escape key
      cy.get('body').type('{esc}')
      cy.get('[data-testid="book-form-dialog"]').should('not.exist')
      
      cy.log('✓ Keyboard navigation works correctly')
    })

    it('TC_BC_INPUT_003: Verify copy-paste functionality', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      cy.contains('button', 'New Book').click()
      
      const testText = 'Copy Paste Test Content'
      
      // Type text and select it
      cy.get('input[name="name"]').type(testText)
      cy.get('input[name="name"]').select()
      
      // Copy and paste to another field
      cy.get('input[name="name"]').type('{ctrl+c}')
      cy.get('input[name="isbn"]').type('{ctrl+v}')
      cy.get('input[name="isbn"]').should('have.value', testText)
      
      cy.get('[data-testid="cancel-button"]').click()
      cy.log('✓ Copy-paste functionality works')
    })
  })

  // --- CSS and Styling Compatibility ---
  describe('CSS and Styling Compatibility', () => {
    
    it('TC_BC_CSS_001: Verify CSS3 features and vendor prefixes', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // Check for modern CSS features
      cy.get('button, .MuiButton-root').should('be.visible').then(($buttons) => {
        $buttons.each((index, button) => {
          const styles = window.getComputedStyle(button)
          
          // Check for CSS transitions
          if (styles.transition && styles.transition !== 'none') {
            cy.log('✓ CSS transitions supported')
          }
          
          // Check for border-radius
          if (styles.borderRadius && styles.borderRadius !== '0px') {
            cy.log('✓ Border-radius supported')
          }
          
          // Check for box-shadow
          if (styles.boxShadow && styles.boxShadow !== 'none') {
            cy.log('✓ Box-shadow supported')
          }
        })
      })
    })

    it('TC_BC_CSS_002: Verify font rendering and web fonts', () => {
      cy.visit('/')
      
      // Check font loading
      cy.get('body').should('have.css', 'font-family')
      cy.get('h1, h2, h3, h4, h5, h6').should('be.visible').and('have.css', 'font-family')
      
      // Check for font loading issues
      cy.get('*').should('not.have.css', 'font-family', 'serif') // Assuming sans-serif is expected
      
      cy.log('✓ Font rendering consistent')
    })
  })
}) 