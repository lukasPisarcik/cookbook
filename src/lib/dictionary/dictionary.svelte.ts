import { dictionary } from './dictionary';
import { lang } from './lang.svelte';

/**
 * Reactive dictionary wrapper. `d.<key>` follows `langStore.locale`.
 * Add a `$derived` line here for every key added to `dictionary.ts`.
 */
class ReactiveDictionary {
	toggleTheme = $derived(dictionary.toggleTheme[lang.actual]);
	changeLanguage = $derived(dictionary.changeLanguage[lang.actual]);
	searchLanguage = $derived(dictionary.searchLanguage[lang.actual]);
	noLanguageFound = $derived(dictionary.noLanguageFound[lang.actual]);
	appTitle = $derived(dictionary.appTitle[lang.actual]);
	appDescription = $derived(dictionary.appDescription[lang.actual]);
	errorPageGoHome = $derived(dictionary.errorPageGoHome[lang.actual]);
	errorPageTryAgain = $derived(dictionary.errorPageTryAgain[lang.actual]);
	errorPageContactSupport = $derived(dictionary.errorPageContactSupport[lang.actual]);
	errorPageWhatHappened = $derived(dictionary.errorPageWhatHappened[lang.actual]);
	errorPageWhatToDo = $derived(dictionary.errorPageWhatToDo[lang.actual]);
	errorPageErrorId = $derived(dictionary.errorPageErrorId[lang.actual]);
	errorPageSupportTicket = $derived(dictionary.errorPageSupportTicket[lang.actual]);
	errorPageSupportTicketDescription = $derived(
		dictionary.errorPageSupportTicketDescription[lang.actual]
	);
	errorPageDescribeIssue = $derived(dictionary.errorPageDescribeIssue[lang.actual]);
	errorPageDescribeIssuePlaceholder = $derived(
		dictionary.errorPageDescribeIssuePlaceholder[lang.actual]
	);
	errorPageErrorDetails = $derived(dictionary.errorPageErrorDetails[lang.actual]);
	errorPageSystemInfo = $derived(dictionary.errorPageSystemInfo[lang.actual]);
	errorPageTimestamp = $derived(dictionary.errorPageTimestamp[lang.actual]);
	errorPageSubmitTicket = $derived(dictionary.errorPageSubmitTicket[lang.actual]);
	errorPageAuthTitle = $derived(dictionary.errorPageAuthTitle[lang.actual]);
	errorPageAuthDescription = $derived(dictionary.errorPageAuthDescription[lang.actual]);
	errorPageAuthWhatHappened = $derived(dictionary.errorPageAuthWhatHappened[lang.actual]);
	errorPageAuthWhatToDo = $derived(dictionary.errorPageAuthWhatToDo[lang.actual]);
	errorPageForbiddenTitle = $derived(dictionary.errorPageForbiddenTitle[lang.actual]);
	errorPageForbiddenDescription = $derived(dictionary.errorPageForbiddenDescription[lang.actual]);
	errorPageForbiddenWhatHappened = $derived(dictionary.errorPageForbiddenWhatHappened[lang.actual]);
	errorPageForbiddenWhatToDo = $derived(dictionary.errorPageForbiddenWhatToDo[lang.actual]);
	errorPageNotFoundTitle = $derived(dictionary.errorPageNotFoundTitle[lang.actual]);
	errorPageNotFoundDescription = $derived(dictionary.errorPageNotFoundDescription[lang.actual]);
	errorPageNotFoundWhatHappened = $derived(dictionary.errorPageNotFoundWhatHappened[lang.actual]);
	errorPageNotFoundWhatToDo = $derived(dictionary.errorPageNotFoundWhatToDo[lang.actual]);
	errorPageValidationTitle = $derived(dictionary.errorPageValidationTitle[lang.actual]);
	errorPageValidationDescription = $derived(dictionary.errorPageValidationDescription[lang.actual]);
	errorPageValidationWhatHappened = $derived(
		dictionary.errorPageValidationWhatHappened[lang.actual]
	);
	errorPageValidationWhatToDo = $derived(dictionary.errorPageValidationWhatToDo[lang.actual]);
	errorPageServerTitle = $derived(dictionary.errorPageServerTitle[lang.actual]);
	errorPageServerDescription = $derived(dictionary.errorPageServerDescription[lang.actual]);
	errorPageServerWhatHappened = $derived(dictionary.errorPageServerWhatHappened[lang.actual]);
	errorPageServerWhatToDo = $derived(dictionary.errorPageServerWhatToDo[lang.actual]);
	errorPageUnknownTitle = $derived(dictionary.errorPageUnknownTitle[lang.actual]);
	errorPageUnknownDescription = $derived(dictionary.errorPageUnknownDescription[lang.actual]);
	errorPageUnknownWhatHappened = $derived(dictionary.errorPageUnknownWhatHappened[lang.actual]);
	errorPageUnknownWhatToDo = $derived(dictionary.errorPageUnknownWhatToDo[lang.actual]);
}

export const d = new ReactiveDictionary();
