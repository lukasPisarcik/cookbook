/**
 * Cryptographic utilities for JWT and session management.
 */

/**
 * Convert a hex-encoded string to a Uint8Array buffer.
 */
export function hexToBuffer(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
}
