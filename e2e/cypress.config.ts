import { defineConfig } from 'cypress'

export default defineConfig({
  watchForFileChanges: true,
  screenshotOnRunFailure: true,
  trashAssetsBeforeRuns: true,
  chromeWebSecurity: false,
  video: true,
  downloadsFolder: 'cypress/data/downloads',
  fixturesFolder: 'cypress/fixtures',
  screenshotsFolder: 'cypress/data/screenshots',
  // videosFolder: 'cypress/data/videos',
  supportFolder: 'cypress/support',
  experimentalModifyObstructiveThirdPartyCode: true,
  experimentalMemoryManagement: true,
  pageLoadTimeout: 60000,
  viewportWidth: 1280,
  viewportHeight: 800,
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    charts: true,
    reportTitle: 'mochawesome-report',
    reportFilename: '[status]_[datetime]-report',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    reportDir: 'cypress/data/reports',
    showSkipped: true,
  },
  e2e: {
    supportFile: 'cypress/support/e2e.ts',

    setupNodeEvents: async (on, config) => {
      const plugin = await import('cypress-mochawesome-reporter/plugin')
      plugin.default(on)
      on('task', {})

      return config
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    supportFile: 'cypress/support/component.ts',
    // This pattern tells Cypress where to find your component tests
    specPattern: '../client/src/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'cypress/support/component-index.html',
  },
  retries: {
    // Retry attempts for `cypress run`
    runMode: 0,
    // Retry attempts for `cypress open`
    openMode: 0,
  },
})