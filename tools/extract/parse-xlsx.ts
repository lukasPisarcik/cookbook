/**
 * Parse all four sheets of `Zoznam receptov.xlsx` into `seed/blueprint.json`.
 *
 * The workbook is the behavioural blueprint: 129 coded recipes (R1…R129),
 * ~1,100 pre-structured ingredient rows with the product-type taxonomy,
 * and the persistent-pantry seed („Mám doma?" ticks).
 *
 * Offline tooling — run once with:
 *   bun tools/extract/parse-xlsx.ts [path-to-xlsx]
 */

import * as XLSX from 'xlsx';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RecipeCategory } from '../../src/lib/schemas/schemas';

const DEFAULT_SOURCE = join(
	process.env.HOME ?? '~',
	'Desktop',
	'Všetky recepty',
	'Zoznam receptov.xlsx'
);

const CATEGORY_MAP: Record<string, RecipeCategory> = {
	raňajky: 'ranajky',
	obedy: 'obedy',
	večere: 'vecere',
	snacky: 'snacky',
	smoothies: 'smoothies',
	'letné drinky': 'drinky',
	dezerty: 'dezerty',
	základy: 'zaklady'
};

export interface BlueprintRecipe {
	code: string;
	title: string;
	category: RecipeCategory;
	kcalPerPortion?: number;
	sourceLocation: string;
	cooking: boolean;
}

export interface BlueprintIngredient {
	name: string;
	quantity?: number;
	unit?: string;
	productType: string;
}

export interface BlueprintPantryItem {
	name: string;
	productType: string;
}

export interface Blueprint {
	recipes: BlueprintRecipe[];
	ingredientsByCode: Record<string, BlueprintIngredient[]>;
	pantry: BlueprintPantryItem[];
	productTypes: string[];
}

function asTrimmedString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

function asOptionalNumber(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

export function parseWorkbook(path: string): Blueprint {
	const workbook = XLSX.readFile(path);

	const recipesRows: unknown[][] = XLSX.utils.sheet_to_json(workbook.Sheets['Zoznam receptov'], {
		header: 1
	});
	const recipes: BlueprintRecipe[] = [];
	for (const row of recipesRows.slice(1)) {
		const [category, code, title, sourceLocation, kcal, cooking] = row;
		if (!code || !title) continue;
		const mapped = CATEGORY_MAP[asTrimmedString(category).toLowerCase()];
		if (!mapped) {
			throw new Error(`Unknown category "${category}" for recipe ${code}`);
		}
		recipes.push({
			code: asTrimmedString(code),
			title: asTrimmedString(title),
			category: mapped,
			kcalPerPortion: asOptionalNumber(kcal),
			sourceLocation: asTrimmedString(sourceLocation),
			cooking: cooking === true
		});
	}

	const ingredientRows: unknown[][] = XLSX.utils.sheet_to_json(workbook.Sheets['Zoznam potravín'], {
		header: 1
	});
	const ingredientsByCode: Record<string, BlueprintIngredient[]> = {};
	const productTypes = new Set<string>();
	for (const row of ingredientRows.slice(1)) {
		const [code, name, quantity, unit, productType] = row;
		if (!code || !name) continue;
		const entry: BlueprintIngredient = {
			name: asTrimmedString(name),
			quantity: asOptionalNumber(quantity),
			unit: asTrimmedString(unit) || undefined,
			productType: asTrimmedString(productType) || 'ostatné'
		};
		productTypes.add(entry.productType);
		(ingredientsByCode[asTrimmedString(code)] ??= []).push(entry);
	}

	const pantryRows: unknown[][] = XLSX.utils.sheet_to_json(workbook.Sheets['Check čo máš doma'], {
		header: 1
	});
	const pantry: BlueprintPantryItem[] = [];
	for (const row of pantryRows.slice(1)) {
		const [mamDoma, name, , , productType] = row;
		const trimmedName = asTrimmedString(name);
		if (trimmedName === '') continue;
		if (mamDoma === true) {
			pantry.push({ name: trimmedName, productType: asTrimmedString(productType) || 'ostatné' });
		}
	}

	return {
		recipes,
		ingredientsByCode,
		pantry,
		productTypes: [...productTypes].sort((a, b) => a.localeCompare(b, 'sk'))
	};
}

if (import.meta.main) {
	const source = process.argv[2] ?? DEFAULT_SOURCE;
	const blueprint = parseWorkbook(source);

	const withIngredients = blueprint.recipes.filter(
		(recipe) => (blueprint.ingredientsByCode[recipe.code] ?? []).length > 0
	).length;

	mkdirSync('seed', { recursive: true });
	writeFileSync(join('seed', 'blueprint.json'), JSON.stringify(blueprint, null, '\t'));

	console.log(`recipes:      ${blueprint.recipes.length}`);
	console.log(`with ingredients: ${withIngredients}`);
	console.log(`cooking now:  ${blueprint.recipes.filter((r) => r.cooking).length}`);
	console.log(`pantry items: ${blueprint.pantry.length}`);
	console.log(`product types: ${blueprint.productTypes.length}`);
	console.log('wrote seed/blueprint.json');
}
