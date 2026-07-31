/**
 * Smoke flow — local-only, expects `bunx convex dev` running with the seed
 * imported and CYPRESS_APP_PASSWORD (defaults to the dev password) matching
 * the app's APP_PASSWORD. Excluded from the default validation gate.
 *
 * Covers the plan's flow: login → search a recipe → open detail →
 * add to Dnes varím → generate Nákup → check an item.
 */

const password = Cypress.env('APP_PASSWORD') ?? 'kucharka-dev';
const profile = Cypress.env('APP_PROFILE') ?? 'Lukáš';

/**
 * Personal state is per profile now, so the „Kto si?" gate stands between the
 * login and the tabs. Seeding localStorage directly is deterministic and keeps
 * the spec about the cooking loop rather than about the prompt.
 */
function useProfile() {
	cy.window().then((win) => {
		win.localStorage.setItem('mnamka_profile', JSON.stringify({ userId: 'lukas', name: profile }));
	});
}

describe('Smoke', () => {
	it('redirects unauthenticated visitors to /login', () => {
		cy.request({ url: '/', followRedirect: false }).then((response) => {
			expect(response.status).to.eq(303);
			expect(response.headers.location).to.contain('/login');
		});
	});

	it('runs the full cooking loop', () => {
		// Login
		cy.visit('/login');
		useProfile();
		cy.get('input[name="password"]').type(password);
		cy.get('button[type="submit"]').click();
		cy.location('pathname', { timeout: 15000 }).should('eq', '/');

		// Search a recipe (diacritic-insensitive)
		cy.get('input[type="search"]', { timeout: 15000 }).type('thajske');
		cy.contains('a', /thajské kari/i, { timeout: 15000 }).click();

		// Detail renders and can be flagged for today (idempotent: flag only
		// when not already flagged from a previous run)
		cy.location('pathname').should('contain', '/recepty/');
		cy.contains('button', /dnes varím|dnes nevarím|cook today|not today/i).then(($button) => {
			if (/dnes varím|cook today/i.test($button.text())) {
				cy.wrap($button).click();
			}
		});

		// Dnes varím lists it and generates the shopping list
		cy.visit('/dnes');
		cy.contains(/thajské kari/i, { timeout: 15000 }).should('be.visible');
		cy.contains('button', /vygenerovať|generate/i).click();

		// Nákup shows the aggregated list; toggle the first item and assert
		// THAT item flipped (state-agnostic, so re-runs stay deterministic)
		cy.location('pathname', { timeout: 15000 }).should('eq', '/nakup');
		cy.get('[data-slot="checkbox"]', { timeout: 15000 })
			.first()
			.then(($box) => {
				const before = $box.attr('data-state');
				const expected = before === 'checked' ? 'unchecked' : 'checked';
				cy.wrap($box).click();
				cy.get('[data-slot="checkbox"]').first().should('have.attr', 'data-state', expected);
			});
	});
});
