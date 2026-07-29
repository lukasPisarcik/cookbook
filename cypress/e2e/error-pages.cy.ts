/**
 * Error page mapping E2E tests.
 *
 * The app's `+error.svelte` should render appropriate metadata + actions
 * for the HTTP statuses it explicitly handles.
 */

describe('Error page mapping', () => {
	it('renders 404 for an unknown route with a Go Home action', () => {
		cy.visit('/this-route-does-not-exist', { failOnStatusCode: false });

		cy.contains('h1', '404').should('be.visible');
		cy.findByRole('link', { name: /go home/i }).should('be.visible');
	});
});
