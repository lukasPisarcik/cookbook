/**
 * Get initials from a name string.
 * Returns up to 2 uppercase characters from the first letters of each word.
 *
 * Splits on runs of whitespace after trimming, so a name typed with a stray
 * double space still yields two letters rather than one plus a blank.
 *
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('Alice') // 'A'
 * getInitials('John Michael Doe') // 'JM'
 */
export function getInitials(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0))
		.join('')
		.toUpperCase();
}
