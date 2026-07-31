import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { LoginInput } from '$lib/schemas';
import { log } from '$lib';
import {
	createSessionToken,
	isCorrectPassword,
	SESSION_COOKIE,
	SESSION_MAX_AGE_SECONDS
} from '$lib/server/utils/session';
import { consumeLoginAttempt, resetLoginAttempts } from '$lib/server/utils/rateLimit';

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		// Rate-limit before checking the password: a shared secret on a public
		// URL is only as strong as the number of guesses an attacker gets.
		const clientAddress = getClientAddress();
		const limit = consumeLoginAttempt(clientAddress);
		if (!limit.allowed) {
			log.warn(
				{ clientAddress, retryAfterSeconds: limit.retryAfterSeconds },
				'Login rate limit reached'
			);
			return fail(429, { incorrect: false, rateLimited: true });
		}

		const formData = await request.formData();
		const parsed = LoginInput.safeParse({ password: formData.get('password') });

		if (!parsed.success || !(await isCorrectPassword(parsed.data.password))) {
			return fail(400, { incorrect: true, rateLimited: false });
		}

		// A correct password clears the budget, so a fumbled attempt followed by
		// the right one never leaves the household throttled.
		resetLoginAttempts(clientAddress);

		cookies.set(SESSION_COOKIE, await createSessionToken(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			// Follow the request protocol: the app is used over plain HTTP on the
			// LAN (phone against the dev box), where a Secure cookie would be dropped.
			secure: url.protocol === 'https:',
			maxAge: SESSION_MAX_AGE_SECONDS
		});

		redirect(303, '/');
	}
};
