import type { MeetingLanguageCode } from '$lib';
import { langStore } from '$lib/stores/langStore.svelte';

/**
 * Language wrapper exposing the `actual` property the dictionary expects.
 */
class LangWrapper {
	get actual(): MeetingLanguageCode {
		return langStore.locale;
	}
}

export const lang = new LangWrapper();
