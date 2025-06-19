import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: '4qctqy',
  screenshotOnRunFailure: true,
  trashAssetsBeforeRuns: true,
  chromeWebSecurity: false,
  video: true,
  downloadsFolder: 'cypress/data/downloads',
  fixturesFolder: 'cypress/fixtures',
  screenshotsFolder: 'cypress/data/screenshots',
  supportFolder: 'cypress/support',
  pageLoadTimeout: 60000,
  viewportWidth: 1280,
  viewportHeight: 800,
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    charts: true,
    reportTitle: 'Library Management System - Cypress Test Report',
    reportFilename: 'report-[status]-[datetime]',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    reportDir: 'cypress/data/reports',
    autoOpen: false,
    showSkipped: true,
    timestamp: 'dd_MM_yyyy_HH_mm',
    ignoreVideos: false,
    html: true,
    json: true,
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    watchForFileChanges: true,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    excludeSpecPattern: [
      '**/examples/*',
      '**/__snapshots__/*',
      '**/__image_snapshots__/*',
    ],
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents: async (on, config) => {
      const plugin = await import('cypress-mochawesome-reporter/plugin')
      plugin.default(on)
      on('task', {})
      return config
    },
    retries: {
      runMode: 0,
      openMode: 0,
    },
  },
})
