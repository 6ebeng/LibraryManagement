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
      cy.exec('npm run seed:small --prefix ../server');
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
      cy.exec('npm run seed:large --prefix ../server');
      cy.loginAsLibrarian(librarian.email, librarian.password);
    });

    it('TC_PERF_U_002: should load the book list page within the threshold with many records', () => {
        const startTime = performance.now();
        cy.visit('/books');
        cy.contains('h4', 'Books').should('be.visible');
        cy.get('.MuiCard-root').should('have.length.gt', 50); // a simple check to ensure data is loaded

        cy.wrap(performance.now()).then(endTime => {
            const loadTime = endTime - startTime;
            cy.log(`Book list (many records) load time: ${loadTime.toFixed(2)} ms`);
            expect(loadTime).to.be.lessThan(5000); // Expect load time to be less than 5 seconds
        });
    });
  });

    // Test Case: TC_PERF_UI_003 - UI responsiveness during data entry on a high-load page
    context('UI Responsiveness', () => {
        beforeEach(() => {
            cy.exec('npm run seed:large --prefix ../server');
            cy.loginAsLibrarian(librarian.email, librarian.password);
        });

        it('TC_PERF_UI_003: should remain responsive during data entry on a high-load page', () => {
            cy.visit('/dashboard');
            cy.get('button[aria-label="add"]').should('be.visible').click();
            const startTime = performance.now();
            cy.get('input[name="name"]').type('A new book');
            cy.wrap(performance.now()).then(endTime => {
                const typingTime = endTime - startTime;
                cy.log(`Typing interaction time: ${typingTime.toFixed(2)} ms`);
                expect(typingTime).to.be.lessThan(500);
            });
        });
    });
});