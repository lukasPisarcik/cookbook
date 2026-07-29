/**
 * Smoke tests — narrowest possible whole-stack reachability checks.
 *
 * Add more focused specs alongside this file as the app grows.
 */

describe('Smoke', () => {
	it('serves the SvelteKit app shell over the full stack', () => {
		cy.request('/').then((response) => {
			expect(response.status).to.eq(200);
			expect(response.headers['content-type']).to.contain('text/html');
			expect(response.body).to.contain('__sveltekit_');
		});
	});

	it('renders the home page', () => {
		cy.visit('/');
		cy.findByRole('heading', { level: 1 }).should('be.visible');
	});
});
