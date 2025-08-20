import countries from '@/../public/data/atlas/v1/countries.json';
import aliasToCanonical from '@/../public/data/atlas/v1/countries-alias.json';
import letterIndex from '@/../public/data/atlas/v1/countries-letter-index.json';
import manifest from '@/../public/data/atlas/v1/dataset.json';

export type Country = (typeof countries)[number];

const countriesById = new Map<string, Country>(countries.map((c) => [c.id, c]));

// --- Public API ---

export const datasetInfo = {
	version: manifest.version,
	builtAt: new Date(manifest.builtAt),
	counts: manifest.counts
};

/**
 * All available countries, sorted by display name.
 */
export const allCountries = countries;

/**
 * Returns a country by its unique cca3 ID.
 */
export function getCountryById(id: string): Country | undefined {
	return countriesById.get(id);
}

/**
 * Canonicalizes an input string for matching.
 * This should match the logic used in the build script.
 */
export function canonicalize(raw: string): string {
	if (!raw || typeof raw !== 'string') return '';
	const lower = raw.toLowerCase().trim();
	const withoutLeadingArticle = lower.startsWith('the ') ? lower.slice(4) : lower;
	const nfd = withoutLeadingArticle.normalize('NFD');
	const withoutDiacritics = nfd.replace(/[\u0300-\u036f]/g, '');
	const onlyLetters = withoutDiacritics.replace(/[^a-z]/g, '');
	return onlyLetters;
}

/**
 * Resolves a user-provided alias to a canonical country ID (cca3).
 * Returns the cca3 ID if a match is found, otherwise null.
 */
export function resolveAlias(alias: string): string | null {
	const c = canonicalize(alias);
	return (aliasToCanonical as Record<string, string>)[c] || null;
}

/**
 * Finds all countries that start with a given letter.
 * The letter is automatically canonicalized to a lowercase a-z character.
 */
export function getCountriesByFirstLetter(letter: string): Country[] {
	const l = letter.toLowerCase().charAt(0);
	if (!/^[a-z]$/.test(l)) return [];
	const ids = (letterIndex as Record<string, string[]>)[l] || [];
	return ids.map((id) => getCountryById(id)).filter((c): c is Country => !!c);
}

/**
 * Returns a random letter from a-z that has at least one country starting with it.
 */
export function getRandomAvailableLetter(): string {
	const available = Object.keys(letterIndex);
	const randomIndex = Math.floor(Math.random() * available.length);
	return available[randomIndex];
} 