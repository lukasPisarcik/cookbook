/**
 * Get initials from a name string.
 * Returns up to 2 uppercase characters from the first letters of each word.
 *
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('Alice') // 'A'
 * getInitials('John Michael Doe') // 'JM'
 */
export function getInitials(name: string): string {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}
