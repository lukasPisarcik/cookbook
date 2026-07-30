import { normalizeName } from './normalize';

/**
 * Ingredient imagery — one source of truth shared by the recipe detail rows,
 * the Špajza tile grid and the Nákup rows.
 *
 * Two layers, because 1484 distinct ingredient names against 22 product types
 * makes either one alone insufficient:
 *
 *  1. A curated keyword table of diacritic-free Slovak stems, matched
 *     longest-first against `normalizeName(name)` — so „kokosové mlieko" is a
 *     coconut, not a carton of milk.
 *  2. A product-type map covering the workbook taxonomy, so anything the
 *     keywords miss still gets an emoji.
 *
 * The tile's background tint *always* comes from the product type, never from
 * the keyword: a section of rows then reads as one colour family even where the
 * emoji is generic. Pure and asset-free — no images to source, licence or ship,
 * and unit-testable.
 */

export interface IngredientIcon {
	emoji: string;
	/** Tailwind tile classes, light + dark. */
	tint: string;
}

/**
 * Diacritic-free stems (`normalizeName` strips diacritics before matching).
 * Longest match wins, so a more specific stem can override a generic one:
 * „arašidové maslo" is 🥜 while plain „maslo" is 🧈.
 */
const KEYWORD_EMOJI: Record<string, string> = {
	// — meat, fish, eggs ------------------------------------------------------
	'kuracie prsia': '🍗',
	kurac: '🍗',
	kura: '🍗',
	morcac: '🦃',
	hovadz: '🥩',
	'mlete maso': '🥩',
	maso: '🥩',
	slanina: '🥓',
	sunka: '🍖',
	salama: '🍖',
	parky: '🌭',
	klobas: '🌭',
	losos: '🐟',
	tuniak: '🐟',
	makrela: '🐟',
	treska: '🐟',
	ryba: '🐟',
	krevet: '🦐',
	vajc: '🥚',
	vajec: '🥚',
	bielky: '🥚',
	tofu: '🧆',
	tempeh: '🧆',
	'proteinovy chlieb': '🍞',
	'proteinovy prasok': '🥛',
	protein: '💪',

	// — dairy -----------------------------------------------------------------
	'grecky jogurt': '🥣',
	jogurt: '🥛',
	'kokosove mlieko': '🥥',
	mlieko: '🥛',
	smotana: '🥛',
	kefir: '🥛',
	'arasidove maslo': '🥜',
	'orieskove maslo': '🥜',
	'kesu maslo': '🥜',
	maslo: '🧈',
	ghee: '🧈',
	tvaroh: '🥛',
	lucina: '🥛',
	cottage: '🥛',
	riccota: '🥛',
	ricotta: '🥛',
	mozzarella: '🧀',
	parmezan: '🧀',
	eidam: '🧀',
	bryndza: '🧀',
	burrata: '🧀',
	feta: '🧀',
	niva: '🧀',
	syr: '🧀',

	// — vegetables ------------------------------------------------------------
	cesnak: '🧄',
	'jarna cibul': '🌿',
	cibul: '🧅',
	salotka: '🧅',
	mrkva: '🥕',
	pretlak: '🍅',
	paradajk: '🍅',
	kecup: '🍅',
	uhork: '🥒',
	cuket: '🥒',
	'mleta paprika': '🌶️',
	paprik: '🫑',
	chili: '🌶️',
	sriracha: '🌶️',
	wasabi: '🌶️',
	baklazan: '🍆',
	brokolica: '🥦',
	karfiol: '🥦',
	kapust: '🥬',
	spenat: '🥬',
	rukola: '🥬',
	salat: '🥬',
	redkovka: '🥬',
	zeler: '🥬',
	kel: '🥬',
	zemiak: '🥔',
	batat: '🍠',
	kukurica: '🌽',
	hrask: '🫛',
	hrasok: '🫛',
	edamame: '🫛',
	cicer: '🫘',
	fazul: '🫘',
	cocovic: '🫘',
	hummus: '🫘',
	sampiny: '🍄',
	hrib: '🍄',
	huby: '🍄',
	zazvor: '🫚',
	tekvic: '🎃',
	olivy: '🫒',
	avokado: '🥑',

	// — fruit -----------------------------------------------------------------
	banan: '🍌',
	jablk: '🍎',
	hrusk: '🍐',
	jahod: '🍓',
	cucoriedk: '🫐',
	malin: '🫐',
	ostruzin: '🫐',
	brusnic: '🫐',
	'lesne ovocie': '🫐',
	citron: '🍋',
	limetk: '🍋',
	pomaranc: '🍊',
	mandarink: '🍊',
	mango: '🥭',
	papaja: '🥭',
	ananas: '🍍',
	kiwi: '🥝',
	hrozno: '🍇',
	broskyn: '🍑',
	nektarink: '🍑',
	melon: '🍉',
	cheresn: '🍒',
	visn: '🍒',
	'kokosovy cukor': '🥥',
	'kokosovy olej': '🥥',
	kokos: '🥥',

	// — grains, pasta, bakery -------------------------------------------------
	'ovsene vlocky': '🌾',
	vlocky: '🌾',
	ovsen: '🌾',
	muka: '🌾',
	krupic: '🌾',
	bulgur: '🌾',
	kinoa: '🌾',
	quinoa: '🌾',
	skrob: '🌾',
	ryza: '🍚',
	kuskus: '🍚',
	rezanc: '🍜',
	cestovin: '🍝',
	spagety: '🍝',
	gnocchi: '🥟',
	toast: '🍞',
	chlieb: '🍞',
	drozdie: '🍞',
	zemla: '🥖',
	bageta: '🥖',
	pecivo: '🥖',
	tortilla: '🌯',
	wrap: '🌯',
	granola: '🥣',
	musli: '🥣',
	palacink: '🥞',
	krekr: '🍘',
	'ryzove chlebiky': '🍘',

	// — nuts & seeds ----------------------------------------------------------
	mandle: '🌰',
	orech: '🌰',
	oriesok: '🌰',
	muskat: '🌰',
	kesu: '🌰',
	arasid: '🥜',
	pistac: '🥜',
	'sezamovy olej': '🌱',
	sezam: '🌱',
	chia: '🌱',
	lnene: '🌱',
	semienk: '🌱',
	slnecnicove: '🌱',
	tahini: '🌱',
	mak: '🌱',

	// — sweet -----------------------------------------------------------------
	med: '🍯',
	sirup: '🍯',
	dzem: '🍯',
	marmelad: '🍯',
	cukor: '🍬',
	sladidlo: '🍬',
	stevia: '🍬',
	erytritol: '🍬',
	cokolad: '🍫',
	kakao: '🍫',
	vanilk: '🍦',
	zmrzlin: '🍨',

	// — spices, herbs, stock --------------------------------------------------
	sol: '🧂',
	korenie: '🧂',
	skorica: '🧂',
	kurkuma: '🧂',
	rasca: '🧂',
	klincek: '🧂',
	vegeta: '🧂',
	'kypriaci prasok': '🧂',
	soda: '🧂',
	oregano: '🌿',
	bazalka: '🌿',
	tymian: '🌿',
	rozmarin: '🌿',
	petrzlen: '🌿',
	pazitka: '🌿',
	koriander: '🌿',
	salvia: '🌿',
	kopor: '🌿',
	'bobkovy list': '🌿',
	pesto: '🌿',
	mata: '🌿',
	vyvar: '🍲',
	kari: '🍛',

	// — oils, vinegars, sauces ------------------------------------------------
	'olivovy olej': '🫒',
	olej: '🫒',
	balzamiko: '🍶',
	ocot: '🍶',
	'sojova omacka': '🍶',
	omacka: '🥫',
	horcica: '🌭',
	majonez: '🥚',

	// — drinks & misc ---------------------------------------------------------
	kava: '☕',
	caj: '🍵',
	stava: '🧃',
	vino: '🍷',
	pivo: '🍺',
	voda: '💧',
	nori: '🍙',
	riasy: '🍙'
};

