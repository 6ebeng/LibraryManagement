// File: LibraryManagement/e2e/cypress/support/component.ts

// ***********************************************************
// This example component.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************************

import { mount } from 'cypress/react'
import './commands'

// Augment the Cypress namespace to include type definitions for
// the mount command.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)

// To ensure the file is treated as a module by TypeScript
export {}
