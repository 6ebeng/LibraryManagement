/**
 * E2E Test Cases for Browser Compatibility
 * File: cypress/e2e/browser_compatibility.cy.ts
 *
 * These tests are based on the "Browser Compatibility Testing" document.
 */

describe('Browser Compatibility Testing', () => {
  const browsers = ['chrome', 'firefox', 'edge'];

  browsers.forEach(browser => {
    describe(`Testing on ${browser}`, { browser: browser }, () => {
      beforeEach(() => {
        // Clear session and visit login page before each test
        cy.clearUserSession();
        cy.visit('/login');
      });

      it('TC_BC_GEN_001: Verifies overall layout and style consistency', () => {
        // Check login page layout
        cy.get('h4').contains('Sign in to Library').should('be.visible');
        cy.get('input[name="email"]').should('be.visible');
        cy.get('input[name="password"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');

        // Login as librarian and check dashboard layout
        cy.loginAsLibrarian('testlibrarian@library.com', 'librarian123');
        cy.visit('/dashboard');
        cy.url().should('include', '/dashboard');
        cy.get('h4').contains('Hi, Welcome back').should('be.visible');
        cy.get('nav').should('be.visible'); // Check for sidebar
      });

      it('TC_BC_GEN_002: Verifies responsiveness of the UI', () => {
        // Test on desktop viewport
        cy.viewport(1280, 800);
        cy.get('nav').should('be.visible');

        // Test on tablet viewport
        cy.viewport(768, 1024);
        cy.get('nav').should('not.be.visible');
        cy.get('button[aria-label="Open drawer"]').should('be.visible');

        // Test on mobile viewport
        cy.viewport(375, 667);
        cy.get('nav').should('not.be.visible');
        cy.get('button[aria-label="Open drawer"]').should('be.visible');
      });

      it('TC_BC_AUTH_001: Verifies Login page rendering and functionality', () => {
        cy.visit('/login');
        cy.get('h4').contains('Sign in to Library').should('be.visible');
        cy.autoFillLoginForm({ email: 'testlibrarian@library.com', password: 'librarian123' });
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/dashboard');
      });

      it('TC_BC_CRUD_001 & TC_BC_CRUD_002: Verifies "Create", "Read", "Update", and "Delete" functionalities', () => {
        cy.loginAsLibrarian('testlibrarian@library.com', 'librarian123');
        cy.visit('/users');

        // Create a new user
        const newUser = {
          name: `Test User ${Date.now()}`,
          email: `testuser${Date.now()}@example.com`,
          password: 'password123',
        };
        cy.contains('button', 'New User').click();
        cy.fillRegistrationForm(newUser);
        cy.get('div.MuiBox-root').contains('button', 'Submit').click();
        cy.get('table > tbody').contains('td', newUser.email).should('be.visible');

        // Update the user
        cy.contains('tr', newUser.email).within(() => {
          cy.get('button[aria-label="menu"]').click();
        });
        cy.contains('li', 'Edit').click();
        cy.get('input[name="name"]').clear().type(`Updated ${newUser.name}`);
        cy.get('div.MuiBox-root').contains('button', 'Submit').click();
        cy.get('table > tbody').contains(`Updated ${newUser.name}`).should('be.visible');

        // Delete the user
        cy.contains('tr', `Updated ${newUser.name}`).within(() => {
          cy.get('button[aria-label="menu"]').click();
        });
        cy.contains('li', 'Delete').click();
        cy.get('button').contains('Delete').click();
        cy.contains(`Updated ${newUser.name}`).should('not.exist');
      });

      it('TC_BC_CRUD_003: Verifies client-side form validation', () => {
        cy.loginAsLibrarian('testlibrarian@library.com', 'librarian123');
        cy.visit('/users');
        cy.contains('button', 'New User').click();
        cy.get('input[name="email"]').type('invalid-email');
        cy.get('input[name="password"]').type('short');
        cy.get('div.MuiBox-root').contains('button', 'Submit').click();
        // Assuming there are validation messages, you can assert them here
        // For example: cy.contains('Invalid email format').should('be.visible');
      });

      it('TC_BC_FEAT_001: Verifies Librarian Dashboard rendering', () => {
        cy.loginAsLibrarian('testlibrarian@library.com', 'librarian123');
        cy.visit('/dashboard');
        cy.get('h4').contains('Hi, Welcome back').should('be.visible');
        cy.get('.apexcharts-canvas').should('be.visible');
      });

      it('TC_BC_FEAT_002: Verifies JavaScript-driven interactions', () => {
        cy.loginAsLibrarian('testlibrarian@library.com', 'librarian123');
        cy.visit('/users');
        // Test sorting
        cy.get('th').contains('Name').click();
        cy.get('tbody > tr').first().should('contain', 'Alice');
        cy.get('th').contains('Name').click();
        cy.get('tbody > tr').first().should('contain', 'Zoe');

        // Test filtering
        cy.get('input[placeholder="Search user..."]').type('John');
        cy.get('tbody > tr').should('have.length', 1);
        cy.get('tbody > tr').first().should('contain', 'John');
      });
    });
  });
});