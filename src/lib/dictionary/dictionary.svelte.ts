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
	loading = $derived(dictionary.loading[lang.actual]);
	loginSubtitle = $derived(dictionary.loginSubtitle[lang.actual]);
	loginPasswordLabel = $derived(dictionary.loginPasswordLabel[lang.actual]);
	loginSubmit = $derived(dictionary.loginSubmit[lang.actual]);
	loginIncorrectPassword = $derived(dictionary.loginIncorrectPassword[lang.actual]);
	loginTooManyAttempts = $derived(dictionary.loginTooManyAttempts[lang.actual]);
	tabRecepty = $derived(dictionary.tabRecepty[lang.actual]);
	tabDnes = $derived(dictionary.tabDnes[lang.actual]);
	tabNakup = $derived(dictionary.tabNakup[lang.actual]);
	tabSpajza = $derived(dictionary.tabSpajza[lang.actual]);
	categoryAll = $derived(dictionary.categoryAll[lang.actual]);
	categoryRanajky = $derived(dictionary.categoryRanajky[lang.actual]);
	categoryObedy = $derived(dictionary.categoryObedy[lang.actual]);
	categoryVecere = $derived(dictionary.categoryVecere[lang.actual]);
	categorySnacky = $derived(dictionary.categorySnacky[lang.actual]);
	categorySmoothies = $derived(dictionary.categorySmoothies[lang.actual]);
	categoryDrinky = $derived(dictionary.categoryDrinky[lang.actual]);
	categoryDezerty = $derived(dictionary.categoryDezerty[lang.actual]);
	categoryZaklady = $derived(dictionary.categoryZaklady[lang.actual]);
	searchPlaceholder = $derived(dictionary.searchPlaceholder[lang.actual]);
	favoritesOnly = $derived(dictionary.favoritesOnly[lang.actual]);
	emptyRecipes = $derived(dictionary.emptyRecipes[lang.actual]);
	portionsLabel = $derived(dictionary.portionsLabel[lang.actual]);
	prepTimeLabel = $derived(dictionary.prepTimeLabel[lang.actual]);
	minutesShort = $derived(dictionary.minutesShort[lang.actual]);
	ingredientsHeading = $derived(dictionary.ingredientsHeading[lang.actual]);
	stepsHeading = $derived(dictionary.stepsHeading[lang.actual]);
	funFactHeading = $derived(dictionary.funFactHeading[lang.actual]);
	macrosCarbs = $derived(dictionary.macrosCarbs[lang.actual]);
	macrosProtein = $derived(dictionary.macrosProtein[lang.actual]);
	macrosFat = $derived(dictionary.macrosFat[lang.actual]);
	kcalPerPortionLabel = $derived(dictionary.kcalPerPortionLabel[lang.actual]);
	favoriteToggle = $derived(dictionary.favoriteToggle[lang.actual]);
	cookingTodayAdd = $derived(dictionary.cookingTodayAdd[lang.actual]);
	cookingTodayRemove = $derived(dictionary.cookingTodayRemove[lang.actual]);
	backToList = $derived(dictionary.backToList[lang.actual]);
	recipeNotFound = $derived(dictionary.recipeNotFound[lang.actual]);
	dnesEmpty = $derived(dictionary.dnesEmpty[lang.actual]);
	dnesEmptyHint = $derived(dictionary.dnesEmptyHint[lang.actual]);
	dnesGenerate = $derived(dictionary.dnesGenerate[lang.actual]);
	dnesGenerated = $derived(dictionary.dnesGenerated[lang.actual]);
	dnesClearAll = $derived(dictionary.dnesClearAll[lang.actual]);
	removeLabel = $derived(dictionary.removeLabel[lang.actual]);
	portionsMultiplierLabel = $derived(dictionary.portionsMultiplierLabel[lang.actual]);
	nakupEmpty = $derived(dictionary.nakupEmpty[lang.actual]);
	nakupDone = $derived(dictionary.nakupDone[lang.actual]);
	mamDomaSection = $derived(dictionary.mamDomaSection[lang.actual]);
	buyAnyway = $derived(dictionary.buyAnyway[lang.actual]);
	buyAnywayUndo = $derived(dictionary.buyAnywayUndo[lang.actual]);
	spajzaPlaceholder = $derived(dictionary.spajzaPlaceholder[lang.actual]);
	spajzaAdd = $derived(dictionary.spajzaAdd[lang.actual]);
	spajzaEmpty = $derived(dictionary.spajzaEmpty[lang.actual]);
	spajzaMamDoma = $derived(dictionary.spajzaMamDoma[lang.actual]);
	spajzaFrequent = $derived(dictionary.spajzaFrequent[lang.actual]);
	spajzaFrequentHint = $derived(dictionary.spajzaFrequentHint[lang.actual]);
	spajzaSearchResults = $derived(dictionary.spajzaSearchResults[lang.actual]);
	spajzaRemoved = $derived(dictionary.spajzaRemoved[lang.actual]);
	spajzaUndo = $derived(dictionary.spajzaUndo[lang.actual]);
	spajzaAlreadyOwned = $derived(dictionary.spajzaAlreadyOwned[lang.actual]);
	profileWhoAreYou = $derived(dictionary.profileWhoAreYou[lang.actual]);
	profileHint = $derived(dictionary.profileHint[lang.actual]);
	profileNamePlaceholder = $derived(dictionary.profileNamePlaceholder[lang.actual]);
	profileContinue = $derived(dictionary.profileContinue[lang.actual]);
	profileSwitcherLabel = $derived(dictionary.profileSwitcherLabel[lang.actual]);
	profileSwitchHeading = $derived(dictionary.profileSwitchHeading[lang.actual]);
	profileAddAnother = $derived(dictionary.profileAddAnother[lang.actual]);
	profileKnownHeading = $derived(dictionary.profileKnownHeading[lang.actual]);
	statTime = $derived(dictionary.statTime[lang.actual]);
	statKcal = $derived(dictionary.statKcal[lang.actual]);
	statPortions = $derived(dictionary.statPortions[lang.actual]);
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
