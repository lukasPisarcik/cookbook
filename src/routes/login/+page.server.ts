import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { LoginInput } from '$lib/schemas';
import {
	createSessionToken,
	isCorrectPassword,
	SESSION_COOKIE,
	SESSION_MAX_AGE_SECONDS
} from '$lib/server/utils/session';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const parsed = LoginInput.safeParse({ password: formData.get('password') });

		if (!parsed.success || !(await isCorrectPassword(parsed.data.password))) {
			return fail(400, { incorrect: true });
		}

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
