import type { LayoutServerLoad } from './$types';
import { PrivateEnvValue } from '$lib/server/env.server';

/**
 * Hands the Convex function token to the client only after the password
 * gate has been passed. Unauthenticated requests (the /login page) get null.
 */
export const load: LayoutServerLoad = ({ locals }) => {
	return {
		authed: locals.authed,
		convexToken: locals.authed ? PrivateEnvValue('APP_TOKEN') : null
	};
};
