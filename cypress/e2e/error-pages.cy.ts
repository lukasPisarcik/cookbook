/**
 * Error page mapping E2E tests.
 *
 * The app's `+error.svelte` should render appropriate metadata + actions
 * for the HTTP statuses it explicitly handles. The password gate runs
 * first, so the session cookie is obtained before visiting broken routes.
 */

const password = Cypress.env('APP_PASSWORD') ?? 'kucharka-dev';

describe('Error page mapping', () => {
	it('redirects unknown routes to /login when unauthenticated', () => {
		cy.request({ url: '/this-route-does-not-exist', followRedirect: false }).then((response) => {
			expect(response.status).to.eq(303);
			expect(response.headers.location).to.contain('/login');
		});
	});

	it('renders 404 for an unknown route with a Go Home action once authenticated', () => {
		cy.visit('/login');
		cy.get('input[name="password"]').type(password);
		cy.get('button[type="submit"]').click();
		cy.location('pathname').should('eq', '/');

		cy.visit('/this-route-does-not-exist', { failOnStatusCode: false });

		cy.contains('h1', '404').should('be.visible');
		cy.findByRole('link', { name: /domov|go home/i }).should('be.visible');

		// No profile has been chosen in this spec, and error pages deliberately
		// skip the „Kto si?" gate — so the error page must be the error page, not
		// the profile prompt, and the top bar must not sprout one either.
		cy.contains('Kto si?').should('not.exist');
		cy.get('[data-testid="profile-name-input"]').should('not.exist');
	});
});