/**
 * The workbook taxonomy (`seed/blueprint.json` → `productTypes`) plus the
 * `ostatné` fallback that `pantry.add` assigns when a name matches no recipe.
 * Keys must match the taxonomy *exactly*, typo'd „mliečné" and the slash in
 * „čaj/káva" included — a unit test asserts every blueprint value resolves
 * here, so a future taxonomy change fails loudly instead of going grey.
 */
const TYPE_ICON: Record<string, IngredientIcon> = {
	bylinky: { emoji: '🌿', tint: 'bg-green-100 dark:bg-green-500/15' },
	cereálie: { emoji: '🌾', tint: 'bg-amber-100 dark:bg-amber-500/15' },
	cestoviny: { emoji: '🍝', tint: 'bg-yellow-100 dark:bg-yellow-500/15' },
	'čaj/káva': { emoji: '☕', tint: 'bg-stone-200 dark:bg-stone-500/20' },
	'chladené výrobky': { emoji: '🧊', tint: 'bg-sky-100 dark:bg-sky-500/15' },
	iné: { emoji: '🥄', tint: 'bg-slate-100 dark:bg-slate-500/15' },
	konzervy: { emoji: '🥫', tint: 'bg-zinc-200 dark:bg-zinc-500/20' },
	korenie: { emoji: '🧂', tint: 'bg-orange-100 dark:bg-orange-500/15' },
	'mliečné výrobky': { emoji: '🥛', tint: 'bg-blue-100 dark:bg-blue-500/15' },
	'mrazené výrobky': { emoji: '❄️', tint: 'bg-cyan-100 dark:bg-cyan-500/15' },
	nápoje: { emoji: '🧃', tint: 'bg-teal-100 dark:bg-teal-500/15' },
	oleje: { emoji: '🫒', tint: 'bg-lime-100 dark:bg-lime-500/15' },
	omáčky: { emoji: '🥫', tint: 'bg-red-100 dark:bg-red-500/15' },
	ovocie: { emoji: '🍎', tint: 'bg-rose-100 dark:bg-rose-500/15' },
	pečivo: { emoji: '🍞', tint: 'bg-neutral-200 dark:bg-neutral-500/20' },
	protein: { emoji: '💪', tint: 'bg-violet-100 dark:bg-violet-500/15' },
	'rastlinné výrobky': { emoji: '🌱', tint: 'bg-purple-100 dark:bg-purple-500/15' },
	semienka: { emoji: '🌱', tint: 'bg-gray-200 dark:bg-gray-500/20' },
	sladidlá: { emoji: '🍯', tint: 'bg-fuchsia-100 dark:bg-fuchsia-500/15' },
	sladkosti: { emoji: '🍫', tint: 'bg-pink-100 dark:bg-pink-500/15' },
	zaváraniny: { emoji: '🫙', tint: 'bg-indigo-100 dark:bg-indigo-500/15' },
	zelenina: { emoji: '🥬', tint: 'bg-emerald-100 dark:bg-emerald-500/15' },
	// `pantry.add`'s fallback product type — semantically the same bucket as „iné".
	ostatné: { emoji: '🥄', tint: 'bg-slate-100 dark:bg-slate-500/15' }
};

/** Last resort: an unknown name *and* an unknown product type. */
const FALLBACK: IngredientIcon = { emoji: '🥄', tint: 'bg-muted' };

/** Sorted once at module load so the longest (most specific) stem wins. */
const SORTED_KEYWORDS = Object.keys(KEYWORD_EMOJI).sort((a, b) => b.length - a.length);

/**
 * Resolve an ingredient's emoji + tile tint. Never returns a blank tile: an
 * unmatched name falls back to its product type, and an unknown product type
 * falls back to a spoon on the muted surface.
 */
export function ingredientIcon(name: string, productType?: string): IngredientIcon {
	const norm = normalizeName(name);
	const base = (productType !== undefined && TYPE_ICON[productType]) || FALLBACK;

	for (const keyword of SORTED_KEYWORDS) {
		if (norm.includes(keyword)) {
			return { emoji: KEYWORD_EMOJI[keyword], tint: base.tint };
		}
	}
	return base;
}
