/**
 * E2E Test Case for Full Lifecycle Workflow
 * File: cypress/e2e/full_lifecycle.cy.ts
 *
 * This test case covers the full lifecycle from entity creation to borrowal
 * as described in TC_INT_001 of the Integration Testing document.
 */

describe('E2E: Full Lifecycle - From Entity Creation to Borrowal', () => {
  const testTimestamp: number = Date.now();
  let fixtureUserData;

  before(() => {
    // Load user data from fixture
    cy.fixture('user-data.json').then(data => {
      fixtureUserData = data;
    });
    // Seed the database with a small number of books before the test
    cy.exec('npm run seed:small --prefix ../server');
  });

  it('TC_INT_001: should allow a librarian to create entities and a member to borrow a book', () => {
    // **Librarian Actions**
    cy.loginAsLibrarian(fixtureUserData.librarian.email, fixtureUserData.librarian.password);

    // Create a new Author
    cy.visit('/authors');
    cy.contains('button', 'New Author').click();
    const authorName = `J.R.R. Tolkien ${testTimestamp}`;
    cy.get('input[name="name"]').type(authorName);
    cy.get('button[type="submit"]').click();
    cy.contains(authorName).should('be.visible');

    // Create a new Genre
    cy.visit('/genres');
    cy.contains('button', 'New Genre').click();
    const genreName = `Fantasy ${testTimestamp}`;
    cy.get('input[name="name"]').type(genreName);
    cy.get('button[type="submit"]').click();
    cy.contains(genreName).should('be.visible');

    // Create a new Book
    cy.visit('/books');
    cy.contains('button', 'New Book').click();
    const bookName = `The Hobbit ${testTimestamp}`;
    cy.get('input[name="name"]').type(bookName);
    cy.get('input[name="isbn"]').type(`0-395-07122-4-${testTimestamp}`);
    cy.get('#author-select').click();
    cy.contains('li', authorName).click();
    cy.get('#genre-select').click();
    cy.contains('li', genreName).click();
    cy.get('button[type="submit"]').click();
    cy.contains(bookName).should('be.visible');

    // Register a new Member
    cy.visit('/users');
    const newMember = {
      name: `Member1 ${testTimestamp}`,
      email: `member1_${testTimestamp}@example.com`,
      password: 'password123!',
      isAdmin: false,
    };
    cy.contains('button', 'New User').click();
    cy.fillRegistrationForm(newMember);
    cy.get('button[type="submit"]').click();
    cy.contains(newMember.name).should('be.visible');

    // Logout
    cy.logout();

    // **Member Actions**
    cy.loginAsMember(newMember.email, newMember.password);

    // Borrow the book
    cy.visit('/books');
    cy.contains(bookName).parents('.MuiPaper-root').within(() => {
      cy.contains('button', 'Borrow').click();
    });
    cy.contains('button', 'Confirm').click();

    // Verify borrowal
    cy.visit('/borrowals');
    cy.contains(bookName).should('be.visible');
  });
});