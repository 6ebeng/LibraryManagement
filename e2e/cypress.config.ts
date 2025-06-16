import { defineConfig } from 'cypress'

export default defineConfig({
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
    reportTitle: 'mochawesome-report',
    reportFilename: '[status]_[datetime]-report',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    reportDir: 'cypress/data/reports',
    showSkipped: true,
  },
  e2e: {
    watchForFileChanges: true,
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents: async (on, config) => {
      const plugin = await import('cypress-mochawesome-reporter/plugin')
      plugin.default(on)
      on('task', {})
      return config
    },
  },
  retries: {
    runMode: 0,
    openMode: 0,
  },
})
