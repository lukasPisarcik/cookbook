import { dictionary } from '$lib/dictionary/dictionary';
import {
	MeetingLanguageCode as MeetingLanguageCodeSchema,
	type MeetingLanguageCode,
	DEFAULT_MEETING_LANGUAGE_CODE
} from '$lib/schemas';

type DictionaryShape = typeof dictionary;
export type DictionaryKey = keyof DictionaryShape;
export type DictionaryLang = MeetingLanguageCode;

export function resolveDictionaryLang(
	acceptLanguageHeader: string | null | undefined,
	fallback: DictionaryLang = DEFAULT_MEETING_LANGUAGE_CODE
): DictionaryLang {
	const languageTag = acceptLanguageHeader?.split(',')[0]?.trim();
	if (!languageTag) return fallback;
	const normalized = languageTag.toLowerCase().replace('-', '_');
	const parsed = MeetingLanguageCodeSchema.safeParse(normalized);
	return parsed.success ? parsed.data : fallback;
}

export function translateDictionaryValue(key: DictionaryKey, lang: DictionaryLang): string {
	return dictionary[key][lang] ?? dictionary[key][DEFAULT_MEETING_LANGUAGE_CODE];
}

export function getRequestTranslator(
	request: Request,
	fallback: DictionaryLang = DEFAULT_MEETING_LANGUAGE_CODE
) {
	const lang = resolveDictionaryLang(request.headers.get('accept-language'), fallback);
	return (key: DictionaryKey): string => translateDictionaryValue(key, lang);
}
