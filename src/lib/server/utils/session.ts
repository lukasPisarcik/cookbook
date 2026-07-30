import { PrivateEnvValue } from '$lib/server/env.server';

/**
 * Session tokens for the shared-password gate.
 *
 * The token is `HMAC-SHA256(key = APP_PASSWORD, message = payload)` hex-encoded,
 * so every issued session invalidates automatically when the password changes.
 * Appropriate for a single-household shared-secret app — not multi-user auth.
 */

export const SESSION_COOKIE = 'kucharka_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const SESSION_PAYLOAD = 'kucharka-session-v1';

async function hmacHex(key: string, message: string): Promise<string> {
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(key),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
	return Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function createSessionToken(): Promise<string> {
	return hmacHex(PrivateEnvValue('APP_PASSWORD'), SESSION_PAYLOAD);
}

/**
 * Constant-time password check for the login action: both sides are HMACed
 * with a fixed key first, so the comparison length never depends on the
 * candidate and the XOR loop runs over equal-length digests.
 */
export async function isCorrectPassword(candidate: string): Promise<boolean> {
	const [candidateDigest, expectedDigest] = await Promise.all([
		hmacHex(SESSION_PAYLOAD, candidate),
		hmacHex(SESSION_PAYLOAD, PrivateEnvValue('APP_PASSWORD'))
	]);
	let diff = 0;
	for (let i = 0; i < expectedDigest.length; i++) {
		diff |= candidateDigest.charCodeAt(i) ^ expectedDigest.charCodeAt(i);
	}
	return diff === 0;
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
	if (!token) return false;
	const expected = await createSessionToken();
	if (token.length !== expected.length) return false;
	let diff = 0;
	for (let i = 0; i < expected.length; i++) {
		diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return diff === 0;
}
