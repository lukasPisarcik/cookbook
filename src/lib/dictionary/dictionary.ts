import type { MeetingLanguageCode } from '$lib';

type DictionaryEntry = Record<MeetingLanguageCode, string>;

type DictionarySchema = {
	// Theme
	toggleTheme: DictionaryEntry;

	// Language
	changeLanguage: DictionaryEntry;
	searchLanguage: DictionaryEntry;
	noLanguageFound: DictionaryEntry;

	// App
	appTitle: DictionaryEntry;
	appDescription: DictionaryEntry;
	loading: DictionaryEntry;

	// Login
	loginSubtitle: DictionaryEntry;
	loginPasswordLabel: DictionaryEntry;
	loginSubmit: DictionaryEntry;
	loginIncorrectPassword: DictionaryEntry;

	// Tabs
	tabRecepty: DictionaryEntry;
	tabDnes: DictionaryEntry;
	tabNakup: DictionaryEntry;
	tabSpajza: DictionaryEntry;

	// Categories
	categoryAll: DictionaryEntry;
	categoryRanajky: DictionaryEntry;
	categoryObedy: DictionaryEntry;
	categoryVecere: DictionaryEntry;
	categorySnacky: DictionaryEntry;
	categorySmoothies: DictionaryEntry;
	categoryDrinky: DictionaryEntry;
	categoryDezerty: DictionaryEntry;
	categoryZaklady: DictionaryEntry;

	// Recepty (recipe list)
	searchPlaceholder: DictionaryEntry;
	favoritesOnly: DictionaryEntry;
	emptyRecipes: DictionaryEntry;

	// Recipe detail
	portionsLabel: DictionaryEntry;
	prepTimeLabel: DictionaryEntry;
	minutesShort: DictionaryEntry;
	ingredientsHeading: DictionaryEntry;
	stepsHeading: DictionaryEntry;
	funFactHeading: DictionaryEntry;
	macrosCarbs: DictionaryEntry;
	macrosProtein: DictionaryEntry;
	macrosFat: DictionaryEntry;
	kcalPerPortionLabel: DictionaryEntry;
	favoriteToggle: DictionaryEntry;
	cookingTodayAdd: DictionaryEntry;
	cookingTodayRemove: DictionaryEntry;
	backToList: DictionaryEntry;
	recipeNotFound: DictionaryEntry;

	// Dnes varím
	dnesEmpty: DictionaryEntry;
	dnesEmptyHint: DictionaryEntry;
	dnesGenerate: DictionaryEntry;
	dnesGenerated: DictionaryEntry;
	dnesClearAll: DictionaryEntry;
	removeLabel: DictionaryEntry;
	portionsMultiplierLabel: DictionaryEntry;

	// Nákup
	nakupEmpty: DictionaryEntry;
	nakupDone: DictionaryEntry;
	mamDomaSection: DictionaryEntry;
	buyAnyway: DictionaryEntry;
	buyAnywayUndo: DictionaryEntry;

	// Špajza
	spajzaPlaceholder: DictionaryEntry;
	spajzaAdd: DictionaryEntry;
	spajzaEmpty: DictionaryEntry;

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
	toggleTheme: { sk_sk: 'Prepnúť tému', en_us: 'Toggle theme' },
	changeLanguage: { sk_sk: 'Zmeniť jazyk', en_us: 'Change language' },
	searchLanguage: { sk_sk: 'Hľadať jazyk…', en_us: 'Search language…' },
	noLanguageFound: { sk_sk: 'Jazyk sa nenašiel', en_us: 'No language found' },

	appTitle: { sk_sk: 'Kuchárka', en_us: 'Kuchárka' },
	appDescription: { sk_sk: 'Osobná kuchárka.', en_us: 'A personal cookbook.' },
	loading: { sk_sk: 'Načítava sa…', en_us: 'Loading…' },

	loginSubtitle: {
		sk_sk: 'Zadaj heslo a otvor kuchárku',
		en_us: 'Enter the password to open the cookbook'
	},
	loginPasswordLabel: { sk_sk: 'Heslo', en_us: 'Password' },
	loginSubmit: { sk_sk: 'Odomknúť', en_us: 'Unlock' },
	loginIncorrectPassword: {
		sk_sk: 'Nesprávne heslo, skús znova',
		en_us: 'Incorrect password, try again'
	},

	tabRecepty: { sk_sk: 'Recepty', en_us: 'Recipes' },
	tabDnes: { sk_sk: 'Dnes varím', en_us: 'Today' },
	tabNakup: { sk_sk: 'Nákup', en_us: 'Shopping' },
	tabSpajza: { sk_sk: 'Špajza', en_us: 'Pantry' },

	categoryAll: { sk_sk: 'Všetky', en_us: 'All' },
	categoryRanajky: { sk_sk: 'Raňajky', en_us: 'Breakfast' },
	categoryObedy: { sk_sk: 'Obedy', en_us: 'Lunch' },
	categoryVecere: { sk_sk: 'Večere', en_us: 'Dinner' },
	categorySnacky: { sk_sk: 'Snacky', en_us: 'Snacks' },
	categorySmoothies: { sk_sk: 'Smoothies', en_us: 'Smoothies' },
	categoryDrinky: { sk_sk: 'Letné drinky', en_us: 'Summer drinks' },
	categoryDezerty: { sk_sk: 'Dezerty', en_us: 'Desserts' },
	categoryZaklady: { sk_sk: 'Základy', en_us: 'Basics' },

	searchPlaceholder: { sk_sk: 'Hľadať recept…', en_us: 'Search recipes…' },
	favoritesOnly: { sk_sk: 'Obľúbené', en_us: 'Favorites' },
	emptyRecipes: {
		sk_sk: 'Žiadne recepty nezodpovedajú filtrom.',
		en_us: 'No recipes match the filters.'
	},

	portionsLabel: { sk_sk: 'porcie', en_us: 'portions' },
	prepTimeLabel: { sk_sk: 'príprava', en_us: 'prep time' },
	minutesShort: { sk_sk: 'min', en_us: 'min' },
	ingredientsHeading: { sk_sk: 'Potrebuješ', en_us: 'You need' },
	stepsHeading: { sk_sk: 'Postup', en_us: 'Steps' },
	funFactHeading: { sk_sk: 'Vedela si, že…', en_us: 'Did you know?' },
	macrosCarbs: { sk_sk: 'sacharidy', en_us: 'carbs' },
	macrosProtein: { sk_sk: 'bielkoviny', en_us: 'protein' },
	macrosFat: { sk_sk: 'tuky', en_us: 'fat' },
	kcalPerPortionLabel: { sk_sk: 'kcal / porcia', en_us: 'kcal / portion' },
	favoriteToggle: { sk_sk: 'Obľúbený recept', en_us: 'Favorite recipe' },
	cookingTodayAdd: { sk_sk: 'Dnes varím', en_us: 'Cook today' },
	cookingTodayRemove: { sk_sk: 'Dnes nevarím', en_us: 'Not today' },
	backToList: { sk_sk: 'Späť na recepty', en_us: 'Back to recipes' },
	recipeNotFound: { sk_sk: 'Recept sa nenašiel.', en_us: 'Recipe not found.' },

	dnesEmpty: { sk_sk: 'Zatiaľ nič nevaríš.', en_us: 'Nothing flagged for today yet.' },
	dnesEmptyHint: {
		sk_sk: 'Označ recepty cez „Dnes varím" a tu si z nich vygeneruješ nákupný zoznam.',
		en_us: 'Flag recipes with "Cook today" and generate the shopping list from them here.'
	},
	dnesGenerate: { sk_sk: 'Vygenerovať nákupný zoznam', en_us: 'Generate shopping list' },
	dnesGenerated: { sk_sk: 'Nákupný zoznam je pripravený', en_us: 'Shopping list is ready' },
	dnesClearAll: { sk_sk: 'Vymazať všetko', en_us: 'Clear all' },
	removeLabel: { sk_sk: 'Odstrániť', en_us: 'Remove' },
	portionsMultiplierLabel: { sk_sk: 'porcií ×', en_us: 'portions ×' },

	nakupEmpty: {
		sk_sk: 'Zoznam je prázdny — vygeneruj ho v záložke Dnes varím.',
		en_us: 'The list is empty — generate it from the Today tab.'
	},
	nakupDone: { sk_sk: 'vybavené', en_us: 'done' },
	mamDomaSection: { sk_sk: 'Mám doma', en_us: 'At home' },
	buyAnyway: { sk_sk: 'Kúpim aj tak', en_us: 'Buy anyway' },
	buyAnywayUndo: { sk_sk: 'Predsa netreba', en_us: 'Skip after all' },

	spajzaPlaceholder: { sk_sk: 'Pridať potravinu…', en_us: 'Add an item…' },
	spajzaAdd: { sk_sk: 'Pridať', en_us: 'Add' },
	spajzaEmpty: {
		sk_sk: 'Špajza je prázdna. Pridaj, čo máš doma — nákupný zoznam to preskočí.',
		en_us: 'The pantry is empty. Add what you have at home — the shopping list will skip it.'
	},

	errorPageGoHome: { sk_sk: 'Domov', en_us: 'Go home' },
	errorPageTryAgain: { sk_sk: 'Skúsiť znova', en_us: 'Try again' },
	errorPageContactSupport: { sk_sk: 'Kontaktovať podporu', en_us: 'Contact support' },
	errorPageWhatHappened: { sk_sk: 'Čo sa stalo', en_us: 'What happened' },
	errorPageWhatToDo: { sk_sk: 'Čo s tým', en_us: 'What to do' },
	errorPageErrorId: { sk_sk: 'ID chyby', en_us: 'Error ID' },
	errorPageSupportTicket: { sk_sk: 'Nahlásiť problém', en_us: 'Submit a support ticket' },
	errorPageSupportTicketDescription: {
		sk_sk: 'Napíš, čo si robila, a ozveme sa.',
		en_us: 'Tell us what you were trying to do and we will follow up.'
	},
	errorPageDescribeIssue: { sk_sk: 'Popíš problém', en_us: 'Describe the issue' },
	errorPageDescribeIssuePlaceholder: {
		sk_sk: 'Čo si robila, keď sa to stalo?',
		en_us: 'What were you doing when this happened?'
	},
	errorPageErrorDetails: { sk_sk: 'Detaily chyby', en_us: 'Error details' },
	errorPageSystemInfo: { sk_sk: 'Systémové informácie', en_us: 'System information' },
	errorPageTimestamp: { sk_sk: 'Čas', en_us: 'Timestamp' },
	errorPageSubmitTicket: { sk_sk: 'Odoslať', en_us: 'Submit ticket' },

	errorPageAuthTitle: { sk_sk: 'Vyžaduje sa prihlásenie', en_us: 'Sign-in required' },
	errorPageAuthDescription: {
		sk_sk: 'Na zobrazenie tejto stránky sa musíš prihlásiť.',
		en_us: 'You need to sign in to view this page.'
	},
	errorPageAuthWhatHappened: {
		sk_sk: 'Tvoja relácia vypršala alebo nie si prihlásená.',
		en_us: 'Your session expired or you are not signed in.'
	},
	errorPageAuthWhatToDo: {
		sk_sk: 'Prihlás sa znova a pokračuj.',
		en_us: 'Sign in again to continue.'
	},

	errorPageForbiddenTitle: { sk_sk: 'Prístup zamietnutý', en_us: 'Forbidden' },
	errorPageForbiddenDescription: {
		sk_sk: 'K tomuto obsahu nemáš prístup.',
		en_us: 'You do not have access to this resource.'
	},
	errorPageForbiddenWhatHappened: {
		sk_sk: 'Tvoj účet nemá oprávnenie na túto akciu.',
		en_us: 'Your account does not have permission for this action.'
	},
	errorPageForbiddenWhatToDo: {
		sk_sk: 'Ak si myslíš, že ide o chybu, kontaktuj podporu.',
		en_us: 'Contact support if you believe this is a mistake.'
	},

	errorPageNotFoundTitle: { sk_sk: 'Nenašlo sa', en_us: 'Not found' },
	errorPageNotFoundDescription: {
		sk_sk: 'To, čo hľadáš, sa nepodarilo nájsť.',
		en_us: "We couldn't find what you were looking for."
	},
	errorPageNotFoundWhatHappened: {
		sk_sk: 'Stránka alebo obsah sa presunuli alebo boli odstránené.',
		en_us: 'The page or resource may have moved or been removed.'
	},
	errorPageNotFoundWhatToDo: {
		sk_sk: 'Skontroluj adresu alebo sa vráť domov.',
		en_us: 'Check the URL or go back home.'
	},

	errorPageValidationTitle: { sk_sk: 'Neplatná požiadavka', en_us: 'Invalid request' },
	errorPageValidationDescription: {
		sk_sk: 'Požiadavka bola odmietnutá pre neplatný vstup.',
		en_us: 'The request was rejected because of invalid input.'
	},
	errorPageValidationWhatHappened: {
		sk_sk: 'Jedno alebo viac polí nemá očakávaný formát.',
		en_us: 'One or more fields did not meet the expected format.'
	},
	errorPageValidationWhatToDo: {
		sk_sk: 'Oprav vstup a skús znova.',
		en_us: 'Correct the input and try again.'
	},

	errorPageServerTitle: { sk_sk: 'Niečo sa pokazilo', en_us: 'Something went wrong' },
	errorPageServerDescription: {
		sk_sk: 'Server narazil na neočakávanú chybu.',
		en_us: 'The server hit an unexpected error.'
	},
	errorPageServerWhatHappened: {
		sk_sk: 'Backendová služba nedokázala spracovať požiadavku.',
		en_us: 'A backend service failed to handle your request.'
	},
	errorPageServerWhatToDo: {
		sk_sk: 'Skús to o chvíľu znova.',
		en_us: 'Retry in a moment, or contact support if it persists.'
	},

	errorPageUnknownTitle: { sk_sk: 'Neočakávaná chyba', en_us: 'Unexpected error' },
	errorPageUnknownDescription: {
		sk_sk: 'Stalo sa niečo neočakávané.',
		en_us: 'Something unexpected happened.'
	},
	errorPageUnknownWhatHappened: {
		sk_sk: 'Aplikácia narazila na neošetrenú chybu.',
		en_us: 'The application encountered an unhandled error.'
	},
	errorPageUnknownWhatToDo: {
		sk_sk: 'Obnov stránku.',
		en_us: 'Reload the page or contact support.'
	}
};
