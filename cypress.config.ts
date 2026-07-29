import { defineConfig } from 'cypress';

export default defineConfig({
	e2e: {
		baseUrl: 'http://localhost:4173',
		supportFile: 'cypress/support/e2e.ts',
		specPattern: 'cypress/e2e/**/*.cy.ts',
		video: false,
		screenshotOnRunFailure: true,
		viewportWidth: 1280,
		viewportHeight: 720,
		defaultCommandTimeout: 10000,
		// Absorbs transient preview-boot flakes in CI; interactive runs
		// (`cypress:open`) never retry so failures surface immediately.
		retries: { runMode: 2, openMode: 0 },
		setupNodeEvents() {
			// Register Cypress tasks here as the app grows.
		}
	}
});
