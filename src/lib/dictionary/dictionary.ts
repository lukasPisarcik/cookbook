import type { MeetingLanguageCode } from '$lib';

type DictionaryEntry = Record<MeetingLanguageCode, string>;

type DictionarySchema = {
	// Theme
	toggleTheme: DictionaryEntry;

	// Language
	changeLanguage: DictionaryEntry;
	searchLanguage: DictionaryEntry;
	noLanguageFound: DictionaryEntry;

	// Home page
	appTitle: DictionaryEntry;
	appDescription: DictionaryEntry;

	// Error page (generic chrome)
	errorPageGoHome: DictionaryEntry;
	errorPageTryAgain: DictionaryEntry;
	errorPageContactSupport: DictionaryEntry;
	errorPageWhatHappened: DictionaryEntry;
	errorPageWhatToDo: DictionaryEntry;
	errorPageErrorId: DictionaryEntry;
	errorPageSupportTicket: DictionaryEntry;
	errorPageSupportTicketDescription: DictionaryEntry;
	errorPageDescribeIssue: DictionaryEntry;
	errorPageDescribeIssuePlaceholder: DictionaryEntry;
	errorPageErrorDetails: DictionaryEntry;
	errorPageSystemInfo: DictionaryEntry;
	errorPageTimestamp: DictionaryEntry;
	errorPageSubmitTicket: DictionaryEntry;

	// Error page status mappings
	errorPageAuthTitle: DictionaryEntry;
	errorPageAuthDescription: DictionaryEntry;
	errorPageAuthWhatHappened: DictionaryEntry;
	errorPageAuthWhatToDo: DictionaryEntry;
	errorPageForbiddenTitle: DictionaryEntry;
	errorPageForbiddenDescription: DictionaryEntry;
	errorPageForbiddenWhatHappened: DictionaryEntry;
	errorPageForbiddenWhatToDo: DictionaryEntry;
	errorPageNotFoundTitle: DictionaryEntry;
	errorPageNotFoundDescription: DictionaryEntry;
	errorPageNotFoundWhatHappened: DictionaryEntry;
	errorPageNotFoundWhatToDo: DictionaryEntry;
	errorPageValidationTitle: DictionaryEntry;
	errorPageValidationDescription: DictionaryEntry;
	errorPageValidationWhatHappened: DictionaryEntry;
	errorPageValidationWhatToDo: DictionaryEntry;
	errorPageServerTitle: DictionaryEntry;
	errorPageServerDescription: DictionaryEntry;
	errorPageServerWhatHappened: DictionaryEntry;
	errorPageServerWhatToDo: DictionaryEntry;
	errorPageUnknownTitle: DictionaryEntry;
	errorPageUnknownDescription: DictionaryEntry;
	errorPageUnknownWhatHappened: DictionaryEntry;
	errorPageUnknownWhatToDo: DictionaryEntry;
};

export const dictionary: DictionarySchema = {
	toggleTheme: { en_us: 'Toggle theme' },
	changeLanguage: { en_us: 'Change language' },
	searchLanguage: { en_us: 'Search language…' },
	noLanguageFound: { en_us: 'No language found' },

	appTitle: { en_us: 'Kuchárka' },
	appDescription: { en_us: 'A personal cookbook.' },

	errorPageGoHome: { en_us: 'Go home' },
	errorPageTryAgain: { en_us: 'Try again' },
	errorPageContactSupport: { en_us: 'Contact support' },
	errorPageWhatHappened: { en_us: 'What happened' },
	errorPageWhatToDo: { en_us: 'What to do' },
	errorPageErrorId: { en_us: 'Error ID' },
	errorPageSupportTicket: { en_us: 'Submit a support ticket' },
	errorPageSupportTicketDescription: {
		en_us: 'Tell us what you were trying to do and we will follow up.'
	},
	errorPageDescribeIssue: { en_us: 'Describe the issue' },
	errorPageDescribeIssuePlaceholder: {
		en_us: 'What were you doing when this happened?'
	},
	errorPageErrorDetails: { en_us: 'Error details' },
	errorPageSystemInfo: { en_us: 'System information' },
	errorPageTimestamp: { en_us: 'Timestamp' },
	errorPageSubmitTicket: { en_us: 'Submit ticket' },

	errorPageAuthTitle: { en_us: 'Sign-in required' },
	errorPageAuthDescription: { en_us: 'You need to sign in to view this page.' },
	errorPageAuthWhatHappened: { en_us: 'Your session expired or you are not signed in.' },
	errorPageAuthWhatToDo: { en_us: 'Sign in again to continue.' },

	errorPageForbiddenTitle: { en_us: 'Forbidden' },
	errorPageForbiddenDescription: { en_us: 'You do not have access to this resource.' },
	errorPageForbiddenWhatHappened: {
		en_us: 'Your account does not have permission for this action.'
	},
	errorPageForbiddenWhatToDo: { en_us: 'Contact support if you believe this is a mistake.' },

	errorPageNotFoundTitle: { en_us: 'Not found' },
	errorPageNotFoundDescription: { en_us: "We couldn't find what you were looking for." },
	errorPageNotFoundWhatHappened: { en_us: 'The page or resource may have moved or been removed.' },
	errorPageNotFoundWhatToDo: { en_us: 'Check the URL or go back home.' },

	errorPageValidationTitle: { en_us: 'Invalid request' },
	errorPageValidationDescription: { en_us: 'The request was rejected because of invalid input.' },
	errorPageValidationWhatHappened: {
		en_us: 'One or more fields did not meet the expected format.'
	},
	errorPageValidationWhatToDo: { en_us: 'Correct the input and try again.' },

	errorPageServerTitle: { en_us: 'Something went wrong' },
	errorPageServerDescription: { en_us: 'The server hit an unexpected error.' },
	errorPageServerWhatHappened: { en_us: 'A backend service failed to handle your request.' },
	errorPageServerWhatToDo: { en_us: 'Retry in a moment, or contact support if it persists.' },

	errorPageUnknownTitle: { en_us: 'Unexpected error' },
	errorPageUnknownDescription: { en_us: 'Something unexpected happened.' },
	errorPageUnknownWhatHappened: { en_us: 'The application encountered an unhandled error.' },
	errorPageUnknownWhatToDo: { en_us: 'Reload the page or contact support.' }
};
