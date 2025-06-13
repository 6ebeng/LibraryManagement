// LibraryManagement/e2e/cypress/e2e/performance.cy.ts

/**
 * E2E Test Cases for Performance Testing
 *
 * These tests are based on the "TC_Performance_Testing.pdf" document.
 */
describe('E2E: Performance Testing', () => {
  // Credentials for a librarian user, loaded from fixtures.
  let librarian: { email?: string; password?: string } = {};

  before(() => {
    // Load user data from fixture for all tests
    cy.fixture('user-data.json').then(data => {
      librarian = data.librarian;
    });
  });

  // Test Case: TC_PERF_UI_001 - Page load time for book list with few records
  context('With a small dataset', () => {
    beforeEach(() => {
      // Seed the database with a small number of books before each test
      cy.exec('npm run seed:small'); // Assumes a script "seed:small" is defined in package.json
      cy.loginAsLibrarian(librarian.email, librarian.password);
    });

    it('TC_PERF_UI_001: should load the book list page quickly with few records', () => {
      const startTime = performance.now();
      cy.visit('/books');
      cy.contains('h4', 'Books').should('be.visible');
      cy.get('.MuiCard-root').should('have.length.at.least', 1);

      cy.wrap(performance.now()).then(endTime => {
        const loadTime = endTime - startTime;
        cy.log(`Book list (few records) load time: ${loadTime.toFixed(2)} ms`);
        expect(loadTime).to.be.lessThan(2000); // Expect load time to be less than 2 seconds
      });
    });
  });

  // Test Case: TC_PERF_U_002 - Page load time for book list with many records
  context('With a large dataset', () => {
    beforeEach(() => {
      // Seed the database with a large number of books
      cy.exec('npm run seed:large'); // Assumes a script "seed:large" is defined in package.json
      cy.loginAsLibrarian(librarian.email, librarian.password);
    });

    it('TC_PERF_U_002: should load the book list page within an acceptable time with many records', () => {
      const startTime = performance.now();
      cy.visit('/books');
      cy.contains('h4', 'Books').should('be.visible');
      // Wait for at least some data to be rendered
      cy.get('.MuiCard-root').should('have.length.at.least', 1);

      cy.wrap(performance.now()).then(endTime => {
        const loadTime = endTime - startTime;
        cy.log(`Book list (many records) load time: ${loadTime.toFixed(2)} ms`);
        expect(loadTime).to.be.lessThan(5000); // Expect load time to be less than 5 seconds
      });
    });
  });

  // Test Case: TC_PERF_API_001 - API response time for fetching all books
  context('API Response Time', () => {
    beforeEach(() => {
      cy.loginAsLibrarian(librarian.email, librarian.password);
    });

    it('TC_PERF_API_001: should have an acceptable API response time for fetching books', () => {
      const startTime = performance.now();
      cy.intercept('GET', '/api/book/getAll').as('getBooks');
      cy.visit('/books');
      cy.wait('@getBooks').then(interception => {
        const duration = interception.response.duration;
        cy.log(`API response time for fetching books: ${duration.toFixed(2)} ms`);
        expect(duration).to.be.lessThan(1000); // Expect API response time to be less than 1 second
      });
    });
  });

  // Test Case: TC_PERF_UI_003 - UI responsiveness during data entry on a high-load page
  context('UI Responsiveness', () => {
    beforeEach(() => {
      // Seed a large dataset to simulate a high-load page
      cy.exec('npm run seed:large');
      cy.loginAsLibrarian(librarian.email, librarian.password);
    });

    it('TC_PERF_UI_003: should remain responsive during data entry on a high-load page', () => {
      cy.visit('/dashboard');
      // Wait for the main dashboard content to be visible
      cy.get('h4', { timeout: 10000 }).contains('Hi, Welcome back').should('be.visible');

      // Attempt to interact with a UI element while the page might still be rendering widgets
      const clickTime = performance.now();
      cy.get('button[aria-label="Open settings"]').click();
      cy.get('.MuiPopover-paper').should('be.visible');

      cy.wrap(performance.now()).then(endTime => {
        const interactionTime = endTime - clickTime;
        cy.log(`UI interaction time: ${interactionTime.toFixed(2)} ms`);
        expect(interactionTime).to.be.lessThan(500); // Expect UI to respond in less than 500ms
      });
    });
  });
});