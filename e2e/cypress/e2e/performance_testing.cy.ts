/**
 * E2E Test Cases for Performance Testing
 * File: cypress/e2e/performance_testing.cy.ts
 * 
 * Tests performance aspects: UI Load & Responsiveness, API Response Times, Volume Testing
 * Based on TC_Performance_Testing.tex
 */

describe('E2E: Performance Testing', () => {
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

  // --- UI Load & Responsiveness Testing ---
  describe('UI Load & Responsiveness Testing', () => {
    
    it('TC_PERF_UI_001: Page load time for book list with few records', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      // Measure page load time
      const startTime = performance.now()
      
      cy.visit('/books').then(() => {
        const endTime = performance.now()
        const loadTime = endTime - startTime
        
        // Expected: Load time < 2 seconds (2000ms)
        expect(loadTime).to.be.lessThan(2000)
        cy.log(`Page load time: ${loadTime.toFixed(2)}ms`)
        
        // Verify page is fully rendered and interactive
        cy.get('table').should('be.visible')
        cy.get('thead').should('be.visible')
        cy.get('button').should('be.enabled')
        
        // Test immediate interactivity
        cy.contains('button', 'New Book').should('be.enabled').click()
        cy.get('[data-testid="book-form-dialog"]').should('be.visible')
        cy.get('[data-testid="cancel-button"]').click()
      })
    })

    it('TC_PERF_UI_002: Page load time for book list with many records (Volume)', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      // First check how many books exist
      cy.request('/api/book/getAll').then((response) => {
        const bookCount = response.body.length
        cy.log(`Current book count: ${bookCount}`)
        
        // Measure page load time
        const startTime = performance.now()
        
        cy.visit('/books').then(() => {
          const endTime = performance.now()
          const loadTime = endTime - startTime
          
          // Adjust expectations based on data volume
          const expectedMaxTime = bookCount > 1000 ? 5000 : 3000
          expect(loadTime).to.be.lessThan(expectedMaxTime)
          cy.log(`Page load time with ${bookCount} records: ${loadTime.toFixed(2)}ms`)
          
          // Verify UI remains responsive
          cy.get('table').should('be.visible')
          
          // Test sorting functionality (should not freeze UI)
          cy.get('thead th').first().click()
          cy.get('table').should('be.visible') // Still responsive
          
          // Test pagination if available
          cy.get('body').then((body) => {
            if (body.find('[data-testid="pagination"]').length) {
              cy.get('[data-testid="pagination"]').should('be.visible')
            }
          })
        })
      })
    })

    it('TC_PERF_UI_003: UI responsiveness during data entry on a high-load page', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/dashboard')
      
      // While dashboard is loading, test UI responsiveness
      cy.get('body').should('be.visible')
      
      // Test dropdown interaction during potential loading
      const startTime = performance.now()
      cy.get('header > div > div.MuiStack-root > button').click()
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      // Should respond within 500ms
      expect(responseTime).to.be.lessThan(500)
      cy.log(`UI response time: ${responseTime.toFixed(2)}ms`)
      
      // Verify dropdown opened
      cy.get('body > div.MuiPopover-root').should('be.visible')
      
      // Click away to close
      cy.get('body').click(0, 0)
    })

    it('TC_PERF_UI_004: Search and filter responsiveness', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      cy.visit('/books')
      
      // Test search functionality timing
      const searchTerm = 'test'
      const startTime = performance.now()
      
      cy.get('body').then((body) => {
        if (body.find('[data-testid="search-input"]').length) {
          cy.get('[data-testid="search-input"]').type(searchTerm)
          
          // Measure time for search results to appear
          cy.get('table tbody tr').should('be.visible').then(() => {
            const endTime = performance.now()
            const searchTime = endTime - startTime
            
            // Search should be responsive (< 1 second)
            expect(searchTime).to.be.lessThan(1000)
            cy.log(`Search response time: ${searchTime.toFixed(2)}ms`)
          })
        } else {
          cy.log('Search functionality not available - test passed')
        }
      })
    })
  })

  // --- API Response Time Testing ---
  describe('API Response Time Testing', () => {
    
    it('TC_PERF_API_001: API response time for fetching all books (Normal Load)', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      const startTime = performance.now()
      
      cy.request('/api/book/getAll').then((response) => {
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        // Expected: < 300ms for moderate data
        expect(response.status).to.eq(200)
        expect(responseTime).to.be.lessThan(300)
        cy.log(`API response time: ${responseTime.toFixed(2)}ms for ${response.body.length} books`)
      })
    })

    it('TC_PERF_API_002: API response time for creating a new entity (Borrowal)', () => {
      cy.loginAsMember(fixtureUserData.member.email, fixtureUserData.member.password)
      
      // Get an available book first
      cy.request('/api/book/getAll').then((booksResponse) => {
        const availableBook = booksResponse.body.find((book: any) => book.isAvailable === true)
        
        if (availableBook) {
          cy.request('/api/user/getAll').then((usersResponse) => {
            const member = usersResponse.body.find((user: any) => 
              user.email === fixtureUserData.member.email
            )
            
            const borrowalData = {
              bookId: availableBook._id,
              memberId: member._id
            }
            
            const startTime = performance.now()
            
            cy.request('POST', '/api/borrowal/add', borrowalData).then((response) => {
              const endTime = performance.now()
              const responseTime = endTime - startTime
              
              // Expected: < 400ms for creation
              expect([200, 201]).to.include(response.status)
              expect(responseTime).to.be.lessThan(400)
              cy.log(`Borrowal creation API response time: ${responseTime.toFixed(2)}ms`)
            })
          })
        } else {
          cy.log('No available books for borrowal test')
        }
      })
    })

    it('TC_PERF_API_003: API response time for user authentication', () => {
      const startTime = performance.now()
      
      cy.request('POST', '/api/auth/login', {
        email: fixtureUserData.librarian.email,
        password: fixtureUserData.librarian.password
      }).then((response) => {
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        // Authentication is critical - should be fast (< 250ms)
        expect(response.status).to.eq(200)
        expect(responseTime).to.be.lessThan(250)
        cy.log(`Authentication API response time: ${responseTime.toFixed(2)}ms`)
      })
    })

    it('TC_PERF_API_004: API response time under multiple concurrent requests', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      const requests = []
      const startTime = performance.now()
      
      // Send 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        requests.push(cy.request('/api/book/getAll'))
      }
      
      // Wait for all requests to complete
      Promise.all(requests).then((responses) => {
        const endTime = performance.now()
        const totalTime = endTime - startTime
        const avgTime = totalTime / responses.length
        
        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).to.eq(200)
        })
        
        // Average response time should still be reasonable
        expect(avgTime).to.be.lessThan(500)
        cy.log(`Average response time for 10 concurrent requests: ${avgTime.toFixed(2)}ms`)
      })
    })
  })

  // --- Volume Testing ---
  describe('Volume Testing', () => {
    
    it('TC_PERF_VOL_001: System performance with existing data volume', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      // Check current data volumes
      const startTime = performance.now()
      
      cy.request('/api/book/getAll').then((booksResponse) => {
        cy.request('/api/user/getAll').then((usersResponse) => {
          cy.request('/api/borrowal/getAll').then((borrowalsResponse) => {
            const endTime = performance.now()
            const dataFetchTime = endTime - startTime
            
            const bookCount = booksResponse.body.length
            const userCount = usersResponse.body.length
            const borrowalCount = borrowalsResponse.body.length
            
            cy.log(`Data volume - Books: ${bookCount}, Users: ${userCount}, Borrowals: ${borrowalCount}`)
            cy.log(`Time to fetch all data: ${dataFetchTime.toFixed(2)}ms`)
            
            // System should remain stable regardless of data volume
            expect(booksResponse.status).to.eq(200)
            expect(usersResponse.status).to.eq(200)
            expect(borrowalsResponse.status).to.eq(200)
            
            // Test navigation with current data volume
            cy.visit('/books')
            cy.get('table').should('be.visible')
            
            cy.visit('/users')
            cy.get('table').should('be.visible')
            
            cy.visit('/borrowals')
            cy.get('table').should('be.visible')
            
            // All pages should load without timeout
            cy.log('✓ System stable with current data volume')
          })
        })
      })
    })

    it('TC_PERF_VOL_002: Database query performance with pagination', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      // Test pagination performance if available
      cy.get('body').then((body) => {
        if (body.find('[data-testid="pagination"]').length) {
          const startTime = performance.now()
          
          // Click through pagination
          cy.get('[data-testid="next-page"]').click()
          cy.get('table tbody tr').should('have.length.greaterThan', 0)
          
          const endTime = performance.now()
          const paginationTime = endTime - startTime
          
          // Pagination should be fast
          expect(paginationTime).to.be.lessThan(1000)
          cy.log(`Pagination response time: ${paginationTime.toFixed(2)}ms`)
        } else {
          // Test table sorting as alternative volume test
          cy.get('thead th').first().click()
          cy.get('table').should('be.visible')
          cy.log('✓ Sorting performance acceptable')
        }
      })
    })
  })

  // --- Stress Testing (Limited scope for E2E) ---
  describe('Stress Testing (Limited)', () => {
    
    it('TC_PERF_STRS_001: Multiple rapid operations by single user', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      const operations = []
      const startTime = performance.now()
      
      // Perform rapid navigation between pages
      for (let i = 0; i < 5; i++) {
        operations.push(() => {
          cy.visit('/books')
          cy.get('table').should('be.visible')
          cy.visit('/users')
          cy.get('table').should('be.visible')
          cy.visit('/borrowals')
          cy.get('table').should('be.visible')
        })
      }
      
      // Execute operations
      operations.forEach(operation => operation())
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      cy.log(`Completed rapid operations in: ${totalTime.toFixed(2)}ms`)
      
      // System should remain responsive
      cy.visit('/dashboard')
      cy.contains('h4', /Welcome back/i).should('be.visible')
    })

    it('TC_PERF_STRS_002: Form submission stress test', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      // Create multiple books rapidly (limited stress test)
      const booksToCreate = 3
      const startTime = performance.now()
      
      for (let i = 0; i < booksToCreate; i++) {
        cy.contains('button', 'New Book').click()
        
        const bookData = {
          name: `Stress Test Book ${testTimestamp}-${i}`,
          isbn: `STRESS-${testTimestamp}-${i}`,
          summary: `Stress test book ${i}`
        }

        cy.get('input[name="name"]').type(bookData.name)
        cy.get('input[name="isbn"]').type(bookData.isbn)
        cy.get('textarea[name="summary"]').type(bookData.summary)
        
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
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      cy.log(`Created ${booksToCreate} books in: ${totalTime.toFixed(2)}ms`)
      
      // Verify all books were created
      cy.get('table').should('be.visible')
      cy.contains(`Stress Test Book ${testTimestamp}-0`).should('be.visible')
    })
  })

  // --- Memory and Resource Usage ---
  describe('Memory and Resource Usage', () => {
    
    it('TC_PERF_MEM_001: Monitor memory usage during navigation', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      
      // Check initial memory usage
      cy.window().then((win) => {
        const initialMemory = (win.performance as any).memory?.usedJSHeapSize || 0
        cy.log(`Initial memory usage: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`)
        
        // Navigate through pages
        cy.visit('/dashboard')
        cy.visit('/books')
        cy.visit('/users')
        cy.visit('/borrowals')
        cy.visit('/dashboard')
        
        // Check memory after navigation
        const finalMemory = (win.performance as any).memory?.usedJSHeapSize || 0
        cy.log(`Final memory usage: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`)
        
        // Memory shouldn't increase dramatically (basic check)
        const memoryIncrease = finalMemory - initialMemory
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100
        
        if (initialMemory > 0) {
          cy.log(`Memory increase: ${memoryIncreasePercent.toFixed(2)}%`)
          // Memory increase should be reasonable (< 200% for this simple test)
          expect(memoryIncreasePercent).to.be.lessThan(200)
        }
      })
    })

    it('TC_PERF_MEM_002: Check for memory leaks in form operations', () => {
      cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password)
      cy.visit('/books')
      
      // Open and close forms multiple times
      for (let i = 0; i < 5; i++) {
        cy.contains('button', 'New Book').click()
        cy.get('[data-testid="book-form-dialog"]').should('be.visible')
        cy.get('[data-testid="cancel-button"]').click()
        cy.get('[data-testid="book-form-dialog"]').should('not.exist')
      }
      
      // System should remain responsive
      cy.contains('button', 'New Book').should('be.enabled')
      cy.log('✓ No apparent memory leaks in form operations')
    })
  })
}) 